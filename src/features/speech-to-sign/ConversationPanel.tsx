import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { ArrowUp, AudioLines, GraduationCap, MessageSquareDashed, Mic, MicOff, Play, Square, Trash2, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pal } from "@/components/brand/Pal";
import { useLearn } from "@/stores/learn";
import type { QueueItem } from "@/avatar/playback";
import type { GlossResult } from "@/services/signs/prepareSpeech";
import { cn } from "@/lib/cn";
import { formatDuration, formatTime } from "@/lib/time";
import { SPEECH_ERROR_MESSAGES, type SpeechInput } from "@/services/speech/useSpeechInput";
import type { InputSource } from "@/stores/history";
import type { SpeechLanguage } from "@/stores/settings";
import { PHRASE_GROUPS } from "./phrases";

export interface Exchange {
  id: string;
  text: string;
  gloss: GlossResult;
  queue: QueueItem[];
  input: InputSource;
  at: number;
}

const SOURCE: Record<InputSource, string> = { voice: "Spoken", typed: "Typed", phrase: "Phrase", camera: "Signed" };
const MAX_LENGTH = 300;

interface ConversationPanelProps {
  exchanges: Exchange[];
  activeId: string | null;
  onReplay: (id: string) => void;
  onClear: () => void;
  text: string;
  onText: (text: string) => void;
  onSubmit: (source: InputSource, override?: string) => void;
  busy: boolean;
  speech: SpeechInput;
  language: SpeechLanguage;
  onLanguage: (language: SpeechLanguage) => void;
}

export function ConversationPanel({
  exchanges,
  activeId,
  onReplay,
  onClear,
  text,
  onText,
  onSubmit,
  busy,
  speech,
  language,
  onLanguage,
}: ConversationPanelProps) {
  const inputId = useId();
  const languageId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const savePhrase = useLearn((l) => l.savePhrase);
  const listening = speech.status === "listening" || speech.status === "starting";
  const processing = speech.status === "processing";

  // Keep the newest exchange in view (the empty state starts at its top).
  useEffect(() => {
    const log = logRef.current;
    if (log && exchanges.length > 0) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [exchanges.length]);

  // Grow the textarea with its content, up to five lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 152)}px`;
  }, [text, speech.interim]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit("typed");
    }
  };

  return (
    <section aria-label="Conversation" className="flex h-full min-h-0 flex-col rounded-[2rem] bg-surface">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-tangerine-400 text-navy" aria-hidden>
            <AudioLines className="size-[1.125rem]" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base leading-5 font-extrabold tracking-[-0.02em]">Conversation</h2>
            <p className="text-xs font-bold text-tangerine-800">
              Speech <span aria-hidden>→</span>
              <span className="sr-only">to</span> Sign
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={exchanges.length === 0}
          className="press inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-bold text-ink-2 hover:bg-paper hover:text-navy disabled:opacity-40"
        >
          <Trash2 className="size-3.5" aria-hidden /> Clear
        </button>
      </div>

      <div ref={logRef} className="scrollbar-parlance min-h-0 flex-1 overflow-y-auto" aria-live="polite" aria-relevant="additions">
        {exchanges.length === 0 ? (
          <div className="px-4 py-5 sm:px-5">
            <div className="flex items-end gap-3">
              <Pal pose="wave" outfit="tangerine" skin="medium" hair="short" animate className="-mb-1 h-24" />
              <div className="relative mb-4 rounded-[1.5rem] rounded-bl-md bg-sun-400 px-4 py-3">
                <p className="text-[1.375rem] leading-[1.1] font-extrabold tracking-[-0.035em] text-navy">What would you like to say?</p>
              </div>
            </div>
            <p className="mt-4 text-[0.9375rem] leading-6 text-ink-2">
              Type or speak in English or Hindi. Parlance turns your message into ISL gloss for the 3D signer.
            </p>
            <div className="mt-6 space-y-5">
              {PHRASE_GROUPS.map((group, g) => (
                <div key={group.label}>
                  <p className="flex items-center gap-2 text-xs font-extrabold tracking-[0.08em] text-navy uppercase">
                    <span aria-hidden className={cn("size-2.5 rounded-full", g === 0 ? "bg-tangerine-400" : "bg-cobalt-400")} />
                    {group.label}
                  </p>
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {group.phrases.map((phrase) => (
                      <li key={phrase}>
                        <button
                          type="button"
                          disabled={listening}
                          onClick={() => {
                            onText(phrase);
                            onSubmit("phrase", phrase);
                          }}
                          className="press group inline-flex min-h-10 items-center gap-1.5 rounded-full bg-paper py-1.5 pr-2.5 pl-4 text-left text-[0.9375rem] font-bold text-navy hover:bg-sun-200 disabled:opacity-50"
                        >
                          {phrase}
                          <ArrowUp className="size-4 shrink-0 rotate-45 text-ink-3 transition-colors group-hover:text-royal" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ol className="space-y-3 p-3 sm:p-4">
            {exchanges.map((x) => {
              const active = x.id === activeId;
              const missing = x.gloss.tokens.filter((t) => t.missing);
              return (
                <li
                  key={x.id}
                  className={cn(
                    "relative animate-pop rounded-[1.5rem] px-4 py-3.5 transition-[background-color,box-shadow]",
                    active ? "bg-tangerine-100 ring-2 ring-tangerine-400" : "bg-paper-50",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="flex items-center gap-2 text-xs font-semibold text-ink-3">
                      {active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-navy px-2 py-0.5 text-[0.6875rem] font-extrabold text-white">
                          <span aria-hidden className="size-1.5 rounded-full bg-gold" /> On stage
                        </span>
                      )}
                      <span>
                        {SOURCE[x.input]} · <time dateTime={new Date(x.at).toISOString()}>{formatTime(x.at)}</time>
                      </span>
                    </p>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onReplay(x.id)}
                        disabled={x.queue.length === 0}
                        className="press inline-flex h-8 items-center gap-1.5 rounded-full bg-cobalt-400 px-3 text-[0.8125rem] font-bold text-white hover:bg-cobalt-500 disabled:opacity-40"
                        aria-label={`Sign again: ${x.text}`}
                      >
                        <Play className="size-3.5" aria-hidden /> Sign again
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/app/learn/phrase/${savePhrase(x.text, x.queue.map((item) => item.gloss))}`)}
                        disabled={x.queue.length === 0}
                        className="press inline-flex h-8 items-center gap-1.5 rounded-full bg-paper px-3 text-[0.8125rem] font-bold text-navy hover:bg-sun-200 disabled:opacity-40"
                        aria-label={`Practise signing: ${x.text}`}
                      >
                        <GraduationCap className="size-3.5" aria-hidden /> Practise
                      </button>
                    </span>
                  </div>
                  <p className="mt-1.5 text-[1.125rem] leading-7 font-bold text-ink">{x.text}</p>
                  {x.gloss.tokens.length > 0 ? (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={`ISL gloss: ${x.gloss.notation}`}>
                      {x.gloss.tokens.map((t, i) => (
                        <span
                          key={`${t.gloss}-${i}`}
                          className={cn(
                            "inline-flex h-7 items-center rounded-full px-2.5 text-xs font-extrabold tracking-[0.05em] uppercase",
                            t.missing ? "border-2 border-dashed border-ink-3/50 text-ink-3 line-through" : "bg-navy text-white",
                          )}
                        >
                          {t.label}
                          {t.kind === "fingerspelling" && <span className="ml-1 font-semibold tracking-normal lowercase opacity-75">(spelled)</span>}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-3">
                      <MessageSquareDashed className="size-4" aria-hidden /> Nothing here could be translated.
                    </p>
                  )}
                  {x.queue.some((t) => t.kind === "fingerspelling") && (
                    <p className="mt-2 text-[0.8125rem] leading-5 text-ink-2">
                      Spelled letter by letter: {x.queue.filter((t) => t.kind === "fingerspelling").map((t) => t.label).join(", ")}. Names and words without a word sign are spelled.
                    </p>
                  )}
                  {missing.length > 0 && (
                    <p className="mt-2.5 flex items-start gap-1.5 text-[0.8125rem] leading-5 text-gold-800">
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      <span>
                        No sign in the library yet for {missing.map((t) => t.label).join(", ")}: shown as text instead.
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit("typed");
        }}
        className="shrink-0 rounded-b-[2rem] border-t border-line bg-surface p-2.5 sm:p-4"
      >
        {(listening || processing) && (
          <p className="mb-2 flex w-fit items-center gap-2 rounded-full bg-danger-bg px-3 py-1 text-[0.8125rem] font-semibold" role="status">
            <span className="relative inline-flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-danger/50" />
              <span className="relative size-2.5 rounded-full bg-danger" />
            </span>
            <span className="text-danger">{processing ? "Transcribing" : "Recording"}</span>
            <span className="text-ink-2 tabular-nums">{formatDuration(speech.elapsed)}</span>
            <span className="flex h-4 items-center gap-0.5" aria-hidden>
              {[6, 12, 8, 14, 10, 7, 12].map((h, i) => (
                <span key={i} className="w-0.5 rounded-full bg-danger/60" style={{ height: h, animation: `wave 0.8s ${i * 0.09}s ease-in-out infinite alternate` }} />
              ))}
            </span>
          </p>
        )}
        {speech.error && (
          <p className="mb-2 flex items-start gap-2 rounded-2xl bg-gold-50 px-3.5 py-2.5 text-[0.8125rem] leading-5 text-ink-2" role="alert">
            <MicOff className="mt-0.5 size-3.5 shrink-0 text-gold-800" aria-hidden />
            {SPEECH_ERROR_MESSAGES[speech.error]}
          </p>
        )}
        <label htmlFor={inputId} className="sr-only">
          Message to sign
        </label>
        <div
          className={cn(
            "flex items-end gap-1.5 rounded-[1.75rem] border-2 bg-paper-50 p-1.5 transition-[border-color,box-shadow,background-color] focus-within:border-cobalt-400 focus-within:bg-surface focus-within:shadow-[0_0_0_4px_rgb(28_79_216/0.15)]",
            listening ? "border-danger/60" : "border-navy",
          )}
        >
          <textarea
            ref={textareaRef}
            id={inputId}
            rows={1}
            value={listening && speech.interim ? speech.interim : text}
            onChange={(e) => onText(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={onKeyDown}
            readOnly={listening}
            maxLength={MAX_LENGTH}
            placeholder={listening ? "Listening…" : "Type a message…"}
            className="max-h-[9.5rem] min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[1.0625rem] leading-6 text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
          />
          {speech.supported && (
            <button
              type="button"
              onClick={listening ? speech.stop : speech.start}
              disabled={processing}
              aria-pressed={listening}
              aria-label={listening ? "Stop recording" : "Speak"}
              title={listening ? "Stop recording" : "Speak"}
              className={cn(
                "press inline-flex size-11 shrink-0 items-center justify-center rounded-full disabled:opacity-40",
                listening ? "bg-danger text-white" : "bg-tangerine-400 text-navy hover:bg-tangerine-300",
              )}
            >
              {listening ? <Square className="size-4 fill-current" aria-hidden /> : <Mic className="size-5" aria-hidden />}
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || busy || listening}
            aria-label="Sign this message"
            title="Sign this message"
            className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-cobalt-400 text-white hover:bg-cobalt-500 disabled:bg-cobalt-200 disabled:text-cobalt-800"
          >
            <ArrowUp className="size-5" aria-hidden />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <label htmlFor={languageId} className="font-semibold">
              Voice
            </label>
            <select
              id={languageId}
              value={language}
              onChange={(e) => onLanguage(e.target.value as SpeechLanguage)}
              className="rounded-full bg-paper px-2.5 py-1 font-bold text-navy"
            >
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="hi-IN">Hindi (India)</option>
            </select>
          </span>
          <span className="hidden sm:inline">
            {speech.supported ? "Enter to sign · Shift + Enter for a new line" : "Voice input isn't available in this browser"}
          </span>
        </div>
      </form>
    </section>
  );
}
