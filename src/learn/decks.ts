/**
 * Lesson decks: a teacher's own set of signs and phrases (ISLRTC signs and/or
 * their own recordings), shared as a link or a file. No server: the whole deck
 * travels inside the link's #fragment (never sent to any server) or the file.
 */
import { lessonKey } from "./curriculum.ts";
import { seededRandom, shuffle, inferRules, type LessonPlan, type Step } from "./lessonPlan.ts";
import { packJson, unpackJson } from "./packing.ts";
import { customKey, isCustomKey, validateCustomSign, type CustomSign } from "./recordings.ts";

export interface DeckPhrase {
  english: string;
  /** Sign keys in ISL order: ISLRTC glosses or "rec:<id>". */
  items: string[];
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  author?: string;
  createdAt: number;
  /** Sign keys in teaching order. */
  items: string[];
  /** The deck's own recordings, so a shared deck is self-contained. */
  signs: CustomSign[];
  phrases: DeckPhrase[];
  /** Created on this device (editable), or received. */
  own?: boolean;
}

export const DECK_LIMITS = { items: 40, signs: 30, phrases: 20, phraseItems: 12 };
const FILE_MARKER = "parlance-deck";

const clip = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

/**
 * Validate a deck from an untrusted source. ISLRTC glosses must exist in
 * `available`; recording keys must refer to a recording inside the deck.
 */
export function validateDeck(raw: unknown, available: ReadonlySet<string>): Deck | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = clip(r.id, 64);
  const title = clip(r.title, 80);
  if (!id || !/^[A-Za-z0-9-]+$/.test(id) || !title) return null;
  const signs = (Array.isArray(r.signs) ? r.signs : [])
    .slice(0, DECK_LIMITS.signs)
    .map(validateCustomSign)
    .filter((s): s is CustomSign => s !== null);
  const own = new Set(signs.map((s) => customKey(s.id)));
  const known = (key: unknown): key is string => typeof key === "string" && (own.has(key) || (!isCustomKey(key) && available.has(key)));
  const items = [...new Set((Array.isArray(r.items) ? r.items : []).filter(known))].slice(0, DECK_LIMITS.items);
  if (!items.length) return null;
  const phrases = (Array.isArray(r.phrases) ? r.phrases : [])
    .slice(0, DECK_LIMITS.phrases)
    .map((p) => {
      if (!p || typeof p !== "object") return null;
      const q = p as Record<string, unknown>;
      const english = clip(q.english, 120);
      const keys = (Array.isArray(q.items) ? q.items : []).filter(known).slice(0, DECK_LIMITS.phraseItems);
      return english && keys.length ? { english, items: keys } : null;
    })
    .filter((p): p is DeckPhrase => p !== null);
  const used = new Set([...items, ...phrases.flatMap((p) => p.items)]);
  return {
    id,
    title,
    description: clip(r.description, 300),
    author: clip(r.author, 40),
    createdAt: typeof r.createdAt === "number" && Number.isFinite(r.createdAt) ? r.createdAt : Date.now(),
    items,
    signs: signs.filter((s) => used.has(customKey(s.id))),
    phrases,
  };
}

function shareable(deck: Deck): Omit<Deck, "own"> {
  const { own: _own, ...rest } = deck;
  return rest;
}

/** Deck → compact text for a link fragment (deflate + base64url). */
export async function encodeDeck(deck: Deck): Promise<string> {
  return packJson(shareable(deck));
}

/** Link fragment text → deck, or null if it is not a valid deck. */
export async function decodeDeck(text: string, available: ReadonlySet<string>): Promise<Deck | null> {
  const raw = await unpackJson(text);
  return raw === undefined ? null : validateDeck(raw, available);
}

export function deckToFile(deck: Deck): string {
  return JSON.stringify({ [FILE_MARKER]: 1, ...shareable(deck) });
}

export function deckFromFile(text: string, available: ReadonlySet<string>): Deck | null {
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    if (raw[FILE_MARKER] !== 1) return null;
    return validateDeck(raw, available);
  } catch {
    return null;
  }
}

/**
 * A lesson for a deck: watch and recognise its signs, sign them, then build
 * its phrases. `english` resolves any key to its English meaning.
 */
export function planDeckLesson(deck: Deck, english: (key: string) => string, fillers: readonly string[], seed: string | number = deck.id): LessonPlan {
  const random = seededRandom(seed);
  const steps: Step[] = [{ kind: "intro" }];
  const items = deck.items;
  const options = (key: string): string[] => {
    const meaning = english(key);
    const pool = shuffle(
      items.filter((k) => k !== key && english(k) !== meaning),
      random,
    );
    for (const filler of shuffle(fillers, random)) {
      if (pool.length >= 3) break;
      if (!pool.includes(filler) && english(filler) !== meaning) pool.push(filler);
    }
    return shuffle([key, ...pool.slice(0, 3)], random);
  };
  for (let i = 0; i < items.length; i += 2) {
    const pair = items.slice(i, i + 2);
    for (const key of pair) steps.push({ kind: "watch", gloss: key });
    for (const key of shuffle(pair, random)) steps.push({ kind: "recognize", gloss: key, options: options(key) });
  }
  for (const key of shuffle(items, random).slice(0, Math.min(3, items.length))) steps.push({ kind: "sign", gloss: key });
  for (const phrase of deck.phrases) {
    const tiles = phrase.items.length > 1 ? phrase.items : [];
    if (!tiles.length) continue;
    let scrambled = shuffle(tiles, random);
    if (scrambled.every((k, i) => k === tiles[i])) scrambled = [...tiles].reverse();
    steps.push({ kind: "order", english: phrase.english, answer: phrase.items, tiles: scrambled, rules: inferRules(phrase.items) });
  }
  steps.push({ kind: "done" });
  return { key: lessonKey("deck", deck.id), title: deck.title, context: deck.description ?? (deck.author ? `A deck by ${deck.author}` : "A shared deck"), signs: items, steps };
}
