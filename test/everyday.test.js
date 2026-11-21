import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { decodeVisit, encodeVisit, EMPTY_VISIT, smsLink, sosMessage, validateVisit, visitText, whatsappLink, whatsappNumber } from '../src/lib/visitCard.ts'
import { matchGroups, SOUND_GROUPS } from '../src/lib/soundAlerts.ts'
import { signOfTheDay, WORK_PATHS, workParts } from '../src/learn/workPaths.ts'

const signs = new Set(readdirSync(new URL('../public/signs/', import.meta.url)).map((f) => f.replace(/\.json$/, '')))

test('visit cards survive a share link and reject junk', async () => {
  const card = { ...EMPTY_VISIT, reason: 'Stomach pain', since: '3 days', questions: 'Is it serious?', needs: { write: true, interpreter: true, visual: false } }
  const back = await decodeVisit(await encodeVisit(card))
  assert.equal(back.reason, 'Stomach pain')
  assert.equal(back.needs.interpreter, true)
  assert.equal(await decodeVisit('not-a-card'), null)
  assert.equal(validateVisit({ place: 'Clinic' }), null, 'a card with nothing medical in it is not a visit card')
  assert.equal(validateVisit({ reason: 'x'.repeat(5000) }).reason.length, 600)
  assert.match(visitText(card), /I am Deaf\.\nPlease write things down for me\.\nPlease arrange an ISL interpreter/)
})

test('SOS messages carry a map link and open the right apps', () => {
  const text = sosMessage({ name: 'Asha' }, { latitude: 28.61394, longitude: 77.20902, accuracy: 18.4 })
  assert.match(text, /This is Asha\. I am Deaf and I need help\./)
  assert.match(text, /maps\.google\.com\/\?q=28\.613940,77\.209020 \(accurate to about 18 m\)/)
  assert.match(sosMessage({ name: '' }, null), /could not get my location/)
  assert.equal(whatsappNumber('98765 43210'), '919876543210')
  assert.equal(whatsappNumber('+44 7700 900123'), '447700900123')
  assert.equal(whatsappNumber('12'), null)
  assert.ok(smsLink('+91 98765-43210', 'help me').startsWith('sms:+919876543210?&body=help%20me'))
  assert.equal(whatsappLink('abc', 'x'), null)
})

test('sound alerts match only chosen sounds above their threshold', () => {
  const heard = [{ categoryName: 'Doorbell', score: 0.6 }, { categoryName: 'Bark', score: 0.9 }, { categoryName: 'Siren', score: 0.2 }]
  assert.deepEqual(matchGroups(heard, new Set(['door', 'siren']), 'normal').map((h) => h.id), ['door'])
  assert.deepEqual(matchGroups(heard, new Set(['siren']), 'high').map((h) => h.id), [], '0.2 is below even high sensitivity for sirens')
  assert.deepEqual(matchGroups([{ categoryName: 'Doorbell', score: 0.35 }], new Set(['door']), 'low'), [])
  const labels = new Set(readFileSync(new URL('./fixtures/yamnet_labels.txt', import.meta.url), 'utf8').split('\n'))
  for (const group of SOUND_GROUPS) for (const label of group.labels) assert.ok(labels.has(label), `YAMNet has no label "${label}"`)
})

test('work paths use real signs and split into lesson-sized parts', () => {
  for (const path of WORK_PATHS) {
    for (const key of path.signs) assert.ok(signs.has(key), `${path.id}: no sign "${key}"`)
    const parts = workParts(path)
    assert.ok(parts.every((p) => p.length >= 4 && p.length <= 12), `${path.id}: ${parts.map((p) => p.length)}`)
    assert.equal(parts.flat().length, path.signs.length)
  }
  assert.equal(signOfTheDay(['a', 'b', 'c'], '2026-11-21'), signOfTheDay(['c', 'a', 'b'], '2026-11-21'))
  assert.equal(signOfTheDay([], '2026-11-21'), null)
})
