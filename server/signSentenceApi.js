import { Readable } from 'node:stream'
import { createConcurrencyLimit, createRateLimiter, readBodyText, BodyTooLargeError } from './apiGuard.js'
import { checkSentence, parseSentenceRequest, sentenceInstruction } from './signSentence.js'

// POST /api/sign-sentence {glosses: string[], language: "en"|"hi"} -> {text}
// Turns recognised ISL signs into one natural English or Hindi sentence.
// The key stays on the server. A rewrite that loses negation or numbers is
// refused (422) so the UI keeps its rule-based sentence.

const apiKey = process.env.GEMINI_API_KEY?.trim()
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const perAddress = createRateLimiter({ limit: 60, windowMs: 60_000 })
const providerSlots = createConcurrencyLimit(4)

function json(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
  response.end(JSON.stringify(body))
}

async function sentence(request, response) {
  if (!apiKey) return json(response, 503, { error: 'Online sentences are unavailable.' })
  const rate = perAddress(request.socket.remoteAddress || 'local')
  if (!rate.allowed) return json(response, 429, {}, { 'Retry-After': rate.retryAfterSeconds })
  let parsed
  try {
    parsed = parseSentenceRequest(JSON.parse(await readBodyText({
      headers: new Headers(request.headers),
      body: Readable.toWeb(request),
    }, 4096)))
  } catch (error) {
    if (!response.destroyed) json(response, error instanceof BodyTooLargeError ? 413 : 400, {})
    return
  }
  if (!parsed) return json(response, 400, {})
  const release = providerSlots.acquire()
  if (!release) return json(response, 429, {}, { 'Retry-After': '1' })
  const controller = new AbortController()
  const onClose = () => controller.abort()
  response.once('close', onClose)
  try {
    const providerResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sentenceInstruction(parsed.language) }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(parsed.glosses) }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 400,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseJsonSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
        },
      }),
    })
    if (!providerResponse.ok) return json(response, providerResponse.status === 429 ? 429 : 502, {})
    const payload = await providerResponse.json()
    const output = payload.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || '').join('')
    const text = JSON.parse(output || '{}').text
    if (!checkSentence(parsed.glosses, text, parsed.language)) return json(response, 422, {})
    json(response, 200, { text: text.trim(), language: parsed.language })
  } catch {
    if (!response.destroyed) json(response, 502, {})
  } finally {
    response.off('close', onClose)
    release()
  }
}

export function signSentenceApi(request, response, next) {
  const pathname = new URL(request.url, 'http://localhost').pathname
  if (pathname === '/api/sign-sentence' && request.method === 'POST') {
    void sentence(request, response).catch(() => {
      if (!response.destroyed && !response.headersSent) json(response, 502, {})
    })
    return
  }
  next()
}
