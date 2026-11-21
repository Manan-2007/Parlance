/**
 * Page-change fingerspelling. The root route's loader waits just long enough
 * for <RouteTransition> to spell the destination's word, so the new page
 * swaps in while the overlay still covers it. Only real page changes wait:
 * hash links, search-param changes and reduced motion pass straight through.
 */
import type { LoaderFunctionArgs, ShouldRevalidateFunctionArgs } from "react-router-dom";
import { cleanWord } from "@/components/brand/SignHands";

const WORDS: [prefix: string, word: string][] = [
  ["/app/cards", "HELP"],
  ["/app/sound-alerts", "SOUND"],
  ["/app/speech-to-sign", "SIGN"],
  ["/app/sign-to-text", "READ"],
  ["/app/learn", "ABC"],
  ["/app/history", "LOG"],
  ["/app/settings", "SET"],
  ["/app/help", "HELP"],
  ["/app", "SIGN"],
];

export function signFor(pathname: string) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "HI";
  return WORDS.find(([p]) => clean === p || clean.startsWith(`${p}/`))?.[1] ?? "GO";
}

export const IRIS_MS = 520;
export const LETTER_MS = 360;

export function holdFor(word: string) {
  return IRIS_MS + cleanWord(word).length * LETTER_MS + 120;
}

function prefersReducedMotion() {
  if (typeof document === "undefined") return true;
  const setting = document.documentElement.dataset.motion;
  if (setting === "reduce") return true;
  if (setting === "full") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** "/app/learn/signs/x" → "/app/learn"; the workspace home is its own section. */
function sectionOf(pathname: string) {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  return parts[0] === "app" ? `/app/${parts[1] ?? ""}` : `/${parts[0] ?? ""}`;
}

/**
 * Spell only when moving between sections. Cards never wait: they are for
 * emergencies and counters, where a second matters.
 */
export function shouldSpell(from: string | null, to: string) {
  // Emergencies cannot wait, and the embedded signer opens inside the phone app.
  if (to.startsWith("/app/cards") || to.startsWith("/embed")) return false;
  return from === null || sectionOf(from) !== sectionOf(to);
}

let firstLoad = true;
let lastPath: string | null = null;

export async function routeGate({ request }: LoaderFunctionArgs) {
  // The first load is covered by the HydrateFallback and the intro instead.
  const path = new URL(request.url).pathname;
  const from = lastPath;
  lastPath = path;
  if (firstLoad) {
    firstLoad = false;
    return null;
  }
  if (prefersReducedMotion() || !shouldSpell(from, path)) return null;
  await new Promise((resolve) => setTimeout(resolve, holdFor(signFor(path))));
  return null;
}

/** Re-run the gate only when the pathname changes. */
export function shouldGate({ currentUrl, nextUrl }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname !== nextUrl.pathname;
}
