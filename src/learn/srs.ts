/**
 * Spaced review: a small Leitner schedule. A sign you get right waits longer
 * before it comes back; a sign you miss comes back the same day. Retrieval
 * with feedback, spread over time, is what makes vocabulary stick.
 */

export type Grade = "again" | "hard" | "good" | "easy";

export interface Card {
  gloss: string;
  /** 0 = still learning; 1-5 = increasingly long intervals. */
  box: number;
  /** Epoch ms when the card is next due. */
  due: number;
  reviews: number;
  lapses: number;
  /** Best camera practice score, if any. */
  bestScore?: number;
}

const MINUTE = 60_000;
const DAY = 86_400_000;
/** Interval after landing in each box. Box 0 is "later in this session". */
export const BOX_INTERVALS = [10 * MINUTE, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];
export const MAX_BOX = BOX_INTERVALS.length - 1;

export function newCard(gloss: string, now: number): Card {
  return { gloss, box: 0, due: now + BOX_INTERVALS[0]!, reviews: 0, lapses: 0 };
}

export function gradeCard(card: Card, grade: Grade, now: number): Card {
  let box = card.box;
  let lapses = card.lapses;
  if (grade === "again") {
    if (box > 0) lapses += 1;
    box = 0;
  } else if (grade === "hard") {
    box = Math.max(1, box);
  } else if (grade === "good") {
    box = Math.min(MAX_BOX, box + 1);
  } else {
    box = Math.min(MAX_BOX, box + 2);
  }
  return { ...card, box, lapses, reviews: card.reviews + 1, due: now + BOX_INTERVALS[box]! };
}

export function isDue(card: Card, now: number): boolean {
  return card.due <= now;
}

/** Due cards, most overdue first. */
export function dueCards(cards: Record<string, Card>, now: number, limit = Infinity): Card[] {
  return Object.values(cards)
    .filter((card) => isDue(card, now))
    .sort((a, b) => a.due - b.due)
    .slice(0, limit);
}

/** A card counts as learned once it has survived at least one day's gap. */
export function isLearned(card: Card): boolean {
  return card.box >= 2;
}

/** Grade from a camera practice score. Undefined means "don't grade". */
export function gradeFromScore(score: number): Grade {
  if (score >= 85) return "easy";
  if (score >= 65) return "good";
  if (score >= 45) return "hard";
  return "again";
}

/**
 * Consecutive practice days ending today, or ending yesterday when today has
 * no practice yet (the streak is still alive until the day is over).
 * `days` are local YYYY-MM-DD dates; `today` is the same format.
 */
export function practiceStreak(days: readonly string[], today: string): number {
  const set = new Set(days);
  const step = (day: string) => {
    const [y, m, d] = day.split("-").map(Number);
    const date = new Date(y!, m! - 1, d! - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  let day = set.has(today) ? today : step(today);
  let streak = 0;
  while (set.has(day)) {
    streak += 1;
    day = step(day);
  }
  return streak;
}

/**
 * Signs worth extra practice: forgotten after being learned (lapses), or with
 * a weak best camera match. Most-forgotten first, then weakest match.
 */
export function signsToWorkOn(cards: Record<string, Card>, limit = 6): Card[] {
  const weak = (card: Card) => card.bestScore !== undefined && card.bestScore < 65;
  return Object.values(cards)
    .filter((card) => card.lapses > 0 || weak(card))
    .sort((a, b) => b.lapses - a.lapses || (a.bestScore ?? 100) - (b.bestScore ?? 100) || a.gloss.localeCompare(b.gloss))
    .slice(0, limit);
}
