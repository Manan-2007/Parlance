// Gloss -> natural English or Hindi. Pure helpers shared by the API route and
// tests: request validation, the model prompt, and the meaning checks that a
// rewritten sentence must pass before the UI may show it.

export const MAX_GLOSSES = 30
const GLOSS = /^[a-z0-9]{1,24}$/
const NEGATIONS = new Set(['no', 'not', 'never', 'cannot', 'nothing', 'none'])

export function parseSentenceRequest(body) {
  const language = body?.language === 'hi' ? 'hi' : body?.language === 'en' ? 'en' : null
  const glosses = Array.isArray(body?.glosses) ? body.glosses : null
  if (!language || !glosses || glosses.length === 0 || glosses.length > MAX_GLOSSES) return null
  if (!glosses.every((g) => typeof g === 'string' && GLOSS.test(g))) return null
  return { language, glosses }
}

export function sentenceInstruction(language) {
  const target = language === 'hi' ? 'natural Hindi in Devanagari script' : 'natural, grammatical English'
  return `You are an Indian Sign Language (ISL) interpreter. The input is the sequence of ISL signs a camera recognised, in signing order, as lowercase gloss words. Write the ONE sentence the signer most plausibly meant, in ${target}.

ISL grammar to undo: time words come first; order is usually subject-object-verb; questions words (what, where, who, why, how, which, when) come at the end; negation ("no", "not") follows the verb; there are no articles, copulas or tense endings, so add them as the language requires.

Rules:
- Use every sign's meaning. Add only the small function words the language needs. Never add new content, people, places, numbers or opinions.
- Keep negation: if a sign negates, the sentence must be negative.
- Keep every number exactly as digits.
- Keep a question a question.
- Compound glosses are written without spaces (thankyou = "thank you", washface = "wash face", alot = "a lot").
- If the signs do not form a sentence, write them as a short natural phrase.

Return only JSON: {"text": "<sentence>"}.`
}

/** Reject rewrites that drop negation, numbers or question meaning. */
export function checkSentence(glosses, text, language) {
  if (typeof text !== 'string') return false
  const clean = text.trim()
  if (!clean || clean.length > 400) return false
  if (glosses.some((g) => NEGATIONS.has(g))) {
    const negated = language === 'hi'
      ? /नहीं|मत|ना\b|न\s|कभी नहीं|कुछ नहीं/.test(clean)
      : /\b(no|not|never|cannot|can't|nothing|none|nobody|don't|doesn't|didn't|won't|isn't|aren't|wasn't)\b|n't\b/i.test(clean)
    if (!negated) return false
  }
  for (const number of glosses.filter((g) => /^\d+$/.test(g))) {
    if (!clean.includes(number)) return false
  }
  return true
}
