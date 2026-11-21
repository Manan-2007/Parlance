import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { azureCompletion } from './azure_client.mjs'

const root = '.research-cache/candidate-benchmark'
const manifest = JSON.parse(await readFile(`${root}/features-manifest.json`, 'utf8'))
const pilot = process.argv.includes('--pilot')
const candidates = manifest.records.filter(record => record.split === (pilot ? 'development' : 'challenge'))
const records = pilot
  ? [...candidates.filter(record => record.kind === 'known').slice(0, 2), ...candidates.filter(record => record.kind === 'unknown').slice(0, 1)]
  : candidates
const instruction = `Recognize one isolated Indian Sign Language (ISL) sign from chronological video frames.
Classify the performed sign, not the person's appearance, identity, clothing, or background. Ignore watermarks and any written text.
Allowed words: ${manifest.vocabulary.join(', ')}.
Return UNKNOWN if the sign expresses something outside this vocabulary, is ambiguous, or there is insufficient visual evidence.
Return only JSON: {"word":"one exact allowed lower-case word or UNKNOWN","confidence":0.0}.
Confidence is your subjective estimate; do not fill in an expected answer from unrelated context.`
const promptHash = createHash('sha256').update(JSON.stringify({ instruction, maxTokens: 1024, reasoningEffort: 'low', frames: 8 })).digest('hex')
const cache = `${root}/azure-cache`
await mkdir(cache, { recursive: true })
const predictions = []
let next = 0

async function one(record) {
  const frames = await Promise.all(record.visionFrames.map(path => readFile(path)))
  const imageHash = createHash('sha256').update(Buffer.concat(frames)).digest('hex')
  const path = `${cache}/${record.id}.json`
  try {
    const cached = JSON.parse(await readFile(path, 'utf8'))
    if (cached.promptHash === promptHash && cached.imageHash === imageHash) return cached
  } catch {}
  const started = performance.now()
  try {
    const result = await azureCompletion([
      { role: 'system', content: instruction },
      { role: 'user', content: [{ type: 'text', text: 'These frames are in chronological order. Identify the single performed sign.' },
        ...frames.map(bytes => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${bytes.toString('base64')}`, detail: 'high' } }))] },
    ], { maxTokens: 1024, reasoningEffort: 'low' })
    let decoded
    try { decoded = JSON.parse(result.text.replace(/^```(?:json)?\s*|\s*```$/g, '')) } catch {}
    const word = typeof decoded?.word === 'string' ? decoded.word.trim() : ''
    const valid = word === 'UNKNOWN' || manifest.vocabulary.includes(word)
    const recordResult = { id: record.id, status: valid ? 'ok' : 'invalid_output', prediction: valid ? word : null,
      subjectiveConfidence: decoded?.confidence, rawResponse: result.text, model: result.model,
      requestMilliseconds: result.milliseconds, usage: result.usage,
      finishReason: result.finishReason, promptHash, imageHash }
    await writeFile(path, JSON.stringify(recordResult, null, 2))
    return recordResult
  } catch (error) {
    return { id: record.id, status: 'error', prediction: null, errorStatus: error.status,
      errorCode: error.code || error.name, requestMilliseconds: Math.round(performance.now() - started), promptHash, imageHash }
  }
}

async function worker() {
  while (next < records.length) {
    const record = records[next++]
    const result = await one(record)
    predictions.push(result)
    console.log(JSON.stringify({ AZURE_BENCHMARK: { complete: predictions.length, total: records.length,
      id: record.id, status: result.status, prediction: result.prediction, milliseconds: result.requestMilliseconds } }))
  }
}

console.log(`AZURE_VISION_BENCHMARK_STARTED clips=${records.length} framesPerClip=8 mode=${pilot ? 'pilot' : 'challenge'}`)
await Promise.all([worker(), worker()])
const known = records.filter(record => record.kind === 'known')
const unknown = records.filter(record => record.kind === 'unknown')
const lookup = new Map(predictions.map(result => [result.id, result]))
const correct = known.filter(record => lookup.get(record.id)?.prediction === record.expected).length
const accepted = predictions.filter(result => result.status === 'ok' && result.prediction !== 'UNKNOWN').length
const rejectedUnknown = unknown.filter(record => lookup.get(record.id)?.prediction === 'UNKNOWN').length
const times = predictions.map(result => result.requestMilliseconds).sort((a, b) => a - b)
const report = { candidate: 'Azure deployed vision model', split: pilot ? 'development-pilot' : 'challenge',
  promptHash, framesPerClip: 8, publicDatasetFramesOnly: true, cameraFootageUploaded: false,
  model: predictions.find(result => result.model)?.model,
  metrics: { knownClips: known.length, unknownClips: unknown.length, correctKnown: correct,
    knownAccuracy: known.length ? correct / known.length : null,
    acceptedPrecision: accepted ? correct / accepted : null, acceptedCount: accepted,
    unknownRejection: unknown.length ? rejectedUnknown / unknown.length : null,
    failures: predictions.filter(result => result.status !== 'ok').length,
    medianRequestMilliseconds: times[Math.floor(times.length / 2)],
    totalPromptTokens: predictions.reduce((sum, result) => sum + (result.usage?.prompt_tokens || 0), 0),
    totalCompletionTokens: predictions.reduce((sum, result) => sum + (result.usage?.completion_tokens || 0), 0) },
  limitations: ['Sparse frame classification, not continuous video recognition.',
    'Source signer independence and publisher labels are not independently verified.',
    'Subjective model confidence is not a calibrated acceptance probability.',
    'API errors are retained as failures and never counted as correct unknown rejections.'], predictions }
await writeFile(`${root}/${pilot ? 'azure-pilot-results' : 'azure-results'}.json`, JSON.stringify(report, null, 2))
console.log('AZURE_VISION_BENCHMARK_COMPLETE', JSON.stringify(report.metrics))
