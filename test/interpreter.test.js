import assert from 'node:assert/strict'
import { test } from 'node:test'
import { liveSigns, liveSpeed, nextBatch, phraseHoldBack, MAX_BACKLOG } from '../src/features/speech-to-sign/interpreter.ts'
import { planLiveCommit } from '../src/translation/liveSpeech.js'
import { tokensFromModel } from '../server/translationApi.js'

const item = (gloss, kind = 'word') => ({ gloss, label: gloss, missing: false, kind })

test('live interpreting holds back a word that may start a two-word sign', () => {
  assert.equal(phraseHoldBack(['please', 'thank']), 1)
  assert.equal(phraseHoldBack(['I', 'need', 'water']), 0)
  // "thank" waits for "you" instead of being signed alone.
  const first = planLiveCommit([], { words: ['hello', 'thank'], finalWordCount: 0, allFinal: false }, phraseHoldBack)
  assert.equal(first.chunk, 'hello')
  const next = planLiveCommit(first.committed, { words: ['hello', 'thank', 'you'], finalWordCount: 3, allFinal: true }, phraseHoldBack)
  assert.equal(next.chunk, 'thank you')
})

test('long spelled words go to the captions, signs and short spellings are kept', () => {
  const { signs, skipped } = liveSigns([item('HELLO'), item('A-M-I-T-A-B-H', 'fingerspelling'), item('T-V', 'fingerspelling'), item('1-2', 'number')])
  assert.deepEqual(signs.map((s) => s.gloss), ['HELLO', 'T-V', '1-2'])
  assert.deepEqual(skipped, ['A-M-I-T-A-B-H'])
})

test('when behind, only the newest signs play, a little faster', () => {
  const waiting = Array.from({ length: 10 }, (_, i) => item(`W${i}`))
  const { batch, dropped } = nextBatch(waiting)
  assert.equal(batch.length, MAX_BACKLOG)
  assert.equal(dropped, 4)
  assert.equal(batch.at(-1).gloss, 'W9')
  assert.equal(liveSpeed(1), 1)
  assert.ok(liveSpeed(MAX_BACKLOG) > 1)
})

test('online translation reads Gemini arrays and Azure objects', () => {
  assert.deepEqual(tokensFromModel('["HELLO","YOU"]'), ['HELLO', 'YOU'])
  assert.deepEqual(tokensFromModel('{"tokens":["I","WATER","NEED"]}'), ['I', 'WATER', 'NEED'])
  assert.deepEqual(tokensFromModel('```json\n{"tokens":["HOSPITAL","WHERE"]}\n```'), ['HOSPITAL', 'WHERE'])
})
