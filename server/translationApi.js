import { Readable } from 'node:stream'
import { createConcurrencyLimit, createRateLimiter, readBodyText, BodyTooLargeError } from './apiGuard.js'
import { SYSTEM_INSTRUCTION } from './translationPrompt.js'
import { MAX_ONLINE_TEXT_LENGTH, sanitizeTokens } from '../src/translation/islVocabulary.js'

const apiKey = process.env.GEMINI_API_KEY?.trim()
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const perAddress = createRateLimiter({ limit: 30, windowMs: 60_000 })
const providerSlots = createConcurrencyLimit(4)

function json(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
  response.end(JSON.stringify(body))
}

async function translate(request, response) {
  if (!apiKey) return json(response, 503, { tokens: [], error: 'Online translation is unavailable.' })
  const rate = perAddress(request.socket.remoteAddress || 'local')
  if (!rate.allowed) return json(response, 429, { tokens: [] }, { 'Retry-After': rate.retryAfterSeconds })

  let text
  try {
    const body = JSON.parse(await readBodyText({
      headers: new Headers(request.headers),
      body: Readable.toWeb(request),
    }, 8192))
    text = typeof body?.text === 'string' ? body.text.trim() : ''
  } catch (error) {
    if (!response.destroyed) json(response, error instanceof BodyTooLargeError ? 413 : 400, { tokens: [] })
    return
  }
  if (!text) return json(response, 400, { tokens: [] })
  if (text.length > MAX_ONLINE_TEXT_LENGTH) return json(response, 413, { tokens: [] })

  const release = providerSlots.acquire()
  if (!release) return json(response, 429, { tokens: [] }, { 'Retry-After': '1' })
  const controller = new AbortController()
  const onClose = () => controller.abort()
  response.once('close', onClose)
  try {
    const providerResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(6000)]),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
          responseJsonSchema: { type: 'array', items: { type: 'string' } },
        },
      }),
    })
    if (!providerResponse.ok) return json(response, providerResponse.status === 429 ? 429 : 502, { tokens: [] })
    const payload = await providerResponse.json()
    const output = payload.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || '').join('')
    const tokens = sanitizeTokens(JSON.parse(output || '[]'))
    json(response, tokens.length ? 200 : 422, { tokens })
  } catch {
    if (!response.destroyed) json(response, 502, { tokens: [] })
  } finally {
    response.off('close', onClose)
    release()
  }
}

export function translationApi(request, response, next) {
  const pathname = new URL(request.url, 'http://localhost').pathname
  if (pathname === '/api/config' && request.method === 'GET') {
    return json(response, 200, { online: Boolean(apiKey) })
  }
  if (pathname === '/api/translate-isl' && request.method === 'POST') {
    void translate(request, response).catch(() => {
      if (!response.destroyed && !response.headersSent) json(response, 502, { tokens: [] })
    })
    return
  }
  next()
}
