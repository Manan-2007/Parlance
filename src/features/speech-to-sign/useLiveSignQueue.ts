import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerState, QueueItem } from "@/avatar/playback";
import { planLiveCommit } from "@/translation/liveSpeech.js";
import { translateOffline } from "@/translation/islTranslator.js";
import { playbackKind, readableSignLabel } from "@/translation/islVocabulary.js";
import { liveSigns, liveSpeed, nextBatch, phraseHoldBack } from "./interpreter";

const words = (text: string) => text.split(/\s+/).filter(Boolean);

/**
 * Turns live speech into a signing queue that keeps up (see interpreter.ts):
 * `hear(text, isFinal)` takes what has been heard so far in the current
 * utterance (growing while it is partial, once more when final); words are
 * signed as soon as they are stable, in batches, skipping the oldest when
 * behind. Used by the phone app's live interpreter (/embed/live).
 */
export function useLiveSignQueue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [speed, setSpeed] = useState(1);
  const [current, setCurrent] = useState<string | null>(null);
  const finals = useRef<string[]>([]);
  const committed = useRef<string[]>([]);
  const waiting = useRef<QueueItem[]>([]);
  const busy = useRef(false);
  const queueRef = useRef<QueueItem[]>([]);
  const watchdog = useRef<number | undefined>(undefined);
  const pumpRef = useRef<() => void>(() => undefined);

  const pump = useCallback(() => {
    if (busy.current || waiting.current.length === 0) return;
    const { batch } = nextBatch(waiting.current);
    waiting.current = [];
    busy.current = true;
    // If the "finished" event is ever missed, never stay stuck.
    window.clearTimeout(watchdog.current);
    watchdog.current = window.setTimeout(() => {
      busy.current = false;
      pumpRef.current();
    }, 2500 + batch.length * 1800);
    queueRef.current = batch;
    setSpeed(liveSpeed(batch.length));
    setQueue(batch);
  }, []);
  pumpRef.current = pump;
  useEffect(() => () => window.clearTimeout(watchdog.current), []);

  const hear = useCallback(
    (text: string, isFinal: boolean) => {
      const spoken = words(text);
      if (isFinal) finals.current.push(...spoken);
      const interim = isFinal ? [] : spoken;
      const heard = { words: [...finals.current, ...interim], finalWordCount: finals.current.length, allFinal: interim.length === 0 };
      const plan = planLiveCommit(committed.current, heard, phraseHoldBack);
      committed.current = plan.committed;
      if (plan.chunk) {
        const { tokens } = translateOffline(plan.chunk);
        const items: QueueItem[] = tokens.map((gloss: string) => ({ gloss, label: readableSignLabel(gloss), missing: false, kind: playbackKind(gloss) }));
        waiting.current.push(...liveSigns(items).signs);
        pump();
      }
      // Keep memory small once everything heard is final and signed.
      if (heard.allFinal && committed.current.length === finals.current.length && finals.current.length > 60) {
        finals.current = finals.current.slice(-12);
        committed.current = [...finals.current];
      }
    },
    [pump],
  );

  const reset = useCallback(() => {
    finals.current = [];
    committed.current = [];
    waiting.current = [];
  }, []);

  const onState = useCallback(
    (state: PlayerState) => {
      setCurrent(queueRef.current[state.index]?.label ?? null);
      if (state.finished && busy.current) {
        busy.current = false;
        window.clearTimeout(watchdog.current);
        pump();
      }
    },
    [pump],
  );

  return { queue, speed, current, hear, reset, onState };
}
