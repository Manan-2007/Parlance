import type { QueueItem } from "@/avatar/playback";
import { translateOffline, translateToGloss } from "@/translation/islTranslator.js";
import { playbackKind, readableSignLabel } from "@/translation/islVocabulary.js";

export interface GlossResult {
  tokens: QueueItem[];
  notation: string;
}

export interface Translation {
  gloss: GlossResult;
  queue: QueueItem[];
}

let onlineEnabled: Promise<boolean> | undefined;
function useOnlineEngine() {
  onlineEnabled ??= fetch("/api/config")
    .then(async (response) => response.ok && (await response.json()).online === true)
    .catch(() => false);
  return onlineEnabled;
}

export async function prepareSpeech(text: string, options?: { local?: boolean; signal?: AbortSignal }): Promise<Translation> {
  const online = !options?.local && await useOnlineEngine();
  const result = online ? await translateToGloss(text, options?.signal) : translateOffline(text);
  const queue = result.tokens.map((gloss) => ({ gloss, label: readableSignLabel(gloss), missing: false, kind: playbackKind(gloss) }));
  const missing = (result.skipped ?? []).map((gloss) => ({ gloss, label: gloss, missing: true }));
  return {
    gloss: { tokens: [...queue, ...missing], notation: result.glossText },
    queue,
  };
}
