/**
 * The live sign interpreter (a signer in the corner of a TV broadcast): the
 * rules that keep the avatar in time with speech it cannot slow down. Pure
 * functions, so node tests can load them.
 *
 * Like a human interpreter it signs words as they are heard (no waiting for
 * whole sentences), skips what it cannot sign quickly (long words would have
 * to be spelled letter by letter; they stay in the captions), and when it
 * falls behind it drops the oldest waiting signs and speeds up a little.
 */
import type { QueueItem } from "../../avatar/playback";

/** Words that may still become a two-word sign (THANK YOU, HOW MUCH, COME IN…). */
const STARTS_PHRASE = new Set(["thank", "how", "come", "go", "need", "wait", "good"]);

/** How many trailing interim words to hold back until the next update. */
export function phraseHoldBack(words: readonly string[]): number {
  const last = words[words.length - 1]?.toLowerCase().replace(/[.,!?;:"]/g, "");
  return last && STARTS_PHRASE.has(last) ? 1 : 0;
}

/** Longest word worth fingerspelling live; longer ones stay in the captions. */
export const MAX_LIVE_SPELLING = 3;

/**
 * Signs to perform live: every word sign and number, short spelled words
 * only. Returns the signs and the words left to the captions.
 */
export function liveSigns(items: readonly QueueItem[]): { signs: QueueItem[]; skipped: string[] } {
  const signs: QueueItem[] = [];
  const skipped: string[] = [];
  for (const item of items) {
    const letters = item.gloss.replaceAll("-", "");
    if (item.kind === "fingerspelling" && letters.length > MAX_LIVE_SPELLING) skipped.push(item.label);
    else signs.push(item);
  }
  return { signs, skipped };
}

/** Most signs to keep waiting; older ones are dropped to stay in time. */
export const MAX_BACKLOG = 6;

/**
 * The next batch to play from what is waiting: everything, or only the
 * newest [MAX_BACKLOG] when behind (the rest are dropped, counted in `dropped`).
 */
export function nextBatch(waiting: readonly QueueItem[], max = MAX_BACKLOG): { batch: QueueItem[]; dropped: number } {
  if (waiting.length <= max) return { batch: [...waiting], dropped: 0 };
  return { batch: waiting.slice(waiting.length - max), dropped: waiting.length - max };
}

/** Playback speed for a batch: a little faster when there is a lot to catch up. */
export function liveSpeed(batchLength: number): number {
  if (batchLength >= 5) return 1.4;
  if (batchLength >= 3) return 1.2;
  return 1;
}
