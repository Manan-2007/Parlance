import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decodePack, encodePack, isReviewKey, packFromFile, packToFile, statusOf, summarize, validatePack } from '../src/learn/reviews.ts'

const pack = (id, reviewer, reviews, region) => ({ id, reviewer, region, createdAt: 1, reviews: reviews.map(([key, verdict, note]) => ({ key, verdict, note, at: 1 })) })

test('review keys cover ISLRTC glosses, Remy tokens, letters and recordings only', () => {
  for (const key of ['water', 'remy:THANK_YOU', 'letter:A', 'rec:abc-123']) assert.ok(isReviewKey(key), key)
  for (const key of ['Water', 'remy:thank', 'letter:AB', 'rec:', 'javascript:alert(1)', '']) assert.ok(!isReviewKey(key), key)
})

test('packs from outside are validated and cleaned', () => {
  const raw = {
    id: 'p1',
    reviewer: 'Asha',
    region: 'Delhi',
    reviews: [
      { key: 'remy:WATER', verdict: 'wrong', note: 'palm should face down', at: 5 },
      { key: 'remy:WATER', verdict: 'correct' },
      { key: 'letter:A', verdict: 'maybe' },
      { key: 'bad key', verdict: 'correct' },
      { key: 'letter:B', verdict: 'correct', note: 'x'.repeat(500) },
    ],
  }
  const clean = validatePack(raw)
  assert.deepEqual(clean.reviews.map((r) => r.key), ['remy:WATER', 'letter:B'], 'duplicates, bad verdicts and bad keys are dropped')
  assert.equal(clean.reviews[1].note.length, 200)
  assert.equal(validatePack({ ...raw, reviewer: '' }), null)
  assert.equal(validatePack({ ...raw, reviews: [] }), null)
  assert.equal(validatePack({ ...raw, id: 'has space' }), null)
})

test('summaries count each reviewer once and flagged wins ties', () => {
  const packs = [
    pack('a', 'Asha', [['remy:WATER', 'wrong', 'palm down'], ['letter:A', 'correct']], 'Delhi'),
    pack('b', 'Ravi', [['remy:WATER', 'correct'], ['letter:A', 'variant', 'thumb tucked']]),
    pack('c', 'asha', [['remy:WATER', 'correct']]),
  ]
  const s = summarize(packs)
  assert.deepEqual([s.get('remy:WATER').wrong, s.get('remy:WATER').correct], [1, 1], 'the second Asha pack does not count twice')
  assert.equal(statusOf(s.get('remy:WATER')), 'flagged')
  assert.equal(statusOf(s.get('letter:A')), 'checked')
  assert.equal(statusOf(summarize([pack('d', 'D', [['letter:Z', 'variant']])]).get('letter:Z')), 'variant')
  assert.equal(statusOf(undefined), 'unchecked')
  assert.deepEqual(s.get('remy:WATER').notes, [{ reviewer: 'Asha', region: 'Delhi', verdict: 'wrong', note: 'palm down' }])
})

test('checks round-trip through a link and a file', async () => {
  const p = pack('p2', 'Meera', [['remy:HELLO', 'correct'], ['water', 'variant', 'we sign it at the chin']], 'Pune')
  const back = await decodePack(await encodePack(p))
  assert.deepEqual(back.reviews, p.reviews)
  assert.equal(back.region, 'Pune')
  assert.deepEqual(packFromFile(packToFile(p)).reviews, p.reviews)
  assert.equal(await decodePack('not-a-pack'), null)
  assert.equal(packFromFile('{"reviewer":"x"}'), null)
})
