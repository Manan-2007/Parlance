/**
 * The live signer alone, for the Parlance phone app's "Interpret a speaker":
 * the app listens to a speaker and sends what it hears; this page signs it
 * continuously, word by word, with no buttons.
 *
 * The app calls window.parlanceLive.hear(text, isFinal) (a native web view) or
 * posts {"live":true,"text":…,"final":…} to this page (a web iframe).
 */
import { useEffect } from "react";
import { AvatarViewport } from "@/components/avatar/AvatarViewport";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useLiveSignQueue } from "@/features/speech-to-sign/useLiveSignQueue";

declare global {
  interface Window {
    parlanceLive?: { hear: (text: string, isFinal: boolean) => void; reset: () => void };
  }
}

export function EmbedLivePage() {
  useDocumentTitle("Live signer");
  const { queue, speed, current, hear, reset, onState } = useLiveSignQueue();

  useEffect(() => {
    window.parlanceLive = { hear: (text, isFinal) => hear(String(text).slice(0, 2000), Boolean(isFinal)), reset };
    const onMessage = (event: MessageEvent) => {
      let data: unknown = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      const message = data as { live?: boolean; text?: unknown; final?: unknown; reset?: boolean } | null;
      if (!message || message.live !== true) return;
      if (message.reset) reset();
      else if (typeof message.text === "string") hear(message.text.slice(0, 2000), message.final === true);
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      delete window.parlanceLive;
    };
  }, [hear, reset]);

  return (
    <main className="relative h-dvh bg-paper-2">
      <AvatarViewport
        queue={queue}
        playbackSpeed={speed}
        presentation="figure"
        interactive={false}
        onState={onState}
        label={current ? `Signer performing ${current}` : "Signer, waiting for speech"}
      />
      {current && (
        <span className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-navy/85 px-4 py-1 text-sm font-extrabold tracking-wide text-white uppercase">
          {current}
        </span>
      )}
    </main>
  );
}
