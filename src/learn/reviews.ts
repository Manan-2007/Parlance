/**
 * Sign reviews by fluent signers. Nobody fluent has checked Parlance's own
 * signs yet: Remy's 3D animations, its fingerspelling letters, and teachers'
 * recordings. A reviewer marks each one correct, a regional variant, or wrong,
 * with an optional note, then shares their checks as a link or file (no
 * server). Every learner who opens it sees the status next to the sign.
 *
 * ISLRTC recordings are the national reference, so reviews of them record
 * regional variants rather than "wrong".
 *
 * Review keys:
 *   "<gloss>"        an ISLRTC recording, e.g. "water"
 *   "remy:<TOKEN>"   one of Remy's word signs, e.g. "remy:THANK_YOU"
 *   "letter:<A-Z>"   one of Remy's fingerspelled letters
 *   "rec:<id>"       a recording made in Teach
 */
import { packJson, unpackJson } from "./packing.ts";
import { AVATAR_ID } from "../avatar/model.js";

export type Verdict = "correct" | "variant" | "wrong";
export const VERDICTS: readonly Verdict[] = ["correct", "variant", "wrong"];

export interface SignReview {
  key: string;
  verdict: Verdict;
  note?: string;
  at: number;
}

export interface ReviewPack {
  id: string;
  reviewer: string;
  /** Where the reviewer's signing is from, e.g. "Delhi", "Mumbai". */
  region?: string;
  createdAt: number;
  reviews: SignReview[];
}

export interface ReviewSummary {
  correct: number;
  variant: number;
  wrong: number;
  notes: { reviewer: string; region?: string; verdict: Verdict; note: string }[];
}

export const MAX_REVIEWS = 600;
const KEY = /^(?:[a-z]{1,24}|remy:[A-Z_]{1,24}|letter:[A-Z]|avatar:[a-z0-9-]{1,32}:[A-Z_]{1,24}|avatar-letter:[a-z0-9-]{1,32}:[A-Z]|rec:[A-Za-z0-9-]{1,64})$/;

export const remyKey = (token: string) => `remy:${token}`;
export const letterKey = (letter: string) => `letter:${letter}`;
/** Keep old Remy/letter packs readable without applying them to a different rig. */
export const avatarKey = (token: string) => `avatar:${AVATAR_ID}:${token}`;
export const avatarLetterKey = (letter: string) => `avatar-letter:${AVATAR_ID}:${letter}`;
export const isReviewKey = (key: string) => KEY.test(key);

const clip = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

/** Validate a review pack from an untrusted link or file. Bad entries are dropped. */
export function validatePack(raw: unknown): ReviewPack | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = clip(r.id, 64);
  const reviewer = clip(r.reviewer, 40);
  if (!id || !/^[A-Za-z0-9-]+$/.test(id) || !reviewer) return null;
  const seen = new Set<string>();
  const reviews: SignReview[] = [];
  for (const entry of Array.isArray(r.reviews) ? r.reviews : []) {
    if (reviews.length >= MAX_REVIEWS) break;
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.key !== "string" || !KEY.test(e.key) || seen.has(e.key)) continue;
    if (!VERDICTS.includes(e.verdict as Verdict)) continue;
    seen.add(e.key);
    reviews.push({
      key: e.key,
      verdict: e.verdict as Verdict,
      note: clip(e.note, 200),
      at: typeof e.at === "number" && Number.isFinite(e.at) ? e.at : Date.now(),
    });
  }
  if (!reviews.length) return null;
  return {
    id,
    reviewer,
    region: clip(r.region, 40),
    createdAt: typeof r.createdAt === "number" && Number.isFinite(r.createdAt) ? r.createdAt : Date.now(),
    reviews,
  };
}

export const encodePack = (pack: ReviewPack): Promise<string> => packJson(pack);

export async function decodePack(text: string): Promise<ReviewPack | null> {
  const raw = await unpackJson(text);
  return raw === undefined ? null : validatePack(raw);
}

const FILE_MARKER = "parlance-reviews";
export const packToFile = (pack: ReviewPack) => JSON.stringify({ [FILE_MARKER]: 1, ...pack });
export function packFromFile(text: string): ReviewPack | null {
  try {
    const raw = JSON.parse(text) as Record<string, unknown>;
    return raw[FILE_MARKER] === 1 ? validatePack(raw) : null;
  } catch {
    return null;
  }
}

/** Combine every pack into one status per key. A reviewer counts once per key. */
export function summarize(packs: readonly ReviewPack[]): Map<string, ReviewSummary> {
  const out = new Map<string, ReviewSummary>();
  const counted = new Set<string>();
  for (const pack of packs) {
    for (const review of pack.reviews) {
      const who = `${pack.reviewer.toLowerCase()}|${review.key}`;
      if (counted.has(who)) continue;
      counted.add(who);
      const summary = out.get(review.key) ?? { correct: 0, variant: 0, wrong: 0, notes: [] };
      summary[review.verdict] += 1;
      if (review.note) summary.notes.push({ reviewer: pack.reviewer, region: pack.region, verdict: review.verdict, note: review.note });
      out.set(review.key, summary);
    }
  }
  return out;
}

export type ReviewStatus = "unchecked" | "checked" | "variant" | "flagged";

/** One word for a sign's standing: flagged wins over everything, then variants. */
export function statusOf(summary: ReviewSummary | undefined): ReviewStatus {
  if (!summary) return "unchecked";
  if (summary.wrong > 0 && summary.wrong >= summary.correct) return "flagged";
  if (summary.variant > 0 && summary.correct === 0) return "variant";
  return summary.correct > 0 ? "checked" : "variant";
}
