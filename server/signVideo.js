// Video clip of one sign -> one ISL word, read by a vision model. Pure helpers
// shared by the API route, tests and the offline benchmark: the vocabulary,
// request validation, the prompt and output parsing.
import { readFileSync } from 'node:fs'

export const MAX_FRAMES = 16
const MAX_FRAME_BASE64 = 220_000
export const MAX_BODY_BYTES = MAX_FRAMES * MAX_FRAME_BASE64 + 8192

/** Same keys as the recognizer (`backend/model.py gloss_key`). */
export const glossKey = (label) => label.toLowerCase().replaceAll('_', '')
const loose = (word) => word.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Every word either bundled model knows, keyed like the recognizer's output. */
export function loadVocabulary(directory = new URL('../backend/models/', import.meta.url)) {
  const words = new Set()
  for (const file of ['isl-transformer.json', 'isl-temporal-model.json']) {
    try {
      const { labels } = JSON.parse(readFileSync(new URL(file, directory), 'utf8'))
      for (const label of labels ?? []) if (label !== '__NONE__') words.add(glossKey(label))
    } catch {
      // A missing model only shrinks the vocabulary.
    }
  }
  return [...words].sort()
}

export function vocabularyMatcher(vocabulary) {
  const byLoose = new Map(vocabulary.map((word) => [loose(word), word]))
  return (word) => (typeof word === 'string' ? byLoose.get(loose(word)) ?? null : null)
}

export function parseSignVideoRequest(body, match) {
  const frames = Array.isArray(body?.frames) ? body.frames : null
  if (!frames || frames.length < 2 || frames.length > MAX_FRAMES) return null
  // Base64 JPEG only ("/9j/" is the JPEG start-of-image marker).
  if (!frames.every((f) => typeof f === 'string' && f.length <= MAX_FRAME_BASE64 && f.startsWith('/9j/') && /^[A-Za-z0-9+/]+=*$/.test(f))) return null
  const hints = (Array.isArray(body?.hints) ? body.hints : [])
    .slice(0, 5)
    .map((hint) => ({ word: match(hint?.word), confidence: Number(hint?.confidence) }))
    .filter((hint) => hint.word && Number.isFinite(hint.confidence) && hint.confidence >= 0 && hint.confidence <= 1)
  return { frames, hints }
}

export function signVideoInstruction(vocabulary) {
  return `You are an expert interpreter of Indian Sign Language (ISL). You receive frames, in time order, from a webcam video of ONE isolated ISL sign (the camera image may be mirrored).

Identify the sign from what the hands do: handshape, palm orientation, location relative to the face and body, and above all the MOVEMENT across frames (waving, shaking, circling, tapping, moving apart). Many ISL signs are only distinguishable by movement, so compare the frames carefully. Ignore the person's appearance, clothing and background.

Answer with exactly one word from this vocabulary (ISL gloss keys, lowercase):
${vocabulary.join(', ')}

If the sign is not in the vocabulary, the hands are not signing, or the evidence is too weak, answer "UNKNOWN".
Return only JSON: {"word": "<one vocabulary entry or UNKNOWN>", "confidence": <0 to 1>}.`
}

export function signVideoPrompt(hints) {
  const lines = ['These frames are in chronological order. Which single ISL sign is performed?']
  if (hints.length) {
    lines.push(`A hand-tracking model's guesses, often wrong for new signers, so treat them only as weak hints: ${hints.map((h) => `${h.word} (${h.confidence.toFixed(2)})`).join(', ')}.`)
  }
  return lines.join('\n')
}

/** Model text -> {word, confidence}; word is a vocabulary key or null. */
export function parseSignVideoOutput(text, match) {
  let decoded
  try {
    decoded = JSON.parse(String(text ?? '').trim().replace(/^```(?:json)?\s*|\s*```$/g, ''))
  } catch {
    return null
  }
  if (typeof decoded?.word !== 'string') return null
  const confidence = Number(decoded.confidence)
  return {
    word: decoded.word.trim().toUpperCase() === 'UNKNOWN' ? null : match(decoded.word),
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
  }
}
