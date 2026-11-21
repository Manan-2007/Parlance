// Offline check of the /api/sign-video reader on labelled dataset clips.
//   node --env-file-if-exists=.env training/benchmark_sign_video.mjs <dir of Word__...mp4> [frames=12] [concurrency=3] [hints.json]
// hints.json maps file name -> [{word, confidence}] from the hand-landmark model.
// Frames are sampled evenly and scaled to 512 px wide JPEG, like the browser does.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { glossKey } from '../server/signVideo.js'
import { readSignFrames } from '../server/signVideoApi.js'

const [dir, frameCount = '12', concurrency = '3', hintFile] = process.argv.slice(2)
const hints = hintFile ? JSON.parse(readFileSync(hintFile, 'utf8')) : {}
const files = readdirSync(dir).filter((f) => f.endsWith('.mp4')).sort()

function frames(file, count) {
  const out = mkdtempSync(join(tmpdir(), 'signframes-'))
  try {
    const seconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString())
    execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `fps=${count / seconds},scale=512:-2`, '-frames:v', String(count), '-q:v', '5', join(out, '%02d.jpg')])
    return readdirSync(out).sort().map((f) => readFileSync(join(out, f)).toString('base64'))
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
}

const results = []
let next = 0
async function worker() {
  while (next < files.length) {
    const file = files[next++]
    const label = glossKey(file.replace(/^User\d+_/, '').split('__')[0])
    try {
      const result = await readSignFrames(frames(join(dir, file), Number(frameCount)), hints[file] ?? [])
      results.push({ file, label, ...result, correct: result.word === label })
      console.log(`${result.word === label ? 'OK  ' : 'MISS'} ${label.padEnd(16)} -> ${String(result.word).padEnd(16)} ${result.confidence.toFixed(2)} ${result.ms} ms`)
    } catch (error) {
      results.push({ file, label, error: error.status || error.message })
      console.log(`ERR  ${label} ${error.status || error.message}`)
    }
  }
}
await Promise.all(Array.from({ length: Number(concurrency) }, worker))
const ok = results.filter((r) => r.correct).length
const answered = results.filter((r) => r.word)
const ms = results.filter((r) => r.ms).map((r) => r.ms).sort((a, b) => a - b)
console.log(JSON.stringify({
  clips: results.length, correct: ok, accuracy: +(ok / results.length).toFixed(3),
  answered: answered.length, precisionWhenAnswered: answered.length ? +(ok / answered.length).toFixed(3) : null,
  errors: results.filter((r) => r.error).length, provider: results.find((r) => r.provider)?.provider,
  medianMs: ms[Math.floor(ms.length / 2)],
}))
