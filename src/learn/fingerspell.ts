/**
 * Fingerspelling practice. There are no ISLRTC letter recordings in Parlance,
 * so letters are shown by Remy (approximate) and the UI says so. A letter can
 * be checked with the camera only when someone has recorded it in Teach.
 */
import { seededRandom, shuffle } from "./lessonPlan.ts";

/** Common names and short words to read, grouped by length. */
export const SPELLING_WORDS: readonly string[] = [
  "AMIT", "RAVI", "ASHA", "NEHA", "ARUN", "MEERA", "PRIYA", "RAHUL", "KIRAN", "ANITA",
  "VIJAY", "SUNIL", "POOJA", "DEEPA", "ROHAN", "ISHA", "OMAR", "SARA", "JOHN", "ZOYA",
  "DELHI", "PUNE", "GOA", "AGRA", "SURAT", "PATNA", "KOCHI", "SHIMLA", "MUMBAI", "CHENNAI",
  "BOOK", "BAG", "CAKE", "MILK", "FISH", "JUICE", "LAMP", "QUIZ", "VAN", "YOGA",
];

/** Uppercase A-Z only; everything else is dropped. */
export function normalizeSpelling(text: string): string {
  return text.toUpperCase().replace(/[^A-Z]/g, "");
}

export function spellingMatches(guess: string, word: string): boolean {
  return normalizeSpelling(guess) === normalizeSpelling(word);
}

/**
 * Words to read, easiest first: short ones until the learner gets a streak,
 * then longer. `level` 0 = up to 4 letters, 1 = up to 5, 2 = anything.
 */
export function wordsForLevel(level: number, seed: string | number): string[] {
  const random = seededRandom(seed);
  const max = level <= 0 ? 4 : level === 1 ? 5 : 99;
  return shuffle(SPELLING_WORDS.filter((w) => w.length <= max), random);
}

/**
 * Queue glosses for Remy, one per letter. A trailing hyphen makes the
 * scheduler fingerspell the letter: a bare "I" would play the pronoun sign.
 */
export function letterGlosses(word: string): string[] {
  return [...normalizeSpelling(word)].map((letter) => `${letter}-`);
}
