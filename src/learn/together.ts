/**
 * Practise together: two people, one screen. One signs a word the other can't
 * see; the other reads it. Signing for a real person, and reading a real
 * person's signing, is the skill a conversation needs.
 *
 * "guess" mode: two learners take turns. "check" mode: a fluent signer watches
 * the learner and says whether the sign was clear.
 */
import { seededRandom, shuffle } from "./lessonPlan.ts";

export type TogetherMode = "guess" | "check";

export interface Round {
  key: string;
  /** Four choices including `key` (guess mode). */
  options: string[];
  /** Index of the player signing this round (0 or 1). In check mode always 0. */
  signer: 0 | 1;
}

export function makeRounds(pool: readonly string[], count: number, mode: TogetherMode, seed: string | number, english: (key: string) => string = (k) => k): Round[] {
  const random = seededRandom(seed);
  const unique = [...new Set(pool)];
  if (unique.length < 2) return [];
  const order: string[] = [];
  while (order.length < count) order.push(...shuffle(unique, random));
  return order.slice(0, count).map((key, i) => {
    const meaning = english(key);
    const others = shuffle(
      unique.filter((k) => k !== key && english(k) !== meaning),
      random,
    ).slice(0, 3);
    return { key, options: shuffle([key, ...others], random), signer: mode === "check" ? 0 : ((i % 2) as 0 | 1) };
  });
}
