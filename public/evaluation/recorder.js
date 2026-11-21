import { packZip } from './zip.js'

const tasks = [
  ['rest', 'Sit naturally', 'Sit naturally with your hands relaxed. Do not intentionally sign.'],
  ['typing', 'Type or use your phone', 'Type or use your phone as you normally would, with your hands visible where possible.'],
  ['ordinary_movement', 'Ordinary hand movements', 'Make ordinary non-signing hand movements, such as adjusting your sleeve or glasses.'],
  ['change_position', 'Change sitting position', 'Lean or turn slightly. Keep your face, torso and hands in view where possible.'],
  ['empty_scene', 'Empty camera scene', 'Step out of the camera view for this test.'],
]
const element = id => document.getElementById(id)
let stream, recorder, timer, current = 0, started, recordingBusy = false
const recordings = []
element('tasks').replaceChildren(...tasks.map(([, title]) => {
  const item = document.createElement('li'); item.textContent = title; return item
}))

function update() {
  Array.from(element('tasks').children).forEach((item, index) => { item.dataset.active = String(index === current) })
  element('prompt').textContent = current < tasks.length ? tasks[current][2] : 'All five controls are recorded. Download the ZIP to keep them.'
  element('record').disabled = !stream || recordingBusy || current >= tasks.length
  element('export').disabled = !recordings.length || recordingBusy
  element('retake').disabled = !recordings.length || recordingBusy
  element('saved').textContent = `${recordings.length} recording${recordings.length === 1 ? '' : 's'} saved in this browser.`
}

element('enable').addEventListener('click', async () => {
  element('enable').disabled = true
  element('message').textContent = ''
  try {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Recording is not supported in this browser. Try a current Chrome or Edge browser on localhost.')
    stream = await navigator.mediaDevices.getUserMedia({ audio: false,
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } })
    element('preview').srcObject = stream
    await element('preview').play()
    element('camera-off').disabled = false
    element('status').textContent = 'Camera ready. No recording has started.'
  } catch (error) {
    stream?.getTracks().forEach(track => track.stop())
    stream = null
    element('preview').srcObject = null
    element('message').textContent = error.name === 'NotAllowedError' ? 'Camera permission was declined. You can enable it when ready.' : error.message
    element('enable').disabled = false
  }
  update()
})

function stopRecording() {
  clearInterval(timer)
  if (recorder?.state === 'recording') recorder.stop()
  element('stop').disabled = true
}

element('record').addEventListener('click', () => {
  if (recordingBusy || !stream || current >= tasks.length) return
  const code = element('participant').value.trim()
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(code)) { element('message').textContent = 'Use a tester code containing letters, numbers, underscores or hyphens.'; return }
  element('message').textContent = ''
  const mimeType = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type))
  if (!mimeType) { element('message').textContent = 'This browser has no supported video recording format.'; return }
  const task = tasks[current], chunks = []
  const recordedSettings = stream.getVideoTracks()[0].getSettings()
  try { recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4000000 }) }
  catch { element('message').textContent = 'The browser could not start video recording.'; return }
  const recordedAt = new Date().toISOString()
  started = performance.now()
  recordingBusy = true
  element('progress').value = 0
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
  recorder.onstop = () => {
    const durationMs = Math.round(performance.now() - started)
    const blob = new Blob(chunks, { type: mimeType })
    if (blob.size) {
      recordings.push({ blob, metadata: { task: task[0], testerCode: code, targetLanguage: 'ISL',
        label: 'intended_non_signing', signLabelsVerified: false, recordedAt, durationMs,
        plannedDurationMs: 20000, stoppedEarly: durationMs < 19000, audio: false,
        width: recordedSettings.width, height: recordedSettings.height, frameRate: recordedSettings.frameRate,
        mimeType, filename: `${code}-${task[0]}.${mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'}` } })
      current++
    }
    element('participant').disabled = false
    recordingBusy = false
    element('status').textContent = current < tasks.length ? 'Recording saved locally. Prepare for the next test.' : 'All recordings saved locally.'
    update()
  }
  recorder.onerror = () => { stopRecording(); element('message').textContent = 'The browser could not finish this recording. Export any completed clips before trying again.' }
  try { recorder.start(1000) }
  catch {
    recordingBusy = false
    element('participant').disabled = false
    element('message').textContent = 'The browser could not start recording. Try enabling the camera again.'
    update()
    return
  }
  element('participant').disabled = true
  element('stop').disabled = false
  element('status').textContent = `Recording: ${task[1]}`
  timer = setInterval(() => {
    const seconds = (performance.now() - started) / 1000
    element('progress').value = Math.min(20, seconds)
    if (seconds >= 20) stopRecording()
  }, 200)
  update()
})

element('stop').addEventListener('click', stopRecording)
element('retake').addEventListener('click', () => {
  if (recordingBusy || !recordings.length) return
  recordings.pop()
  current = Math.max(0, current - 1)
  element('progress').value = 0
  element('status').textContent = 'Previous recording removed. Record that test again when ready.'
  update()
})
element('camera-off').addEventListener('click', () => {
  stopRecording()
  stream?.getTracks().forEach(track => track.stop())
  stream = null
  element('preview').srcObject = null
  element('enable').disabled = false
  element('camera-off').disabled = true
  element('status').textContent = 'Camera is off. Completed recordings remain available for export.'
  update()
})

element('export').addEventListener('click', async () => {
  element('export').disabled = true
  try {
    const files = await Promise.all(recordings.map(async ({ blob, metadata }) => ({ name: metadata.filename, bytes: new Uint8Array(await blob.arrayBuffer()) })))
    files.push({ name: 'manifest.json', bytes: new TextEncoder().encode(JSON.stringify({
      schema: 'parlance-camera-controls-v1', purpose: 'Local non-signing false-positive evaluation',
      uploads: false, signAccuracyCanBeEstablished: false, recordings: recordings.map(record => record.metadata),
    }, null, 2)) })
    const url = URL.createObjectURL(new Blob([packZip(files)], { type: 'application/zip' }))
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `parlance-controls-${Date.now()}.zip`; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
    element('status').textContent = 'ZIP export requested. Keep your copy locally until ready for evaluation.'
  } catch (error) { element('message').textContent = error.message }
  update()
})

window.addEventListener('beforeunload', () => { stopRecording(); stream?.getTracks().forEach(track => track.stop()) })
document.addEventListener('visibilitychange', () => { if (document.hidden && recorder?.state === 'recording') stopRecording() })
update()
