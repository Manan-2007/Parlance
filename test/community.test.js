import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyThreadEvent, formatCode, handleProblem, lengthProblem, LIMITS, meetupState, meetupTimes, normaliseCode, timeAgo, upsertThread,
} from '../src/community/model.ts'

const HOUR = 3_600_000

const member = { id: 1, handle: 'Asha', city: 'Pune', ways: ['deaf'], sample: false, joinedAt: 0 }
const thread = (over = {}) => ({
  id: 1, space: 'tech', kind: 'question', title: 'Captions', body: 'Which app has the best captions?', input: 'typed', author: member,
  createdAt: 100, editedAt: null, lastActivityAt: 100, replyCount: 0, helpful: 0, myHelpful: false, answerId: null,
  hidden: false, mine: false, meetup: null, ...over,
})
const reply = (id, over = {}) => ({
  id, threadId: 1, body: `Reply ${id}`, input: 'typed', quoteId: null, author: member, createdAt: 200 + id, editedAt: null,
  helpful: 0, myHelpful: false, mine: false, ...over,
})

test('community names follow the same rules as the service', () => {
  assert.equal(handleProblem('Asha'), null)
  assert.equal(handleProblem('आशा के'), null)
  assert.match(handleProblem('ab'), /at least 3/)
  assert.match(handleProblem('<script>'), /letters, numbers/)
  assert.match(handleProblem('x'.repeat(30)), /at most 24/)
  assert.equal(lengthProblem('Short', LIMITS.body, 'post'), 'Write at least 10 characters in the post.')
  assert.equal(lengthProblem('   ', LIMITS.reply, 'reply'), 'Write your reply first.')
  assert.equal(lengthProblem('A proper post body', LIMITS.body, 'post'), null)
})

test('meetup state opens the live room an hour early and closes it at the end', () => {
  const meetup = { startsAt: 10 * HOUR, endsAt: 12 * HOUR }
  assert.equal(meetupState(meetup, 8 * HOUR), 'upcoming')
  assert.equal(meetupState(meetup, 9.5 * HOUR), 'soon')
  assert.equal(meetupState(meetup, 11 * HOUR), 'now')
  assert.equal(meetupState(meetup, 12 * HOUR), 'ended')
})

test('live codes are read and written in two groups of three', () => {
  assert.equal(formatCode('123456'), '123 456')
  assert.equal(formatCode('12'), '12')
  assert.equal(normaliseCode(' 123-456 '), '123456')
  assert.equal(normaliseCode('12345'), null)
})

test('meetup times come from the form in local time and may run past midnight', () => {
  const times = meetupTimes('2027-01-10', '22:00', '01:00')
  assert.equal(times.endsAt - times.startsAt, 3 * HOUR)
  assert.equal(meetupTimes('10/01/2027', '10:00', '11:00'), null)
})

test('relative times stay short', () => {
  const now = 1_000 * HOUR
  assert.equal(timeAgo(now - 10_000, now), 'just now')
  assert.equal(timeAgo(now - 5 * 60_000, now), '5 min ago')
  assert.equal(timeAgo(now - 3 * HOUR, now), '3 h ago')
  assert.equal(timeAgo(now - 30 * HOUR, now), 'yesterday')
  assert.equal(timeAgo(now - 72 * HOUR, now), '3 days ago')
})

test('live list updates keep order and respect the filter', () => {
  const a = thread({ id: 1, lastActivityAt: 100 })
  const b = thread({ id: 2, lastActivityAt: 200, kind: 'discussion' })
  assert.deepEqual(upsertThread([b, a], { ...a, lastActivityAt: 300 }, 'active').map(t => t.id), [1, 2])
  assert.deepEqual(upsertThread([a], b, 'unanswered').map(t => t.id), [1])
  assert.deepEqual(upsertThread([a], { ...a, answerId: 5 }, 'unanswered'), [])
})

test('thread events add, edit and remove replies without losing this viewer’s flags', () => {
  let detail = { ...thread({ mine: true, myHelpful: false }), replies: [reply(1, { mine: true })] }
  detail = applyThreadEvent(detail, { type: 'reply', reply: reply(2) })
  assert.equal(detail.replies.length, 2)
  assert.equal(detail.replyCount, 1)
  // The same reply arriving twice (own post + broadcast) is kept once.
  assert.equal(applyThreadEvent(detail, { type: 'reply', reply: reply(2) }).replies.length, 2)

  detail = applyThreadEvent(detail, { type: 'reply-updated', reply: reply(1, { body: 'Edited', mine: false }) })
  assert.equal(detail.replies[0].body, 'Edited')
  assert.equal(detail.replies[0].mine, true)

  detail = applyThreadEvent(detail, { type: 'helpful', target: 'reply', id: 2, count: 4 })
  assert.equal(detail.replies[1].helpful, 4)

  detail = { ...detail, answerId: 2 }
  detail = applyThreadEvent(detail, { type: 'reply-removed', id: 2 })
  assert.equal(detail.answerId, null)
  assert.equal(detail.replies.length, 1)

  const updated = applyThreadEvent(detail, { type: 'thread-updated', thread: thread({ title: 'New title', mine: false }) })
  assert.equal(updated.title, 'New title')
  assert.equal(updated.mine, true)
  assert.equal(updated.replies.length, 1)
  assert.equal(applyThreadEvent(detail, { type: 'thread-removed', threadId: 1 }), null)
})
