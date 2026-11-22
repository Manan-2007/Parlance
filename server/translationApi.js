import { Readable } from 'node:stream'
import { createConcurrencyLimit, createRateLimiter, readBodyText, BodyTooLargeError } from './apiGuard.js'
import { SYSTEM_INSTRUCTION } from './translationPrompt.js'
import { MAX_ONLINE_TEXT_LENGTH, sanitizeTokens } from '../src/translation/islVocabulary.js'

const apiKey = process.env.GEMINI_API_KEY?.trim()
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

/** Azure OpenAI (e.g. gpt-4o), used when there is no Gemini key. */
function azure() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim().replace(/\/$/, '')
  const key = process.env.AZURE_OPENAI_API_KEY?.trim()
  const deployment = (process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT)?.trim()
  return endpoint?.startsWith('https://') && key && deployment ? { endpoint, key, deployment } : null
}
const online = () => Boolean(apiKey || azure())

/** Gemini returns an array; Azure (JSON mode) an object holding one. */
export function tokensFromModel(output) {
  const decoded = JSON.parse(String(output || '[]').trim().replace(/^```(?:json)?\s*|\s*```$/g, ''))
  return Array.isArray(decoded) ? decoded : Array.isArray(decoded?.tokens) ? decoded.tokens : []
}

async function askAzure(config, text, signal) {
  const url = new URL(`${config.endpoint}/openai/deployments/${encodeURIComponent(config.deployment)}/chat/completions`)
  url.searchParams.set('api-version', process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-10-21')
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': config.key },
    signal,
    body: JSON.stringify({
      messages: [
        { role: 'system', content: `${SYSTEM_INSTRUCTION}\n\nWrap the array in a JSON object: {"tokens": [...]}.` },
        { role: 'user', content: text },
      ],
      temperature: 0,
      max_completion_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
  })
  if (!response.ok) return { status: response.status }
  const payload = await response.json()
  return { output: payload.choices?.[0]?.message?.content || '' }
}
const perAddress = createRateLimiter({ limit: 30, windowMs: 60_000 })
const providerSlots = createConcurrencyLimit(4)

function json(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
  response.end(JSON.stringify(body))
}

async function translate(request, response) {
  if (!online()) return json(response, 503, { tokens: [], error: 'Online translation is unavailable.' })
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
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(6000)])
    let output
    if (apiKey) {
      const providerResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal,
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
      output = payload.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || '').join('')
    } else {
      const answer = await askAzure(azure(), text, signal)
      if (answer.status) return json(response, answer.status === 429 ? 429 : 502, { tokens: [] })
      output = answer.output
    }
    const tokens = sanitizeTokens(tokensFromModel(output))
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
    return json(response, 200, { online: online() })
  }
  if (pathname === '/api/translate-isl' && request.method === 'POST') {
    void translate(request, response).catch(() => {
      if (!response.destroyed && !response.headersSent) json(response, 502, { tokens: [] })
    })
    return
  }
  next()
}
