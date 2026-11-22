import { Readable } from 'node:stream'
import { createConcurrencyLimit, createRateLimiter, readBodyText, BodyTooLargeError } from './apiGuard.js'
import {
  MAX_BODY_BYTES, loadVocabulary, parseSignVideoOutput, parseSignVideoRequest,
  signVideoInstruction, signVideoPrompt, vocabularyMatcher,
} from './signVideo.js'

// GET  /api/sign-video                      -> {available, provider}
// POST /api/sign-video {frames: base64 JPEG[], hints?: [{word, confidence}]}
//                                           -> {word | null, confidence, provider, ms}
// Reads one finished sign from a short clip of webcam frames with a vision
// model: Gemini when GEMINI_API_KEY is set, otherwise an Azure OpenAI vision
// deployment. Keys stay on the server; frames are not stored.

const vocabulary = loadVocabulary()
const match = vocabularyMatcher(vocabulary)
const instruction = signVideoInstruction(vocabulary)
const perAddress = createRateLimiter({ limit: 40, windowMs: 60_000 })
const providerSlots = createConcurrencyLimit(3)

function provider() {
  const gemini = process.env.GEMINI_API_KEY?.trim()
  if (gemini) return { name: 'gemini', key: gemini }
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim().replace(/\/$/, '')
  const key = process.env.AZURE_OPENAI_API_KEY?.trim()
  const deployment = (process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT)?.trim()
  if (endpoint?.startsWith('https://') && key && deployment) return { name: 'azure', key, endpoint, deployment }
  return null
}

async function askGemini(config, frames, hints, signal) {
  const model = process.env.GEMINI_SIGN_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.key },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: 'user', parts: [
        { text: signVideoPrompt(hints) },
        ...frames.map((data) => ({ inlineData: { mimeType: 'image/jpeg', data } })),
      ] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: Number(process.env.GEMINI_SIGN_THINKING ?? 512) },
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: { word: { type: 'string' }, confidence: { type: 'number' } },
          required: ['word', 'confidence'],
        },
      },
    }),
  })
  if (!response.ok) throw Object.assign(new Error('provider'), { status: response.status })
  const payload = await response.json()
  return payload.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || '').join('')
}

async function askAzure(config, frames, hints, signal) {
  const url = new URL(`${config.endpoint}/openai/deployments/${encodeURIComponent(config.deployment)}/chat/completions`)
  url.searchParams.set('api-version', process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-10-21')
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': config.key },
    signal,
    body: JSON.stringify({
      messages: [
        { role: 'system', content: instruction },
        { role: 'user', content: [
          { type: 'text', text: signVideoPrompt(hints) },
          ...frames.map((data) => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${data}`, detail: 'high' } })),
        ] },
      ],
      max_completion_tokens: 1024,
      // Only reasoning models (o-series, gpt-5) accept this; gpt-4o rejects it.
      ...(process.env.AZURE_OPENAI_REASONING_EFFORT ? { reasoning_effort: process.env.AZURE_OPENAI_REASONING_EFFORT } : {}),
      ...(process.env.AZURE_OPENAI_REASONING_EFFORT ? {} : { temperature: 0, response_format: { type: 'json_object' } }),
    }),
  })
  if (!response.ok) throw Object.assign(new Error('provider'), { status: response.status })
  const payload = await response.json()
  return payload.choices?.[0]?.message?.content || ''
}

/** One request to the configured provider; exported for the offline benchmark. */
export async function readSignFrames(frames, hints, signal = AbortSignal.timeout(30_000)) {
  const config = provider()
  if (!config) throw Object.assign(new Error('unavailable'), { status: 503 })
  const started = performance.now()
  const text = await (config.name === 'gemini' ? askGemini : askAzure)(config, frames, hints, signal)
  const parsed = parseSignVideoOutput(text, match)
  if (!parsed) throw Object.assign(new Error('invalid output'), { status: 502 })
  return { ...parsed, provider: 'video', ms: Math.round(performance.now() - started) }
}

function json(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
  response.end(JSON.stringify(body))
}

async function read(request, response) {
  if (!provider()) return json(response, 503, { error: 'Video sign reading is unavailable.' })
  const rate = perAddress(request.socket.remoteAddress || 'local')
  if (!rate.allowed) return json(response, 429, {}, { 'Retry-After': rate.retryAfterSeconds })
  let parsed
  try {
    parsed = parseSignVideoRequest(JSON.parse(await readBodyText({
      headers: new Headers(request.headers),
      body: Readable.toWeb(request),
    }, MAX_BODY_BYTES)), match)
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
    const result = await readSignFrames(parsed.frames, parsed.hints, AbortSignal.any([controller.signal, AbortSignal.timeout(30_000)]))
    json(response, 200, result)
  } catch (error) {
    if (!response.destroyed) json(response, error.status === 429 ? 429 : 502, {})
  } finally {
    response.off('close', onClose)
    release()
  }
}

export function signVideoApi(request, response, next) {
  const pathname = new URL(request.url, 'http://localhost').pathname
  if (pathname !== '/api/sign-video') return next()
  if (request.method === 'GET') {
    const config = provider()
    return json(response, 200, { available: Boolean(config), provider: config ? 'video' : null })
  }
  if (request.method === 'POST') {
    void read(request, response).catch(() => {
      if (!response.destroyed && !response.headersSent) json(response, 502, {})
    })
    return
  }
  next()
}
