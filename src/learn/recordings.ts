/**
 * Signs recorded in Parlance by a teacher or learner: MediaPipe landmarks in
 * the motion library's format-2 layout (169 floats per frame), never video.
 *
 * Stored and shared compactly: each value is quantised to a 16-bit integer
 * (1e-4 resolution, far below tracker noise) and base64url-encoded.
 */
import { FRAME_FLOATS } from "../engine/avatar/signMotion.ts";

export interface CustomSign {
  id: string;
  /** What the sign means, in English. */
  english: string;
  /** Set when the recording is a fingerspelled letter (A-Z). */
  letter?: string;
  /** Who signed it, as they chose to be credited. */
  author?: string;
  notes?: string;
  createdAt: number;
  fps: number;
  /** Frame count. */
  count: number;
  /** Encoded frames: base64url of little-endian int16, FRAME_FLOATS per frame. */
  frames: string;
}

export const CUSTOM_PREFIX = "rec:";
export const MAX_RECORDING_FRAMES = 120;
const SCALE = 10_000;

export const customKey = (id: string) => `${CUSTOM_PREFIX}${id}`;
export const isCustomKey = (key: string) => key.startsWith(CUSTOM_PREFIX);
export const customId = (key: string) => key.slice(CUSTOM_PREFIX.length);

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToBytes(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeFrames(frames: readonly Float32Array[]): string {
  const view = new DataView(new ArrayBuffer(frames.length * FRAME_FLOATS * 2));
  frames.forEach((frame, f) => {
    for (let i = 0; i < FRAME_FLOATS; i += 1) {
      const value = Math.max(-32767, Math.min(32767, Math.round((frame[i] ?? 0) * SCALE)));
      view.setInt16((f * FRAME_FLOATS + i) * 2, value, true);
    }
  });
  return bytesToBase64Url(new Uint8Array(view.buffer));
}

export function decodeFrames(data: string): Float32Array[] {
  const bytes = base64UrlToBytes(data);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = Math.floor(bytes.byteLength / (FRAME_FLOATS * 2));
  const frames: Float32Array[] = [];
  for (let f = 0; f < count; f += 1) {
    const frame = new Float32Array(FRAME_FLOATS);
    for (let i = 0; i < FRAME_FLOATS; i += 1) frame[i] = view.getInt16((f * FRAME_FLOATS + i) * 2, true) / SCALE;
    frames.push(frame);
  }
  return frames;
}

const clip = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

/** Validate a custom sign from an untrusted source (a shared link or file). */
export function validateCustomSign(raw: unknown): CustomSign | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = clip(r.id, 64);
  const english = clip(r.english, 60);
  const frames = typeof r.frames === "string" && /^[A-Za-z0-9_-]+$/.test(r.frames) ? r.frames : null;
  if (!id || !/^[A-Za-z0-9-]+$/.test(id) || !english || !frames) return null;
  const count = Math.floor(base64UrlToBytes(frames).byteLength / (FRAME_FLOATS * 2));
  if (count < 4 || count > MAX_RECORDING_FRAMES) return null;
  const letter = typeof r.letter === "string" && /^[A-Z]$/.test(r.letter) ? r.letter : undefined;
  const fps = typeof r.fps === "number" && r.fps >= 5 && r.fps <= 60 ? r.fps : 15;
  const createdAt = typeof r.createdAt === "number" && Number.isFinite(r.createdAt) ? r.createdAt : Date.now();
  return { id, english, letter, author: clip(r.author, 40), notes: clip(r.notes, 200), createdAt, fps, count, frames };
}
