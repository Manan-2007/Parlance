import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { UNITS, curriculumGlosses, lessonIds, GRAMMAR_RULES } from '../src/learn/curriculum.ts'
import { avatarTokenFor, glossForToken, inferRules, planLesson, planPhraseLesson, planSingleSign } from '../src/learn/lessonPlan.ts'
import { BOX_INTERVALS, dueCards, gradeCard, gradeFromScore, newCard, practiceStreak, signsToWorkOn } from '../src/learn/srs.ts'
import {
  comparePractice, fillHandGaps, frozenBlocks, isPracticeError, liveFrame, mirrorFrame, sequenceFeatures, bodyZone,
} from '../src/learn/motion.ts'

const signsDir = new URL('../public/signs/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('manifest.json', signsDir)))
const available = new Set(Object.keys(manifest.signs))
const motion = (gloss) => JSON.parse(readFileSync(new URL(`${gloss}.json`, signsDir))).frames.map((row) => Float32Array.from(row))

test('every sign the curriculum teaches or uses has an ISLRTC recording and a source video', () => {
  const sources = JSON.parse(readFileSync(new URL('sources.json', signsDir))).signs
  const used = new Set(curriculumGlosses())
  for (const unit of UNITS) {
    for (const phrase of unit.phrases) for (const gloss of phrase.glosses) used.add(gloss)
    for (const line of unit.dialogue?.lines ?? []) for (const gloss of line.glosses) used.add(gloss)
    for (const phrase of unit.phrases) for (const rule of phrase.rules) assert.ok(GRAMMAR_RULES[rule], rule)
  }
  for (const gloss of used) {
    assert.ok(available.has(gloss), `no recording for ${gloss}`)
    assert.ok(sources[gloss]?.length, `no source video for ${gloss}`)
  }
  assert.ok(curriculumGlosses().length >= 70)
})

test('lesson ids are unique within a unit and every lesson plans', () => {
  for (const unit of UNITS) {
    const ids = lessonIds(unit)
    assert.equal(new Set(ids).size, ids.length, unit.id)
    for (const id of ids) assert.ok(planLesson(unit.id, id), `${unit.id}/${id}`)
  }
  assert.equal(planLesson('nope', 'greetings'), null)
})

test('a lesson watches every sign before recognising it, and its exercises are well formed', () => {
  const plan = planLesson('clinic', 'when-where')
  assert.deepEqual(plan, planLesson('clinic', 'when-where'), 'same seed, same plan')
  assert.equal(plan.steps[0].kind, 'intro')
  assert.equal(plan.steps.at(-1).kind, 'done')
  const watched = new Set()
  for (const step of plan.steps) {
    if (step.kind === 'watch') watched.add(step.gloss)
    if (step.kind === 'recognize') {
      assert.ok(watched.has(step.gloss), `${step.gloss} recognised before it was shown`)
      assert.equal(step.options.length, 4)
      assert.equal(new Set(step.options).size, 4)
      assert.ok(step.options.includes(step.gloss))
      const lesson = UNITS.find((u) => u.id === 'clinic').lessons.find((l) => l.id === 'when-where')
      assert.ok(step.options.every((o) => lesson.signs.includes(o)), 'wrong answers come from the same lesson first')
    }
    if (step.kind === 'order') {
      for (const gloss of step.answer) assert.ok(step.tiles.includes(gloss))
      assert.equal(step.tiles.length, step.answer.length + 1)
      assert.notDeepEqual(step.tiles.slice(0, step.answer.length), step.answer)
    }
  }
  assert.equal(plan.steps.filter((s) => s.kind === 'sign').length, 2)
  assert.ok(plan.steps.some((s) => s.kind === 'order'))
})

test('a conversation alternates understanding and replying', () => {
  const plan = planLesson('first-conversation', 'conversation')
  const kinds = plan.steps.map((s) => s.kind).filter((k) => k === 'listen' || k === 'reply')
  assert.deepEqual(kinds, ['listen', 'reply', 'listen', 'reply', 'listen'])
  for (const step of plan.steps.filter((s) => s.kind === 'listen')) {
    assert.ok(step.options.includes(step.line.english))
    assert.equal(new Set(step.options).size, step.options.length)
  }
})

test('translator tokens map to ISLRTC glosses and back to Remy tokens', () => {
  assert.equal(glossForToken('THANK_YOU', available), 'thankyou')
  assert.equal(glossForToken('HOW_MUCH', available), 'howmuch')
  assert.equal(glossForToken('I', available), 'i')
  assert.equal(glossForToken('7', available), 'seven')
  assert.equal(glossForToken('A-M-I-T', available), null)
  assert.equal(avatarTokenFor('thankyou'), 'THANK_YOU')
  assert.equal(avatarTokenFor('stomach'), null)
  const plan = planPhraseLesson({ id: 'p1', text: 'Thank you Amit', tokens: ['THANK_YOU', 'A-M-I-T'], createdAt: 0 }, available)
  assert.deepEqual(plan.steps.map((s) => s.kind), ['intro', 'watch', 'watch-avatar', 'order', 'sign', 'done'])
  assert.deepEqual(planSingleSign('hello').steps.map((s) => s.kind), ['watch', 'sign', 'done'])
  assert.deepEqual(inferRules(['TOILET', 'WHERE']), ['wh-last'])
  assert.deepEqual(inferRules(['YESTERDAY', 'I', 'HOME', 'GO']), ['time-first'])
  assert.deepEqual(inferRules(['I', 'UNDERSTAND', 'NO']), ['negation-after'])
})

test('spaced review moves cards between boxes and surfaces the overdue ones first', () => {
  const now = 1_000_000
  let card = newCard('hello', now)
  assert.equal(card.box, 0)
  card = gradeCard(card, 'good', now)
  assert.equal(card.box, 1)
  assert.equal(card.due, now + BOX_INTERVALS[1])
  card = gradeCard(card, 'easy', now)
  assert.equal(card.box, 3)
  card = gradeCard(card, 'again', now)
  assert.equal(card.box, 0)
  assert.equal(card.lapses, 1)
  const cards = { a: { ...newCard('a', 0), due: 5 }, b: { ...newCard('b', 0), due: 1 }, c: { ...newCard('c', 0), due: 99 } }
  assert.deepEqual(dueCards(cards, 50).map((c) => c.gloss), ['b', 'a'])
  assert.equal(gradeFromScore(90), 'easy')
  assert.equal(gradeFromScore(30), 'again')
})

/* ------------------------------------------------------------- practice -- */

function moveHands(frames, dy) {
  return frames.map((src) => {
    const f = Float32Array.from(src)
    for (const w of [0, 65]) if (f[w] || f[w + 1]) f[w + 1] += dy
    return f
  })
}

test('the live tracker output becomes a motion-library frame', () => {
  const vector = new Float32Array(141)
  vector[0] = 0.45
  vector[1] = 0.4
  const world = new Float32Array(126).fill(0.01)
  const pose = new Float32Array(39).fill(0.5)
  const frame = liveFrame(vector, world, pose)
  assert.equal(frame.length, 169)
  assert.ok(Math.abs(frame[0] - 0.45 * 16 / 9) < 1e-6, 'x moves from the 16:9 contract to square units')
  assert.equal(frame[65], 0, 'absent right hand stays absent')
  assert.equal(frame[130], 0.5)
  const mirrored = mirrorFrame(mirrorFrame(motion('hello')[5]))
  const original = motion('hello')[5]
  for (let i = 0; i < 169; i += 1) assert.ok(Math.abs(mirrored[i] - original[i]) < 1e-5, `index ${i}`)
})

test('a reference compared with itself scores full marks with no advice', () => {
  for (const gloss of ['hello', 'water', 'doctor', 'where']) {
    const result = comparePractice(motion(gloss), motion(gloss))
    assert.ok(!isPracticeError(result))
    assert.equal(result.score, 100, gloss)
    assert.equal(result.tips.length, 0, `${gloss}: ${result.tips.map((t) => t.text).join(' | ')}`)
  }
})

test('a different sign scores low; a lower hand and a missing hand get the right advice', () => {
  const doctor = motion('doctor')
  const wrong = comparePractice(motion('train'), doctor)
  assert.ok(!isPracticeError(wrong))
  assert.ok(wrong.score < 50, `train vs doctor scored ${wrong.score}`)

  const low = comparePractice(moveHands(motion('water'), 0.25), motion('water'))
  assert.ok(!isPracticeError(low))
  assert.equal(low.tips[0]?.kind, 'higher', JSON.stringify(low.tips))

  // Remove the second hand from a two-handed sign.
  const ref = motion('meet')
  const seq = sequenceFeatures(ref)
  assert.ok(seq.features.filter((f) => f.hands[0] && f.hands[1]).length > seq.features.length / 2, 'meet is two-handed')
  const oneHand = ref.map((src) => {
    const f = Float32Array.from(src)
    f.fill(0, 0, 65)
    return f
  })
  const result = comparePractice(oneHand, ref)
  assert.ok(!isPracticeError(result))
  assert.ok(result.tips.some((t) => t.kind === 'both-hands'), JSON.stringify(result.tips))
})

test('left-handed signing is compared mirrored', () => {
  const ref = motion('water')
  const mirrored = ref.map(mirrorFrame)
  const asIs = comparePractice(mirrored, ref)
  const left = comparePractice(mirrored, ref, { leftHanded: true })
  assert.ok(!isPracticeError(asIs) && !isPracticeError(left))
  assert.equal(left.score, 100)
  assert.ok(asIs.score < left.score)
})

test('frozen hands in a recording are ignored, short dropouts are filled, and bad input is reported', () => {
  assert.deepEqual(frozenBlocks(motion('thankyou')), [true, false])
  assert.deepEqual(frozenBlocks(motion('water')), [false, false])

  const frames = motion('water')
  const holed = frames.map((f, i) => {
    const copy = Float32Array.from(f)
    if (i === 8 || i === 9) copy.fill(0, 0, 130)
    return copy
  })
  const filled = fillHandGaps(holed)
  assert.ok(filled[8][0] !== 0 || filled[8][65] !== 0, 'two-frame gap filled')

  const noBody = frames.map((f) => {
    const copy = Float32Array.from(f)
    copy.fill(0, 130)
    return copy
  })
  assert.equal(comparePractice(noBody, frames), 'no-body')
  const noHands = frames.map((f) => {
    const copy = Float32Array.from(f)
    copy.fill(0, 0, 130)
    return copy
  })
  assert.equal(comparePractice(noHands, frames), 'no-hands')
  assert.equal(bodyZone(-1), 'forehead height')
  assert.equal(bodyZone(0.3), 'chest height')
})

test('the practice streak counts back from today, or from yesterday until today is practised', () => {
  assert.equal(practiceStreak([], '2026-03-01'), 0)
  assert.equal(practiceStreak(['2026-02-27', '2026-02-28', '2026-03-01'], '2026-03-01'), 3)
  assert.equal(practiceStreak(['2026-02-27', '2026-02-28'], '2026-03-01'), 2)
  assert.equal(practiceStreak(['2026-02-26', '2026-02-28'], '2026-03-01'), 1)
  assert.equal(practiceStreak(['2026-02-27'], '2026-03-01'), 0)
  assert.equal(practiceStreak(['2025-12-31', '2026-01-01'], '2026-01-01'), 2)
})

test('signs to work on are forgotten or weakly matched signs, most forgotten first', () => {
  const card = (gloss, lapses, bestScore) => ({ ...newCard(gloss, 0), lapses, bestScore })
  const cards = { a: card('a', 0, 90), b: card('b', 2, 80), c: card('c', 0, 40), d: card('d', 1), e: card('e', 0) }
  assert.deepEqual(signsToWorkOn(cards).map((c) => c.gloss), ['b', 'd', 'c'])
  assert.equal(signsToWorkOn(cards, 1).length, 1)
})
