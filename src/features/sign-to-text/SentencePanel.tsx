import { CheckCheck, Eraser, MessageSquareText, Undo2, Volume2, VolumeX } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/time";
import { glossLabel, type SignLibrary } from "@/services/signs/library";
import type { NaturalSentence, SentenceLanguage } from "@/services/signs/useSignSentence";

export interface BuiltWord {
  id: string;
  word: string;
  confidence: number;
}

export interface FinishedSentence {
  id: string;
  text: string;
  gloss: string;
  at: number;
}

interface SentencePanelProps {
  words: BuiltWord[];
  english: string;
  /** AI rewrite of the current signs, when the server offers one. */
  natural: NaturalSentence | null;
  naturalPending: boolean;
  language: SentenceLanguage;
  onLanguage: (language: SentenceLanguage) => void;
  onFinish: () => void;
  onUndo: () => void;
  onClear: () => void;
  onSpeak: (text: string) => void;
  speechSupported: boolean;
  voiceOutput: boolean;
  onVoiceOutput: (on: boolean) => void;
  autoFinish: boolean;
  library: SignLibrary;
}

function TextButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[0.875rem] font-bold text-ink-2 hover:bg-paper hover:text-navy disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

export function SentencePanel({
  words,
  english,
  natural,
  naturalPending,
  language,
  onLanguage,
  onFinish,
  onUndo,
  onClear,
  onSpeak,
  speechSupported,
  voiceOutput,
  onVoiceOutput,
  autoFinish,
  library,
}: SentencePanelProps) {
  const empty = words.length === 0;
  const shown = natural?.text ?? english;
  return (
    <section aria-label="Sentence being built">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-extrabold tracking-[0.08em] text-navy uppercase">Sentence</h2>
        <Segmented
          label="Sentence language"
          size="sm"
          value={language}
          onChange={onLanguage}
          options={[
            { value: "en", label: "English" },
            { value: "hi", label: "हिन्दी", ariaLabel: "Hindi" },
          ]}
        />
        {speechSupported ? (
          <Switch checked={voiceOutput} onChange={onVoiceOutput} label="Speak aloud" />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
            <VolumeX className="size-3.5" aria-hidden /> No speech output here
          </span>
        )}
      </div>

      <div
        className={cn(
          "mt-3 min-h-[6.5rem] rounded-[1.75rem] p-5 transition-colors",
          empty ? "flex items-center gap-3 border-2 border-dashed border-line-strong bg-paper-50" : "bg-sun-400",
        )}
      >
        {empty ? (
          <>
            <MessageSquareText className="size-6 shrink-0 text-ink-3" aria-hidden />
            <p className="text-[1rem] leading-6 text-ink-2">Recognised signs build up here, in the order you sign them.</p>
          </>
        ) : (
          <div className="min-w-0">
            <p lang={natural?.language ?? "en"} className="text-[2rem] leading-[1.1] font-extrabold tracking-[-0.04em] text-navy">
              {shown}
            </p>
            {natural ? (
              <p className="mt-1.5 text-xs font-bold text-navy/70">
                Written by AI from your signs. Word by word: <span lang="en">{english}</span>
              </p>
            ) : naturalPending ? (
              <p className="mt-1.5 text-xs font-bold text-navy/70" aria-hidden>
                Writing a natural sentence…
              </p>
            ) : language === "hi" ? (
              <p className="mt-1.5 text-xs font-bold text-navy/70">Hindi needs the online translator, so this is English.</p>
            ) : null}
            <p className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label="Recognised signs">
              {words.map((w) => (
                <span
                  key={w.id}
                  className="inline-flex h-7 animate-pop items-center gap-1.5 rounded-full bg-navy px-2.5 text-[0.8125rem] font-extrabold tracking-[0.05em] text-white uppercase"
                >
                  {glossLabel(w.word, library)}
                  <span className="font-bold tracking-normal text-sun-300 normal-case tabular-nums">{Math.round(w.confidence * 100)}%</span>
                </span>
              ))}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSpeak(shown)}
          disabled={!speechSupported || empty}
          className="press inline-flex h-11 items-center gap-2 rounded-full bg-cobalt-400 px-5 text-[0.9375rem] font-bold text-white hover:bg-cobalt-500 disabled:bg-cobalt-200 disabled:text-cobalt-800"
        >
          <Volume2 className="size-[1.125rem]" aria-hidden /> Speak
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={empty}
          className="press inline-flex h-11 items-center gap-2 rounded-full border-2 border-navy bg-surface px-4 text-[0.9375rem] font-bold text-navy hover:bg-forest-100 disabled:opacity-40"
        >
          <CheckCheck className="size-[1.125rem]" aria-hidden /> Finish
        </button>
        <TextButton onClick={onUndo} disabled={empty}>
          <Undo2 aria-hidden /> Undo
        </TextButton>
        <TextButton onClick={onClear} disabled={empty}>
          <Eraser aria-hidden /> Clear
        </TextButton>
      </div>
      <p className="mt-2 text-xs text-ink-3">{autoFinish ? "Finishes by itself after a short pause in signing." : "Press Finish when the sentence is complete."}</p>
    </section>
  );
}

export function Transcript({
  log,
  onSpeak,
  speaking,
  speechSupported,
}: {
  log: FinishedSentence[];
  onSpeak: (text: string) => void;
  speaking: boolean;
  speechSupported: boolean;
}) {
  return (
    <section aria-label="This conversation">
      <h2 className="text-xs font-extrabold tracking-[0.08em] text-navy uppercase">This conversation</h2>
      {log.length === 0 ? (
        <p className="mt-3 text-[0.9375rem] leading-6 text-ink-3">Finished sentences appear here, newest first, and in History.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {log.map((s) => (
            <li key={s.id} className="flex animate-pop items-start gap-3 rounded-[1.5rem] rounded-tl-md bg-forest-400 px-4 py-3 text-white">
              <div className="min-w-0 flex-1">
                <p className="text-lg leading-7 font-bold text-white">{s.text}</p>
                <p className="mt-0.5 text-xs font-semibold text-white/80">
                  <span className="tracking-[0.04em] uppercase">{s.gloss}</span> · {formatTime(s.at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSpeak(s.text)}
                disabled={!speechSupported || speaking}
                aria-label={`Speak "${s.text}"`}
                title="Speak"
                className="press inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-forest-400 hover:bg-sun-100 focus-visible:outline-gold disabled:opacity-40"
              >
                <Volume2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
