import { Readable } from 'node:stream'
import { BodyTooLargeError, createConcurrencyLimit, createRateLimiter, readBodyText } from './apiGuard.js'

export const SPEECH_VOICES = [
  { id: 'en-IN-NeerjaNeural', name: 'Neerja · Soft Indian English', lang: 'en-IN', style: 'empathetic' },
  { id: 'en-US-AvaMultilingualNeural', name: 'Ava · American English', lang: 'en-US' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara · Soft Hindi', lang: 'hi-IN', style: 'empathetic' },
]
const rateLimit = createRateLimiter({ limit: 30, windowMs: 60_000 })
const providerSlots = createConcurrencyLimit(4)

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(body))
}

export function speechConfiguration() {
  return { enabled: Boolean(process.env.AZURE_SPEECH_KEY?.trim()), defaultVoice: SPEECH_VOICES[0].id, voices: SPEECH_VOICES }
}

export function speechMarkup(text, voice, rate) {
  const escaped = text.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character])
  const percent = Math.round((rate * 0.93 - 1) * 100)
  const prosody = `<prosody rate="${percent}%" pitch="-1st" volume="soft">${escaped}</prosody>`
  const content = voice.style ? `<mstts:express-as style="${voice.style}">${prosody}</mstts:express-as>` : prosody
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${voice.lang}"><voice name="${voice.id}">${content}</voice></speak>`
}

async function synthesise(request, response) {
  const key = process.env.AZURE_SPEECH_KEY?.trim()
  if (!key) return json(response, 503, { error: 'Azure Speech needs its resource key in the server environment.' })
  if (!rateLimit(request.socket.remoteAddress || 'local').allowed) return json(response, 429, { error: 'Please wait a moment before requesting more speech.' })
  let body
  try {
    body = JSON.parse(await readBodyText({ headers: new Headers(request.headers), body: Readable.toWeb(request) }, 16384))
  } catch (error) {
    return json(response, error instanceof BodyTooLargeError ? 413 : 400, { error: 'The speech request could not be read.' })
  }
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const voiceId = body?.voice || (/\p{Script=Devanagari}/u.test(text) ? 'hi-IN-SwaraNeural' : SPEECH_VOICES[0].id)
  const voice = SPEECH_VOICES.find(voice => voice.id === voiceId)
  const rate = body?.rate ?? 1
  if (!text || text.length > 3000 || !voice || typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0.7 || rate > 1.3) {
    return json(response, 400, { error: 'Choose a supported voice, a rate from 0.7 to 1.3, and up to 3000 characters.' })
  }
  const release = providerSlots.acquire()
  if (!release) return json(response, 429, { error: 'Speech is busy. Please try again shortly.' })
  const controller = new AbortController()
  const abort = () => controller.abort()
  response.once('close', abort)
  try {
    const region = process.env.AZURE_SPEECH_REGION?.trim() || 'southeastasia'
    const endpoint = process.env.AZURE_SPEECH_ENDPOINT?.trim().replace(/\/$/, '') || `https://${region}.tts.speech.microsoft.com`
    const path = endpoint.includes('.cognitiveservices.azure.com') ? '/tts/cognitiveservices/v1' : '/cognitiveservices/v1'
    const provider = await fetch(`${endpoint}${path}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'Parlance',
      },
      body: speechMarkup(text, voice, rate),
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
    })
    if (!provider.ok) {
      const error = provider.status === 401 || provider.status === 403
        ? 'Azure Speech rejected the resource key or region. Check the server Speech settings.'
        : 'Azure Speech is unavailable. Please try speaking again shortly.'
      return json(response, provider.status === 429 ? 429 : 502, { error })
    }
    const audio = Buffer.from(await provider.arrayBuffer())
    if (response.destroyed) return
    response.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Cache-Control': 'no-store' })
    response.end(audio)
  } catch {
    if (!response.destroyed) json(response, 502, { error: 'Speech could not be generated. Please try again.' })
  } finally {
    response.off('close', abort)
    release()
  }
}

export function speechApi(request, response, next) {
  const pathname = new URL(request.url, 'http://localhost').pathname
  if (pathname === '/api/speech/config' && request.method === 'GET') return json(response, 200, speechConfiguration())
  if (pathname === '/api/speech' && request.method === 'POST') {
    void synthesise(request, response).catch(() => {
      if (!response.destroyed && !response.headersSent) json(response, 502, { error: 'Speech is unavailable.' })
    })
    return
  }
  next()
}
