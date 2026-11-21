/**
 * Turns a curriculum lesson (or a phrase saved from the translator) into the
 * ordered steps the lesson player walks through:
 *
 *   watch → recognise (interleaved, two signs at a time) → sign it → order
 *
 * and, for a unit's closing conversation, alternating "they sign" (pick the
 * meaning) and "you reply" (build the ISL sentence) steps.
 *
 * Deterministic for a given seed, so a lesson does not reshuffle on re-render.
 */
import { SUPPORTED_TOKENS } from "../translation/islVocabulary.js";
import {
  CONVERSATION_LESSON_ID,
  UNITS,
  curriculumGlosses,
  getPhrase,
  lessonKey,
  type DialogueLine,
  type GrammarRule,
  type Unit,
} from "./curriculum.ts";

export type Step =
  | { kind: "intro" }
  | { kind: "watch"; gloss: string }
  /** A sign with no ISLRTC recording: Remy demonstrates it (approximate). */
  | { kind: "watch-avatar"; token: string }
  | { kind: "recognize"; gloss: string; options: string[] }
  | { kind: "sign"; gloss: string }
  | { kind: "order"; english: string; literal?: string; answer: string[]; tiles: string[]; rules: GrammarRule[] }
  | { kind: "listen"; line: DialogueLine; options: string[] }
  | { kind: "reply"; line: DialogueLine; tiles: string[] }
  | { kind: "done" };

export interface LessonPlan {
  /** Progress key ("<unit>/<lesson>" or "phrase/<id>"). */
  key: string;
  title: string;
  context: string;
  /** Signs introduced by this lesson (they join the review deck). */
  signs: string[];
  steps: Step[];
}

/* ---------------------------------------------------------- randomness -- */

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed: string | number): () => number {
  let state = typeof seed === "number" ? seed >>> 0 : hash(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Shuffle so the result is not already in the answer's order (when possible). */
function scramble<T>(items: readonly T[], answer: readonly T[], random: () => number): T[] {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const out = shuffle(items, random);
    const prefix = out.filter((item) => answer.includes(item)).slice(0, answer.length);
    if (answer.length < 2 || prefix.some((item, i) => item !== answer[i])) return out;
  }
  return [...items].reverse();
}

function pick<T>(pool: readonly T[], count: number, exclude: ReadonlySet<T>, random: () => number): T[] {
  return shuffle(
    pool.filter((item) => !exclude.has(item)),
    random,
  ).slice(0, count);
}

/* -------------------------------------------------------------- catalog -- */

const tokenKey = (text: string) => text.toLowerCase().replace(/[_\s-]/g, "");
const TOKEN_BY_KEY = new Map(SUPPORTED_TOKENS.map((token) => [tokenKey(token), token]));
const DIGIT_WORDS: Record<string, string> = {
  "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "nine",
};

/** Remy's token for an ISLRTC gloss ("thankyou" → "THANK_YOU"), if Remy has the sign. */
export function avatarTokenFor(gloss: string): string | null {
  return TOKEN_BY_KEY.get(tokenKey(gloss)) ?? null;
}

/** The ISLRTC gloss for a translator token ("THANK_YOU" → "thankyou"), if recorded. */
export function glossForToken(token: string, available: ReadonlySet<string>): string | null {
  const key = DIGIT_WORDS[token] ?? tokenKey(token);
  return available.has(key) ? key : null;
}

/* ---------------------------------------------------------------- plans -- */

function unitSigns(unit: Unit): string[] {
  return [...new Set(unit.lessons.flatMap((lesson) => lesson.signs))];
}

/** Wrong answers from the same lesson first, then the unit, then anywhere. */
function recognizeOptions(gloss: string, lessonSigns: readonly string[], unit: Unit, random: () => number): string[] {
  const chosen: string[] = [];
  for (const pool of [lessonSigns, unitSigns(unit), curriculumGlosses()]) {
    if (chosen.length >= 3) break;
    chosen.push(...pick(pool, 3 - chosen.length, new Set([gloss, ...chosen]), random));
  }
  return shuffle([gloss, ...chosen], random);
}

const QUESTION_KEYS = new Set(["what", "where", "who", "when", "why", "how", "which", "howmuch", "howmany"]);
const TIME_KEYS = new Set(["today", "yesterday", "tomorrow", "now", "morning", "night", "evening", "afternoon", "week", "month", "year", "time", "later"]);

/** The grammar notes that apply to a phrase from the translator, read off its order. */
export function inferRules(keys: readonly string[]): GrammarRule[] {
  const norm = keys.map((k) => tokenKey(k));
  const rules: GrammarRule[] = [];
  if (norm.length > 1 && TIME_KEYS.has(norm[0]!)) rules.push("time-first");
  if (norm.length > 1 && QUESTION_KEYS.has(norm.at(-1)!)) rules.push("wh-last");
  if (norm.length > 2 && norm.at(-1) === "no") rules.push("negation-after");
  return rules;
}

function orderStep(
  english: string,
  answer: string[],
  rules: GrammarRule[],
  distractorPool: readonly string[],
  random: () => number,
  literal?: string,
): Step {
  const distractor = pick(distractorPool, 1, new Set(answer), random);
  return { kind: "order", english, literal, answer, tiles: scramble([...answer, ...distractor], answer, random), rules };
}

function conversationPlan(unit: Unit, random: () => number): LessonPlan {
  const dialogue = unit.dialogue!;
  const allEnglish = UNITS.flatMap((u) => [...u.phrases.map((p) => p.english), ...(u.dialogue?.lines.map((l) => l.english) ?? [])]);
  const steps: Step[] = [{ kind: "intro" }];
  for (const line of dialogue.lines) {
    if (line.who === "they") {
      const local = dialogue.lines.filter((l) => l.english !== line.english).map((l) => l.english);
      const others = pick(local, 2, new Set(), random);
      const more = pick(allEnglish, 3 - others.length, new Set([line.english, ...others]), random);
      steps.push({ kind: "listen", line, options: shuffle([line.english, ...others, ...more], random) });
    } else {
      const distractor = pick(unitSigns(unit), 1, new Set(line.glosses), random);
      steps.push({ kind: "reply", line, tiles: scramble([...line.glosses, ...distractor], line.glosses, random) });
    }
  }
  steps.push({ kind: "done" });
  const signs = [...new Set(dialogue.lines.flatMap((l) => l.glosses))];
  return { key: lessonKey(unit.id, CONVERSATION_LESSON_ID), title: dialogue.title, context: dialogue.setting, signs, steps };
}

export function planLesson(unitId: string, lessonId: string, seed: string | number = `${unitId}/${lessonId}`): LessonPlan | null {
  const unit = UNITS.find((u) => u.id === unitId);
  if (!unit) return null;
  const random = seededRandom(seed);
  if (lessonId === CONVERSATION_LESSON_ID) return unit.dialogue ? conversationPlan(unit, random) : null;
  const lesson = unit.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;

  const steps: Step[] = [{ kind: "intro" }];
  // Teach two, check two: short gaps between seeing a sign and recalling it.
  for (let i = 0; i < lesson.signs.length; i += 2) {
    const pair = lesson.signs.slice(i, i + 2);
    for (const gloss of pair) steps.push({ kind: "watch", gloss });
    for (const gloss of shuffle(pair, random)) steps.push({ kind: "recognize", gloss, options: recognizeOptions(gloss, lesson.signs, unit, random) });
  }
  // A final mixed round of recognition across the whole lesson.
  for (const gloss of shuffle(lesson.signs, random).slice(0, 3)) {
    steps.push({ kind: "recognize", gloss, options: recognizeOptions(gloss, lesson.signs, unit, random) });
  }
  // Producing a sign beats watching it: two camera attempts per lesson.
  for (const gloss of shuffle(lesson.signs, random).slice(0, 2)) steps.push({ kind: "sign", gloss });
  for (const id of lesson.phrases ?? []) {
    const phrase = getPhrase(unit, id);
    if (phrase) steps.push(orderStep(phrase.english, phrase.glosses, phrase.rules, unitSigns(unit), random, phrase.literal));
  }
  steps.push({ kind: "done" });
  return { key: lessonKey(unit.id, lesson.id), title: lesson.title, context: unit.situation, signs: lesson.signs, steps };
}

export interface SavedPhrase {
  id: string;
  text: string;
  /** Translator tokens, in ISL order (UPPER_SNAKE or fingerspelling like A-M-I-T). */
  tokens: string[];
  createdAt: number;
}

/**
 * A lesson for a phrase the learner saved from the translator. Words with an
 * ISLRTC recording are taught from it; the rest are shown by Remy and labelled
 * approximate. Fingerspelled names and numbers are watched, not scored.
 */
export function planPhraseLesson(phrase: SavedPhrase, available: ReadonlySet<string>): LessonPlan {
  const random = seededRandom(phrase.id);
  const steps: Step[] = [{ kind: "intro" }];
  const glosses: string[] = [];
  const seen = new Set<string>();
  for (const token of phrase.tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    const gloss = glossForToken(token, available);
    if (gloss) {
      glosses.push(gloss);
      steps.push({ kind: "watch", gloss });
    } else {
      steps.push({ kind: "watch-avatar", token });
    }
  }
  if (phrase.tokens.length > 1) {
    const answer = phrase.tokens.map((token) => glossForToken(token, available) ?? token);
    steps.push({ kind: "order", english: phrase.text, answer, tiles: scramble(answer, answer, random), rules: inferRules(phrase.tokens) });
  }
  for (const gloss of glosses.slice(0, 3)) steps.push({ kind: "sign", gloss });
  steps.push({ kind: "done" });
  return { key: `phrase/${phrase.id}`, title: phrase.text, context: "A phrase you translated", signs: glosses, steps };
}

/** A single-sign practice session (from the sign library). */
export function planSingleSign(gloss: string): LessonPlan {
  return {
    key: `sign/${gloss}`,
    title: gloss,
    context: "Sign library",
    signs: [gloss],
    steps: [{ kind: "watch", gloss }, { kind: "sign", gloss }, { kind: "done" }],
  };
}
