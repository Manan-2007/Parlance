import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildFrameVector } from '../src/engine/landmarks.ts'
import { liveFrame } from '../src/learn/motion.ts'
import { LEFT_WRIST, LEFT_WORLD } from '../src/engine/avatar/signMotion.ts'
import { avatarKey, avatarLetterKey, remyKey, letterKey, isReviewKey, validatePack, summarize } from '../src/learn/reviews.ts'
import { readBounded, packJson, unpackJson } from '../src/learn/packing.ts'

test('Learn adapts raw camera coordinates without changing the recognizer vector', () => {
  const hand = Array.from({ length: 21 }, (_, i) => ({ x: .75 + i * .001, y: .4, z: -.02 }))
  const vector = buildFrameVector({ landmarks: [hand], handedness: [[{ categoryName: 'Left', score: .9 }]] })
  assert.equal(vector.length, 141)
  assert.equal(vector[0], .75)
  assert.ok(vector.slice(126).every(value => value === 0))
  const world = new Float32Array(126); world[0] = .03
  const pose = new Float32Array(39)
  const frame = liveFrame(vector, world, pose, 4 / 3)
  assert.equal(frame[LEFT_WRIST], 1)
  assert.equal(frame[LEFT_WORLD], world[0])
  assert.equal(vector[0], .75)
})

test('reviews for the old avatar do not mark Ch22 signs or letters as checked', () => {
  assert.notEqual(avatarKey('WATER'), remyKey('WATER'))
  assert.notEqual(avatarLetterKey('A'), letterKey('A'))
  assert.ok(isReviewKey(avatarKey('WATER')))
  assert.ok(isReviewKey(avatarLetterKey('A')))
  const legacy = validatePack({ id: 'legacy', reviewer: 'Tester', reviews: [
    { key: remyKey('WATER'), verdict: 'correct' }, { key: letterKey('A'), verdict: 'correct' },
  ] })
  assert.ok(legacy)
  const summaries = summarize([legacy])
  assert.equal(summaries.has(avatarKey('WATER')), false)
  assert.equal(summaries.has(avatarLetterKey('A')), false)
})

test('shared-data expansion cancels before reading the entire oversized stream', async () => {
  let reads = 0, cancelled = false
  const stream = new ReadableStream({
    pull(controller) { reads++; controller.enqueue(new Uint8Array(1024)); if (reads === 100) controller.close() },
    cancel() { cancelled = true },
  })
  await assert.rejects(readBounded(stream, 4096), /too large/)
  assert.ok(cancelled)
  assert.ok(reads < 10)
  assert.deepEqual(await unpackJson(await packJson({ message: 'water' })), { message: 'water' })
})
