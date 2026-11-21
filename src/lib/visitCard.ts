/**
 * "About me" details and a visit card (symptoms, medicines, questions) that a
 * Deaf person prepares before an appointment and shows or shares with staff.
 * Shared cards travel inside a link's #fragment, like decks: no server.
 *
 * Relative imports carry `.ts` so node tests can load this file.
 */
import { packJson, unpackJson } from "../learn/packing.ts";

export interface Profile {
  name: string;
  contactName: string;
  contactPhone: string;
  bloodGroup: string;
  allergies: string;
  medicines: string;
  conditions: string;
}

export const EMPTY_PROFILE: Profile = {
  name: "",
  contactName: "",
  contactPhone: "",
  bloodGroup: "",
  allergies: "",
  medicines: "",
  conditions: "",
};

export interface VisitCard {
  /** Where the visit is, e.g. "Dr Rao, City Clinic". */
  place: string;
  reason: string;
  since: string;
  symptoms: string;
  medicines: string;
  allergies: string;
  questions: string;
  /** Ways the person asks to be communicated with. */
  needs: { write: boolean; interpreter: boolean; visual: boolean };
  name: string;
  updatedAt: number;
}

export const EMPTY_VISIT: VisitCard = {
  place: "",
  reason: "",
  since: "",
  symptoms: "",
  medicines: "",
  allergies: "",
  questions: "",
  needs: { write: true, interpreter: false, visual: false },
  name: "",
  updatedAt: 0,
};

export const VISIT_LIMITS = { short: 80, long: 600 } as const;

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Untrusted input → a visit card, or null when nothing useful is in it. */
export function validateVisit(raw: unknown): VisitCard | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const needs = (r.needs && typeof r.needs === "object" ? r.needs : {}) as Record<string, unknown>;
  const card: VisitCard = {
    place: clip(r.place, VISIT_LIMITS.short),
    reason: clip(r.reason, VISIT_LIMITS.long),
    since: clip(r.since, VISIT_LIMITS.short),
    symptoms: clip(r.symptoms, VISIT_LIMITS.long),
    medicines: clip(r.medicines, VISIT_LIMITS.long),
    allergies: clip(r.allergies, VISIT_LIMITS.long),
    questions: clip(r.questions, VISIT_LIMITS.long),
    needs: { write: needs.write === true, interpreter: needs.interpreter === true, visual: needs.visual === true },
    name: clip(r.name, VISIT_LIMITS.short),
    updatedAt: typeof r.updatedAt === "number" && Number.isFinite(r.updatedAt) ? r.updatedAt : 0,
  };
  return visitHasContent(card) ? card : null;
}

export function visitHasContent(card: VisitCard): boolean {
  return Boolean(card.reason || card.symptoms || card.medicines || card.allergies || card.questions);
}

export async function encodeVisit(card: VisitCard): Promise<string> {
  return packJson({ v: 1, ...card });
}

export async function decodeVisit(text: string): Promise<VisitCard | null> {
  const raw = await unpackJson(text);
  return raw === undefined ? null : validateVisit(raw);
}

/** The card as plain text, for printing or pasting into a message. */
export function visitText(card: VisitCard): string {
  const lines = [
    card.name ? `Visit card for ${card.name}` : "Visit card",
    "I am Deaf.",
    ...needsLines(card.needs),
    card.place && `Visit: ${card.place}`,
    card.reason && `Why I am here: ${card.reason}`,
    card.since && `Since: ${card.since}`,
    card.symptoms && `Symptoms: ${card.symptoms}`,
    card.medicines && `Medicines I take: ${card.medicines}`,
    card.allergies && `Allergies: ${card.allergies}`,
    card.questions && `My questions:\n${card.questions}`,
  ];
  return lines.filter(Boolean).join("\n");
}

export function needsLines(needs: VisitCard["needs"]): string[] {
  return [
    needs.write && "Please write things down for me.",
    needs.interpreter && "Please arrange an ISL interpreter if you can.",
    needs.visual && "Please show me, point, or use pictures.",
  ].filter((line): line is string => Boolean(line));
}

/** A phone number as WhatsApp wants it: digits with country code (India by default). */
export function whatsappNumber(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  const plain = digits.replace(/^\+/, "");
  if (/^\d{10}$/.test(plain)) return `91${plain}`;
  if (/^0\d{10}$/.test(plain)) return `91${plain.slice(1)}`;
  if (/^\d{11,15}$/.test(plain)) return plain;
  return null;
}

export interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/** The SOS message: who, that they are Deaf, and where (if known). */
export function sosMessage(profile: Pick<Profile, "name">, position: Position | null): string {
  const who = profile.name ? `This is ${profile.name}. ` : "";
  const where = position
    ? `My location: https://maps.google.com/?q=${position.latitude.toFixed(6)},${position.longitude.toFixed(6)} (accurate to about ${Math.max(1, Math.round(position.accuracy))} m).`
    : "I could not get my location.";
  return `${who}I am Deaf and I need help. Please come or send help. Message me, don't call. ${where}`;
}

export function smsLink(phone: string, body: string): string {
  // "?&body=" works on both Android and iOS.
  return `sms:${phone.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(body)}`;
}

export function whatsappLink(phone: string, body: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(body)}` : null;
}
