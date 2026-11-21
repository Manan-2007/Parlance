import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadVocabulary, parseSignVideoOutput, parseSignVideoRequest, signVideoPrompt, vocabularyMatcher } from '../server/signVideo.js'

const vocabulary = loadVocabulary()
const match = vocabularyMatcher(vocabulary)
const jpeg = '/9j/' + 'A'.repeat(40)

test('vocabulary covers both bundled models, keyed like the recognizer', () => {
  assert.ok(vocabulary.length > 500)
  for (const word of ['hello', 'goodafternoon', 'how are you', 'sorry']) assert.ok(vocabulary.includes(word), word)
  assert.equal(match('Good Afternoon'), 'goodafternoon')
  assert.equal(match('spaceship'), null)
})

test('requests need 2-16 base64 JPEG frames; hints are limited to known words', () => {
  assert.equal(parseSignVideoRequest({ frames: [jpeg] }, match), null)
  assert.equal(parseSignVideoRequest({ frames: Array(17).fill(jpeg) }, match), null)
  assert.equal(parseSignVideoRequest({ frames: [jpeg, 'iVBORw0KGgo='] }, match), null)
  assert.equal(parseSignVideoRequest({ frames: [jpeg, jpeg + '<'] }, match), null)
  const parsed = parseSignVideoRequest({ frames: [jpeg, jpeg], hints: [{ word: 'hello', confidence: 0.4 }, { word: 'zzz', confidence: 0.9 }, { word: 'sun', confidence: 4 }] }, match)
  assert.deepEqual(parsed.hints, [{ word: 'hello', confidence: 0.4 }])
  assert.match(signVideoPrompt(parsed.hints), /hello \(0\.40\)/)
})

test('model output must be one vocabulary word or UNKNOWN', () => {
  assert.deepEqual(parseSignVideoOutput('{"word":"Hello","confidence":0.8}', match), { word: 'hello', confidence: 0.8 })
  assert.deepEqual(parseSignVideoOutput('```json\n{"word":"UNKNOWN","confidence":0.2}\n```', match), { word: null, confidence: 0.2 })
  assert.deepEqual(parseSignVideoOutput('{"word":"spaceship","confidence":2}', match), { word: null, confidence: 1 })
  assert.equal(parseSignVideoOutput('hello', match), null)
})
