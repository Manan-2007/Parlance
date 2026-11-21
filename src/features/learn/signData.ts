/**
 * Loading and describing ISLRTC sign recordings for the Learn screens.
 */
import { useEffect, useState } from "react";
import { loadSign, type SignMotion } from "@/engine/avatar/signMotion";
import { bodyZone, sequenceFeatures } from "@/learn/motion";
import { decodeFrames, isCustomKey } from "@/learn/recordings";
import type { SignLibrary } from "@/services/signs/library";
import { findCustomSign, teachReady } from "@/stores/teach";
import { readableSignLabel } from "@/translation/islVocabulary.js";

const customCache = new Map<string, { data: string; motion: SignMotion }>();

/** A recording made in Teach, as a playable motion. */
export function customMotion(key: string): SignMotion | null {
  const sign = findCustomSign(key);
  if (!sign) return null;
  const cached = customCache.get(key);
  if (cached?.data === sign.frames) return cached.motion;
  const motion: SignMotion = { gloss: key, english: sign.english, pos: sign.letter ? "letter" : "recording", fps: sign.fps, frames: decodeFrames(sign.frames) };
  customCache.set(key, { data: sign.frames, motion });
  return motion;
}

/** ISLRTC recording or Teach recording, by key. */
export async function loadMotion(key: string): Promise<SignMotion | null> {
  if (!isCustomKey(key)) return loadSign(key);
  await teachReady();
  return customMotion(key);
}

export type SignSource = { kind: "islrtc" } | { kind: "recording"; author?: string };

export function sourceOf(key: string): SignSource {
  if (!isCustomKey(key)) return { kind: "islrtc" };
  return { kind: "recording", author: findCustomSign(key)?.author };
}

/** Badge text for a reference figure. */
export function sourceLabel(key: string): string {
  const source = sourceOf(key);
  return source.kind === "islrtc" ? "ISLRTC signer" : source.author ? `Recorded by ${source.author}` : "Your recording";
}

export function useSignMotions(glosses: readonly string[]): { motions: (SignMotion | null)[]; loading: boolean } {
  const key = glosses.join(" ");
  const [state, setState] = useState<{ key: string; motions: (SignMotion | null)[] }>({ key: "", motions: [] });
  useEffect(() => {
    let live = true;
    const list = key ? key.split(" ") : [];
    void Promise.all(list.map((key) => loadMotion(key))).then((motions) => {
      if (live) setState({ key, motions });
    });
    return () => {
      live = false;
    };
  }, [key]);
  return state.key === key ? { motions: state.motions, loading: false } : { motions: [], loading: true };
}

export interface SourceVideo {
  id: string;
  title: string;
}
type Sources = Record<string, SourceVideo[]>;
let sourcesCache: Sources | null = null;
let sourcesPromise: Promise<Sources> | null = null;

function loadSources(): Promise<Sources> {
  sourcesPromise ??= fetch(`${import.meta.env?.BASE_URL ?? "/"}signs/sources.json`)
    .then((response) => (response.ok ? response.json() : { signs: {} }))
    .then((data: { signs?: Sources }) => (sourcesCache = data.signs ?? {}))
    .catch(() => (sourcesCache = {}));
  return sourcesPromise;
}

export function useSignSources(): Sources | null {
  const [sources, setSources] = useState<Sources | null>(sourcesCache);
  useEffect(() => {
    if (sourcesCache) return;
    let live = true;
    void loadSources().then((value) => live && setSources(value));
    return () => {
      live = false;
    };
  }, []);
  return sources;
}

/** "thankyou" → "thank you" (manifest English), or a translator token's readable form. */
export function englishOf(key: string, library: SignLibrary): string {
  if (isCustomKey(key)) return findCustomSign(key)?.english ?? "recording";
  return library.signs[key]?.english ?? readableSignLabel(key).toLowerCase();
}

/** Gloss-style label: "THANK YOU". */
export function glossTextOf(key: string, library: SignLibrary): string {
  return englishOf(key, library).toUpperCase();
}

export function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface SignFacts {
  hands: "one" | "both" | "unclear";
  zone: string | null;
  seconds: number;
  /** The recording lost track of one hand for the whole clip. */
  lostHand: boolean;
}

/** Plain facts read off the ISLRTC recording itself. */
export function signFacts(motion: SignMotion): SignFacts {
  const seq = sequenceFeatures(motion.frames);
  const seconds = motion.frames.length / (motion.fps || 15);
  if (!seq || !seq.features.length) return { hands: "unclear", zone: null, seconds, lostHand: false };
  const lostHand = seq.ignore[0] || seq.ignore[1];
  const both = seq.features.filter((f) => f.hands[0] && f.hands[1]).length / seq.features.length;
  const left = seq.features.filter((f) => f.hands[0]).length;
  const right = seq.features.filter((f) => f.hands[1]).length;
  const main = right > left ? 1 : 0;
  const ys = seq.features.map((f) => f.hands[main]?.y).filter((y): y is number => y !== undefined).sort((a, b) => a - b);
  const zone = ys.length ? bodyZone(ys[ys.length >> 1]!) : null;
  return { hands: lostHand ? "unclear" : both > 0.4 ? "both" : "one", zone, seconds, lostHand };
}
