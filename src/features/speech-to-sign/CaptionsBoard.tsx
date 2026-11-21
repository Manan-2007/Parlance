/**
 * Live captions: big, continuous text of the speech around you (a class, a
 * meeting, an announcement), in English or Hindi. Any line can be signed by
 * the 3D signer, copied, or saved as a text file.
 */
import { useEffect, useId, useRef, useState } from "react";
import { Copy, Download, Expand, Hand, Mic, Minus, Plus, Shrink, Square, Trash2 } from "lucide-react";
import { announce, toast } from "@/components/ui/Toaster";
import { useFullscreen } from "@/hooks/useFullscreen";
import { cn } from "@/lib/cn";
import { createId } from "@/lib/id";
import { SPEECH_ERROR_MESSAGES, useSpeechInput } from "@/services/speech/useSpeechInput";
import type { SpeechLanguage } from "@/stores/settings";

interface Line {
  id: string;
  text: string;
  at: number;
}

const SIZES = ["text-[1.5rem] leading-[1.3]", "text-[2rem] leading-[1.25]", "text-[2.625rem] leading-[1.18]", "text-[3.375rem] leading-[1.1]"];

export function CaptionsBoard({
  language,
  onLanguage,
  onSign,
}: {
  language: SpeechLanguage;
  onLanguage: (language: SpeechLanguage) => void;
  onSign: (text: string) => void;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState(1);
  const languageId = useId();
  const boardRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const fullscreen = useFullscreen(boardRef);
  const speech = useSpeechInput(language, (text) => setLines((prev) => [...prev, { id: createId(), text, at: Date.now() }]), { continuous: true });
  const listening = speech.status === "listening" || speech.status === "starting";

  // Follow the newest line unless the reader scrolled back to reread.
  useEffect(() => {
    const log = logRef.current;
    if (log && pinned.current) log.scrollTo({ top: log.scrollHeight });
  }, [lines.length, speech.interim]);

  useEffect(() => () => speech.cancel(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const transcript = () =>
    lines.map((line) => `[${new Date(line.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] ${line.text}`).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transcript());
      toast("Captions copied");
    } catch {
      toast("Couldn't copy the captions");
    }
  };

  const download = () => {
    const blob = new Blob([transcript()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `captions-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggle = () => {
    if (listening) {
      speech.stop();
      announce("Captions stopped.");
    } else {
      speech.clearError();
      speech.start();
    }
  };

  return (
    <section ref={boardRef} aria-label="Live captions" className="flex h-full min-h-0 flex-col rounded-[2rem] bg-surface ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <label htmlFor={languageId} className="sr-only">
            Language being spoken
          </label>
          <select
            id={languageId}
            value={language}
            onChange={(e) => onLanguage(e.target.value as SpeechLanguage)}
            disabled={listening}
            className="h-10 rounded-full border border-line-strong bg-paper-50 px-3 text-sm font-bold text-navy disabled:opacity-60"
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">हिन्दी</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
          </select>
          <div className="flex items-center rounded-full bg-paper-2 p-1" role="group" aria-label="Caption size">
            <button type="button" onClick={() => setSize((s) => Math.max(0, s - 1))} disabled={size === 0} aria-label="Smaller captions" className="press inline-flex size-8 items-center justify-center rounded-full text-navy hover:bg-surface disabled:opacity-40">
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="px-1 text-xs font-bold text-ink-2" aria-hidden>
              Aa
            </span>
            <button type="button" onClick={() => setSize((s) => Math.min(SIZES.length - 1, s + 1))} disabled={size === SIZES.length - 1} aria-label="Bigger captions" className="press inline-flex size-8 items-center justify-center rounded-full text-navy hover:bg-surface disabled:opacity-40">
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={copy} disabled={!lines.length} title="Copy captions" aria-label="Copy captions" className="press inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper hover:text-navy disabled:opacity-40">
            <Copy className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={download} disabled={!lines.length} title="Save as a text file" aria-label="Save captions as a text file" className="press inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper hover:text-navy disabled:opacity-40">
            <Download className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => setLines([])} disabled={!lines.length} title="Clear captions" aria-label="Clear captions" className="press inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper hover:text-navy disabled:opacity-40">
            <Trash2 className="size-4" aria-hidden />
          </button>
          {fullscreen.supported && (
            <button type="button" onClick={fullscreen.toggle} title={fullscreen.active ? "Exit full screen" : "Full screen"} aria-label={fullscreen.active ? "Exit full screen" : "Full screen"} className="press inline-flex size-10 items-center justify-center rounded-full text-ink-2 hover:bg-paper hover:text-navy">
              {fullscreen.active ? <Shrink className="size-4" aria-hidden /> : <Expand className="size-4" aria-hidden />}
            </button>
          )}
        </div>
      </div>

      <div
        ref={logRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
        }}
        className="min-h-[18rem] flex-1 overflow-y-auto px-5 py-6 sm:px-8"
        aria-live="polite"
        aria-relevant="additions"
        lang={language === "hi-IN" ? "hi" : "en"}
      >
        {lines.length === 0 && !speech.interim ? (
          <div className="flex h-full flex-col justify-center">
            <p className={cn("font-extrabold tracking-[-0.03em] text-navy/35", SIZES[size])}>{listening ? "Listening… start speaking." : "Press Start captions, then put the device near the speaker."}</p>
            <p className="mt-4 max-w-xl text-[0.9375rem] leading-6 text-ink-3">
              For a class, a meeting or an announcement. Lines appear here as people speak; tap a line to see it signed. Captions come from your
              browser's speech service, which may need an internet connection.
            </p>
          </div>
        ) : (
          <ol className="grid gap-3">
            {lines.map((line, i) => (
              <li key={line.id} className="group flex items-start gap-3">
                <p className={cn("min-w-0 flex-1 font-bold tracking-[-0.02em]", SIZES[size], i === lines.length - 1 ? "text-navy" : "text-ink-2")}>{line.text}</p>
                <button
                  type="button"
                  onClick={() => onSign(line.text)}
                  aria-label={`Sign: ${line.text}`}
                  title="See this line signed"
                  className="press mt-1 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-tangerine-100 px-3 text-[0.8125rem] font-bold text-tangerine-800 opacity-100 hover:bg-tangerine-200 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                >
                  <Hand className="size-4" aria-hidden /> Sign
                </button>
              </li>
            ))}
            {speech.interim && <li className={cn("font-bold tracking-[-0.02em] text-ink-3", SIZES[size])}>{speech.interim}</li>}
          </ol>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={toggle}
          disabled={!speech.supported || speech.status === "processing"}
          className={cn(
            "press inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-bold disabled:opacity-50",
            listening ? "bg-navy text-white hover:bg-cobalt-500" : "bg-tangerine-400 text-navy hover:bg-tangerine-300",
          )}
        >
          {listening ? <Square className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}
          {listening ? "Stop captions" : "Start captions"}
        </button>
        <p className="min-w-0 flex-1 text-sm text-ink-3" role="status">
          {!speech.supported
            ? "This browser can't make captions. Try Chrome or Edge."
            : speech.error
              ? SPEECH_ERROR_MESSAGES[speech.error]
              : listening
                ? `Listening${lines.length ? ` · ${lines.length} line${lines.length === 1 ? "" : "s"}` : ""}`
                : lines.length
                  ? "Stopped. Copy or save the captions before you leave."
                  : ""}
        </p>
      </div>
    </section>
  );
}
