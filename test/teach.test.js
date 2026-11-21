import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { decodeFrames, encodeFrames, validateCustomSign, customKey } from '../src/learn/recordings.ts'
import { decodeDeck, deckFromFile, deckToFile, encodeDeck, planDeckLesson, validateDeck } from '../src/learn/decks.ts'
import { makeRounds } from '../src/learn/together.ts'
import { letterGlosses, normalizeSpelling, spellingMatches, wordsForLevel, SPELLING_WORDS } from '../src/learn/fingerspell.ts'
import { comparePractice, isPracticeError } from '../src/learn/motion.ts'
import { scheduleSigns } from '../src/avatar/schedule.js'
import { appendSignFrames } from '../src/avatar/signQueue.js'
import * as alphabets from '../src/avatar/animations/alphabets.js'

const signsDir = new URL('../public/signs/', import.meta.url)
const available = new Set(Object.keys(JSON.parse(readFileSync(new URL('manifest.json', signsDir))).signs))
const motion = (gloss) => JSON.parse(readFileSync(new URL(`${gloss}.json`, signsDir))).frames.map((row) => Float32Array.from(row))

function recording(id, gloss = 'water', extra = {}) {
  const frames = motion(gloss)
  return { id, english: `my ${gloss}`, createdAt: 1, fps: 15, count: frames.length, frames: encodeFrames(frames), ...extra }
}

test('recordings survive encoding to within tracker noise and still score as the same sign', () => {
  const frames = motion('doctor')
  const decoded = decodeFrames(encodeFrames(frames))
  assert.equal(decoded.length, frames.length)
  let worst = 0
  for (let f = 0; f < frames.length; f += 1) for (let i = 0; i < 169; i += 1) worst = Math.max(worst, Math.abs(decoded[f][i] - frames[f][i]))
  assert.ok(worst <= 0.0001, `max error ${worst}`)
  const result = comparePractice(decoded, frames)
  assert.ok(!isPracticeError(result))
  assert.equal(result.score, 100)
})

test('custom signs from outside are validated', () => {
  assert.ok(validateCustomSign(recording('abc-1')))
  assert.equal(validateCustomSign(recording('bad id!')), null)
  assert.equal(validateCustomSign({ ...recording('x'), english: '' }), null)
  assert.equal(validateCustomSign({ ...recording('x'), frames: 'not*base64' }), null)
  assert.equal(validateCustomSign({ ...recording('x'), frames: encodeFrames(motion('water').slice(0, 2)) }), null, 'too short')
  assert.equal(validateCustomSign({ ...recording('x'), letter: 'ab' }).letter, undefined)
  assert.equal(validateCustomSign({ ...recording('x'), english: 'x'.repeat(500) }).english.length, 60)
})

test('a deck round-trips through a link and a file, recordings included', async () => {
  const deck = {
    id: 'deck-1',
    title: 'Reception desk',
    author: 'Asha',
    createdAt: 5,
    items: ['hello', 'water', customKey('r1')],
    signs: [recording('r1', 'toilet')],
    phrases: [{ english: 'Where is the toilet?', items: [customKey('r1'), 'where'] }],
    own: true,
  }
  const text = await encodeDeck(deck)
  assert.match(text, /^[A-Za-z0-9_-]+$/)
  const back = await decodeDeck(text, available)
  assert.equal(back.title, 'Reception desk')
  assert.deepEqual(back.items, deck.items)
  assert.equal(back.signs[0].frames, deck.signs[0].frames)
  assert.equal(back.own, undefined, 'ownership is not shared')
  assert.deepEqual(deckFromFile(deckToFile(deck), available).phrases, deck.phrases)
  assert.equal(await decodeDeck('garbage', available), null)
  assert.equal(await decodeDeck('', available), null)
  assert.equal(deckFromFile('{"title":"no marker"}', available), null)
})

test('a tampered deck keeps only what is valid', () => {
  const deck = validateDeck(
    {
      id: 'd2',
      title: 'T',
      items: ['hello', 'not-a-sign', customKey('ghost'), customKey('r1'), 'hello', 42],
      signs: [recording('r1'), recording('unused')],
      phrases: [{ english: 'Bad', items: ['nope'] }, { english: 'Hi', items: ['hello'] }],
    },
    available,
  )
  assert.deepEqual(deck.items, ['hello', customKey('r1')])
  assert.deepEqual(deck.signs.map((s) => s.id), ['r1'], 'unused recordings are dropped')
  assert.deepEqual(deck.phrases, [{ english: 'Hi', items: ['hello'] }])
  assert.equal(validateDeck({ id: 'd3', title: 'Empty', items: ['nope'] }, available), null)
  assert.equal(validateDeck({ id: 'x y', title: 'T', items: ['hello'] }, available), null)
})

test('a deck lesson watches, recognises, signs and orders its own signs', () => {
  const english = (k) => (k.startsWith('rec:') ? 'toilet (mine)' : k)
  const deck = { id: 'd', title: 'T', createdAt: 0, items: ['hello', 'water', 'rec:r1'], signs: [], phrases: [{ english: 'Hello water', items: ['hello', 'water'] }] }
  const plan = planDeckLesson(deck, english, ['doctor', 'school', 'pain'], 1)
  assert.equal(plan.key, 'deck/d')
  const kinds = plan.steps.map((s) => s.kind)
  assert.equal(kinds.filter((k) => k === 'watch').length, 3)
  assert.equal(kinds.filter((k) => k === 'sign').length, 3)
  assert.ok(kinds.includes('order'))
  for (const step of plan.steps.filter((s) => s.kind === 'recognize')) {
    assert.equal(step.options.length, 4)
    assert.ok(step.options.includes(step.gloss))
    assert.equal(new Set(step.options.map(english)).size, 4, 'no two choices mean the same')
  }
})

test('practise-together rounds alternate signers and never offer duplicate meanings', () => {
  const pool = ['hello', 'water', 'doctor', 'pain', 'school']
  const rounds = makeRounds(pool, 10, 'guess', 3)
  assert.equal(rounds.length, 10)
  assert.deepEqual(rounds.slice(0, 4).map((r) => r.signer), [0, 1, 0, 1])
  for (const round of rounds) {
    assert.equal(round.options.length, 4)
    assert.ok(round.options.includes(round.key))
    assert.equal(new Set(round.options).size, 4)
  }
  assert.ok(makeRounds(pool, 4, 'check', 3).every((r) => r.signer === 0))
  assert.deepEqual(makeRounds(['hello'], 4, 'guess', 3), [])
})

test('fingerspelling helpers normalise answers and spell an I as a letter, not the pronoun', () => {
  assert.equal(normalizeSpelling(' amit! '), 'AMIT')
  assert.ok(spellingMatches('a m i t', 'AMIT'))
  assert.ok(!spellingMatches('amt', 'AMIT'))
  assert.ok(wordsForLevel(0, 1).every((w) => w.length <= 4))
  assert.equal(wordsForLevel(2, 1).length, SPELLING_WORDS.length)
  assert.deepEqual(letterGlosses('Isha'), ['I-', 'S-', 'H-', 'A-'])

  const runtime = { animations: [], segments: [], characters: [], pending: true }
  scheduleSigns(['I-'], runtime)
  const expected = { animations: [], characters: [], pending: true }
  appendSignFrames(expected, alphabets.I)
  assert.deepEqual(runtime.animations, expected.animations)
})
