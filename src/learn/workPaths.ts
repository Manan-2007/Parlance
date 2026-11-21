/**
 * Signs for your work: short paths for people who serve the public (clinic,
 * police, bank, railway, shop, school), so Deaf visitors meet staff who know
 * the basics. Each path is split into lessons of about eight signs, taught
 * with the deck lesson machinery.
 *
 * Every key must exist in public/signs (checked by test/learn.test.js).
 */
export interface WorkPath {
  id: string;
  title: string;
  /** Who it is for. */
  who: string;
  /** Lucide icon name used by the Learn screens. */
  icon: "stethoscope" | "shield" | "landmark" | "train" | "store" | "school";
  /** The card place to practise alongside (see features/cards/cardData.ts). */
  cardPlace?: string;
  signs: string[];
}

export const WORK_PATHS: WorkPath[] = [
  {
    id: "clinic",
    title: "Clinic and pharmacy",
    who: "Reception, nurses, doctors and chemists",
    icon: "stethoscope",
    cardPlace: "hospital",
    signs: [
      "hello", "name", "deaf", "interpreter", "write", "wait", "sit", "doctor",
      "pain", "fever", "headache", "cough", "stomach", "blood", "sick", "nurse",
      "medicine", "tablet", "injection", "eat", "morning", "evening", "night", "operation",
      "hospital", "emergency", "toilet", "water", "thankyou", "sorry",
    ],
  },
  {
    id: "police",
    title: "Police",
    who: "Officers at the desk and on patrol",
    icon: "shield",
    cardPlace: "police",
    signs: [
      "hello", "police", "help", "deaf", "interpreter", "write", "name", "phone",
      "what", "where", "when", "who", "lose", "find", "show", "home",
      "accident", "danger", "stop", "careful", "wait", "sit", "sorry", "thankyou",
    ],
  },
  {
    id: "bank",
    title: "Bank and office counters",
    who: "Cashiers, clerks and help desks",
    icon: "landmark",
    cardPlace: "bank",
    signs: [
      "hello", "bank", "money", "pay", "give", "take", "deaf", "write",
      "name", "phone", "show", "wait", "sit", "howmuch", "finish", "ok",
      "yes", "no", "help", "thankyou",
    ],
  },
  {
    id: "railway",
    title: "Railway and bus",
    who: "Ticket counters, enquiry and station staff",
    icon: "train",
    cardPlace: "railway",
    signs: [
      "hello", "train", "bus", "station", "ticket", "time", "hour", "late",
      "early", "wait", "where", "which", "go", "come", "today", "now",
      "one", "two", "three", "four", "five", "help", "deaf", "thankyou",
    ],
  },
  {
    id: "shop",
    title: "Shops and markets",
    who: "Shopkeepers and stall owners",
    icon: "store",
    cardPlace: "shop",
    signs: [
      "hello", "shop", "want", "have", "howmuch", "price", "cheap", "expensive",
      "money", "pay", "give", "big", "small", "more", "less", "food",
      "milk", "rice", "vegetable", "fruit", "yes", "no", "thankyou", "welcome",
    ],
  },
  {
    id: "school",
    title: "Schools and colleges",
    who: "Teachers and classmates",
    icon: "school",
    signs: [
      "hello", "name", "teacher", "student", "school", "college", "study", "learn",
      "read", "write", "book", "understand", "dontknow", "again", "slow", "finish",
      "good", "sit", "stand", "friend", "signlanguage", "deaf", "sorry", "thankyou",
    ],
  },
];

export const WORK_PART_SIZE = 8;

export function getWorkPath(id: string | undefined): WorkPath | undefined {
  return WORK_PATHS.find((path) => path.id === id);
}

/** The path's signs in lesson-sized parts, keeping only signs that are available. */
export function workParts(path: WorkPath, available?: ReadonlySet<string>): string[][] {
  const signs = available ? path.signs.filter((key) => available.has(key)) : path.signs;
  const parts: string[][] = [];
  for (let i = 0; i < signs.length; i += WORK_PART_SIZE) parts.push(signs.slice(i, i + WORK_PART_SIZE));
  // Fold a tiny last part into the one before it.
  if (parts.length > 1 && parts[parts.length - 1]!.length < 4) {
    const last = parts.pop()!;
    parts[parts.length - 1]!.push(...last);
  }
  return parts;
}

export function workDeckId(pathId: string, part: number): string {
  return `work-${pathId}-${part}`;
}

/** Today's sign: the same for everyone on a given local day. */
export function signOfTheDay(keys: readonly string[], day: string): string | null {
  if (!keys.length) return null;
  let hash = 2166136261;
  for (const char of day) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const sorted = [...keys].sort();
  return sorted[hash % sorted.length] ?? null;
}
