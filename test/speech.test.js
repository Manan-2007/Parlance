import assert from 'node:assert/strict'
import { Readable, Writable } from 'node:stream'
import { test } from 'node:test'
import { SPEECH_VOICES, speechApi, speechMarkup } from '../server/speechApi.js'

test('soft Azure speech escapes text and applies the selected voice and rate', () => {
  const markup = speechMarkup('Hello <voice> & "friends"', SPEECH_VOICES[0], 1)
  assert.match(markup, /name="en-IN-NeerjaNeural"/)
  assert.match(markup, /style="empathetic"/)
  assert.match(markup, /rate="-7%"/)
  assert.match(markup, /volume="soft"/)
  assert.match(markup, /Hello &lt;voice&gt; &amp; &quot;friends&quot;/)
  assert.doesNotMatch(speechMarkup('Hi', SPEECH_VOICES[1], 1), /express-as/)
})

function requestSpeech(body) {
  return new Promise((resolve, reject) => {
    const request = Readable.from([Buffer.from(JSON.stringify(body))])
    request.url = '/api/speech'
    request.method = 'POST'
    request.headers = { 'content-type': 'application/json' }
    request.socket = { remoteAddress: 'speech-test' }
    const chunks = []
    const response = new Writable({ write(chunk, encoding, done) { chunks.push(chunk); done() } })
    response.writeHead = (status, headers) => { response.status = status; response.headers = headers }
    response.on('finish', () => resolve({ status: response.status, headers: response.headers, body: Buffer.concat(chunks) }))
    response.on('error', reject)
    speechApi(request, response, () => reject(new Error('Speech route was skipped')))
  })
}

test('speech route proxies audio and rejects invalid voices before contacting Azure', async () => {
  const previousKey = process.env.AZURE_SPEECH_KEY
  const previousFetch = globalThis.fetch
  process.env.AZURE_SPEECH_KEY = 'test-only-key'
  let calls = 0
  globalThis.fetch = async (url, options) => {
    calls++
    assert.match(String(url), /tts\.speech\.microsoft\.com\/cognitiveservices\/v1$/)
    assert.equal(options.headers['Ocp-Apim-Subscription-Key'], 'test-only-key')
    return new Response(new Uint8Array([0x49, 0x44, 0x33]), { status: 200 })
  }
  try {
    const invalid = await requestSpeech({ text: 'Hi', voice: '<invalid>' })
    assert.equal(invalid.status, 400)
    assert.equal(calls, 0)
    const response = await requestSpeech({ text: 'Hello', rate: 1 })
    assert.equal(response.status, 200)
    assert.equal(response.headers['Content-Type'], 'audio/mpeg')
    assert.equal(response.body.toString(), 'ID3')
    assert.equal(calls, 1)
  } finally {
    globalThis.fetch = previousFetch
    if (previousKey === undefined) delete process.env.AZURE_SPEECH_KEY
    else process.env.AZURE_SPEECH_KEY = previousKey
  }
})
