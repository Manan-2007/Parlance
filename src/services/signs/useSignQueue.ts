import { useCallback, useEffect, useRef, useState } from "react";
import { prepareSpeech, type Translation } from "./prepareSpeech";

type QueueStatus = "idle" | "loading" | "ready" | "empty" | "error";

export function useSignQueue() {
  const [status, setStatus] = useState<QueueStatus>("idle");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);

  const translate = useCallback(async (text: string): Promise<Translation | null> => {
    if (!text.trim()) return null;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    try {
      const result = await prepareSpeech(text, { signal: controller.signal });
      if (controller.signal.aborted) return null;
      setStatus(result.queue.length ? "ready" : "empty");
      return result;
    } catch {
      if (!controller.signal.aborted) setStatus("error");
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    request.current?.abort();
    setStatus("idle");
  }, []);

  return { status, translate, clear };
}
