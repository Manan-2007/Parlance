// Copies the website's ISL translation prompt and avatar vocabulary into the
// Serverpod server's assets, so the phone app's online translation uses the
// same rules. Run from the repo root after changing server/translationPrompt.js
// or src/translation/islVocabulary.js:
//   node parlance_mobile/parlance_mobile_server/tool/export_translation_prompt.mjs
import { writeFileSync } from 'node:fs'
import { SYSTEM_INSTRUCTION } from '../../../server/translationPrompt.js'
import { SUPPORTED_TOKENS } from '../../../src/translation/islVocabulary.js'

const out = new URL('../assets/translation/', import.meta.url)
writeFileSync(new URL('isl_prompt.txt', out), `${SYSTEM_INSTRUCTION}\n\nWrap the array in a JSON object: {"tokens": [...]}.\n`)
writeFileSync(new URL('tokens.json', out), `${JSON.stringify(SUPPORTED_TOKENS)}\n`)
console.log(`Exported ${SUPPORTED_TOKENS.length} tokens`)
