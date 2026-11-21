/**
 * Natural English or Hindi for the signs recognised so far.
 *
 * The rule-based `toEnglish` sentence is always available offline. When the
 * server has a Gemini key, this asks `/api/sign-sentence` for a natural
 * rewrite a short moment after the last sign. The server refuses rewrites
 * that lose negation or numbers, and a result is only used while it still
 * matches the current signs.
 */
import { useEffect, useState } from "react";

export type SentenceLanguage = "en" | "hi";

export interface NaturalSentence {
  /** The glosses this text was written for, joined by spaces. */
  key: string;
  text: string;
  language: SentenceLanguage;
}

const DEBOUNCE_MS = 450;
let online: Promise<boolean> | undefined;

function onlineAvailable(): Promise<boolean> {
  online ??= fetch("/api/config")
    .then((response) => (response.ok ? response.json() : { online: false }))
    .then((config: { online?: boolean }) => config.online === true)
    .catch(() => false);
  return online;
}

export function sentenceKey(glosses: readonly string[]): string {
  return glosses.join(" ");
}

export function useSignSentence(glosses: readonly string[], language: SentenceLanguage) {
  const key = sentenceKey(glosses);
  const [result, setResult] = useState<NaturalSentence | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!key) {
      setPending(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!(await onlineAvailable()) || controller.signal.aborted) return;
      setPending(true);
      try {
        const response = await fetch("/api/sign-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ glosses: key.split(" "), language }),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(6000)]),
        });
        if (!response.ok) return;
        const body = (await response.json()) as { text?: unknown };
        if (typeof body.text === "string" && body.text.trim()) {
          setResult({ key, text: body.text.trim(), language });
        }
      } catch {
        /* offline or superseded: the rule-based sentence remains */
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [key, language]);

  const current = result && result.key === key && result.language === language ? result : null;
  return { natural: current, pending: pending && !current };
}
