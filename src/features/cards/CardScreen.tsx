/**
 * One card, full screen, for the person across the counter: huge English,
 * Hindi below, read aloud on request, and flippable so someone facing you
 * reads it the right way up. Their reply comes back to you as big text, and
 * can be signed by the 3D signer.
 */
import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Hand, Keyboard, Mic, RotateCw, Send, Square, Volume2, X } from "lucide-react";
import { SigningLoader } from "@/components/ui/SigningLoader";
import { cn } from "@/lib/cn";
import { SPEECH_ERROR_MESSAGES, useSpeechInput } from "@/services/speech/useSpeechInput";
import { useSpeechOutput } from "@/services/speech/useSpeechOutput";
import { useSettings } from "@/stores/settings";
import type { Line } from "./cardData";

const SignReply = lazy(() => import("./SignReply"));

export interface ShownCard extends Line {
  /** Text the user filled in, or details from "About me", shown under the card. */
  detail?: string;
  /** Extra lines (medical details) shown as a list. */
  list?: { label: string; value: string }[];
}

interface CardScreenProps {
  card: ShownCard | null;
  placeTitle: string;
  replies: Line[];
  tone?: "sun" | "danger";
  onClose: () => void;
}

type Reply = { text: string; hi?: string };

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let live = true;
    const request = () => {
      void navigator.wakeLock.request("screen").then((sentinel) => {
        if (live) lock = sentinel;
        else void sentinel.release();
      }).catch(() => {});
    };
    request();
    const onVisible = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}

export function CardScreen({ card, placeTitle, replies, tone = "sun", onClose }: CardScreenProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const inputId = useId();
  const [flipped, setFlipped] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [signing, setSigning] = useState(false);
  const speech = useSpeechOutput();
  const language = useSettings((s) => s.speechLanguage);
  const open = card !== null;

  const onHeard = useCallback((text: string) => {
    setReply({ text });
    setSigning(false);
  }, []);
  const listen = useSpeechInput(language, onHeard);
  const listening = listen.status === "listening" || listen.status === "starting";

  useWakeLock(open);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) {
      setFlipped(false);
      setReply(null);
      setTyping(false);
      setTyped("");
      setSigning(false);
    }
  }, [open, card]);

  const close = () => {
    speech.cancel();
    listen.cancel();
    onClose();
  };

  const say = () => {
    if (!card) return;
    speech.speak([card.en, card.detail].filter(Boolean).join(" "));
  };

  const submitTyped = (event: FormEvent) => {
    event.preventDefault();
    const text = typed.trim();
    if (!text) return;
    setReply({ text });
    setTyped("");
    setTyping(false);
  };

  const danger = tone === "danger";

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        if (reply) setReply(null);
        else close();
      }}
      className={cn(
        "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 p-0 backdrop:bg-navy/60",
        danger ? "bg-danger text-white" : "bg-sun-400 text-navy",
      )}
    >
      {card && (
        <div className="flex h-full flex-col pt-[env(safe-area-inset-top)]">
          {/* top bar: for the card's owner */}
          <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-5">
            <button
              type="button"
              onClick={reply ? () => setReply(null) : close}
              className={cn(
                "press inline-flex h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-bold",
                danger ? "bg-white/15 text-white hover:bg-white/25" : "bg-surface/70 text-navy hover:bg-surface",
              )}
            >
              {reply ? <ArrowLeft className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
              {reply ? "Back to my card" : "Close"}
            </button>
            <p className={cn("hidden truncate text-sm font-bold sm:block", danger ? "text-white/80" : "text-navy/70")}>{placeTitle}</p>
            {!reply && (
              <div className="flex items-center gap-1.5">
                {speech.supported && (
                  <button
                    type="button"
                    onClick={speech.speaking ? speech.cancel : say}
                    className={cn(
                      "press inline-flex h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-bold",
                      danger ? "bg-white text-danger hover:bg-white/90" : "bg-navy text-white hover:bg-cobalt-500",
                    )}
                  >
                    {speech.speaking ? <Square className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
                    {speech.speaking ? "Stop" : "Read aloud"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFlipped((f) => !f)}
                  aria-pressed={flipped}
                  title="Turn the card upside down for someone facing you"
                  className={cn(
                    "press inline-flex h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-bold",
                    danger ? "bg-white/15 text-white hover:bg-white/25" : "bg-surface/70 text-navy hover:bg-surface",
                  )}
                >
                  <RotateCw className="size-4" aria-hidden />
                  <span className="sr-only sm:not-sr-only">Turn for them</span>
                </button>
              </div>
            )}
          </div>

          {/* the message */}
          {!reply ? (
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 pb-6 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-12",
                flipped && "rotate-180",
              )}
            >
              <h2 id={titleId} className={cn("max-w-5xl text-[clamp(2.25rem,7.5vw,5.25rem)] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance", danger ? "text-white" : "text-navy")}>
                {card.en}
              </h2>
              {card.detail && (
                <p className={cn("mt-4 max-w-5xl rounded-[1.5rem] px-5 py-3 text-[clamp(1.75rem,5.5vw,3.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em]", danger ? "bg-white/15" : "bg-surface/70")}>
                  {card.detail}
                </p>
              )}
              {card.list && card.list.length > 0 && (
                <dl className={cn("mt-4 grid max-w-5xl gap-x-6 gap-y-2 rounded-[1.5rem] px-5 py-4 text-[clamp(1.125rem,2.6vw,1.75rem)] leading-snug sm:grid-cols-[auto_1fr]", danger ? "bg-white/15" : "bg-surface/70")}>
                  {card.list.map((item) => (
                    <div key={item.label} className="contents">
                      <dt className="font-bold opacity-75">{item.label}</dt>
                      <dd className="font-extrabold">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p lang="hi" className={cn("mt-6 max-w-5xl text-[clamp(1.375rem,3.8vw,2.625rem)] leading-[1.25] font-bold", danger ? "text-white/90" : "text-navy/80")}>
                {card.hi}
              </p>
            </div>
          ) : (
            <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 sm:px-12", !signing && "justify-center")} aria-live="polite">
              <p className={cn("text-base font-bold", danger ? "text-white/80" : "text-navy/70")}>They replied</p>
              <p className="mt-3 max-w-5xl text-[clamp(2rem,7vw,4.75rem)] leading-[1.04] font-extrabold tracking-[-0.04em] text-balance">{reply.text}</p>
              {reply.hi && (
                <p lang="hi" className="mt-3 max-w-5xl text-[clamp(1.25rem,3.4vw,2.25rem)] leading-[1.25] font-bold opacity-80">
                  {reply.hi}
                </p>
              )}
              {!signing ? (
                <button
                  type="button"
                  onClick={() => setSigning(true)}
                  className={cn(
                    "press mt-6 inline-flex h-12 w-fit items-center gap-2 rounded-full px-5 text-base font-bold",
                    danger ? "bg-white text-danger hover:bg-white/90" : "bg-navy text-white hover:bg-cobalt-500",
                  )}
                >
                  <Hand className="size-5" aria-hidden /> See it in sign
                </button>
              ) : (
                <div className="mt-5 min-h-[22rem] flex-1">
                  <Suspense fallback={<div className="grid h-full place-items-center"><SigningLoader label="Loading the signer" /></div>}>
                    <SignReply text={reply.text} />
                  </Suspense>
                </div>
              )}
            </div>
          )}

          {/* their reply: for the person reading the card */}
          {!reply && (
            <section
              aria-label="Their reply"
              className="rounded-t-[2rem] bg-surface px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-navy shadow-[0_-8px_24px_rgb(35_48_89/0.12)] sm:px-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-extrabold">
                  Reading this? Reply here <span className="font-bold text-ink-3">· जवाब यहाँ दें</span>
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTyping((t) => !t)}
                    aria-expanded={typing}
                    className="press inline-flex h-10 items-center gap-1.5 rounded-full bg-paper-2 px-3.5 text-[0.8125rem] font-bold hover:bg-sun-100"
                  >
                    <Keyboard className="size-4" aria-hidden /> Type
                  </button>
                  {listen.supported && (
                    <button
                      type="button"
                      onClick={listening ? listen.stop : listen.start}
                      className={cn(
                        "press inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-bold",
                        listening ? "bg-tangerine-400 text-navy" : "bg-paper-2 hover:bg-sun-100",
                      )}
                    >
                      {listening ? <Square className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />}
                      {listening ? "Done" : "Speak"}
                    </button>
                  )}
                </div>
              </div>
              {listening && (
                <p className="mt-2 text-sm text-ink-2" role="status">
                  Listening… {listen.interim && <span className="font-semibold text-navy">{listen.interim}</span>}
                </p>
              )}
              {listen.error && <p className="mt-2 text-sm text-danger" role="alert">{SPEECH_ERROR_MESSAGES[listen.error]}</p>}
              {typing && (
                <form onSubmit={submitTyped} className="mt-3 flex gap-2">
                  <label htmlFor={inputId} className="sr-only">Type your reply</label>
                  <input
                    id={inputId}
                    autoFocus
                    value={typed}
                    maxLength={200}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder="Type your reply · अपना जवाब लिखें"
                    className="h-12 min-w-0 flex-1 rounded-full border border-line-strong bg-paper-50 px-4 text-base text-ink placeholder:text-ink-3"
                  />
                  <button type="submit" aria-label="Show reply" className="press inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-navy text-white hover:bg-cobalt-500">
                    <Send className="size-5" aria-hidden />
                  </button>
                </form>
              )}
              <ul className="mt-3 flex max-h-[28vh] flex-wrap gap-2 overflow-y-auto" aria-label="Quick replies">
                {replies.map((line) => (
                  <li key={line.en}>
                    <button
                      type="button"
                      onClick={() => setReply({ text: line.en, hi: line.hi })}
                      className="press inline-flex min-h-11 flex-col items-start rounded-[1.125rem] bg-paper px-3.5 py-1.5 text-left ring-1 ring-line hover:bg-sun-100 hover:ring-sun-400"
                    >
                      <span className="text-[0.9375rem] leading-5 font-bold">{line.en}</span>
                      <span lang="hi" className="text-xs leading-4 text-ink-3">{line.hi}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </dialog>
  );
}
