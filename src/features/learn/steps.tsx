/**
 * The lesson player's exercises. Each step reports whether the learner got it
 * right first time (or null when it isn't a question) through `onNext`.
 */
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, CornerDownLeft, Info, Lightbulb, MessageCircle, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GRAMMAR_RULES, type GrammarRule } from "@/learn/curriculum";
import { gradeFromScore } from "@/learn/srs";
import { cn } from "@/lib/cn";
import { useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { readableSignLabel } from "@/translation/islVocabulary.js";
import { PracticePanel } from "./PracticePanel";
import { ReferencePlayer } from "./ReferencePlayer";
import { SignViewer } from "./SignViewer";
import { capitalise, englishOf, glossTextOf } from "./signData";

const RemyGuide = lazy(() => import("./RemyGuide"));

export type StepResult = boolean | null;

function StepHeading({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div>
      <p className="eyebrow text-royal!">{eyebrow}</p>
      <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-navy sm:text-[2.5rem]">{title}</h1>
      {children && <div className="mt-2 max-w-xl text-[1.0625rem] leading-7 text-ink-2">{children}</div>}
    </div>
  );
}

function ContinueBar({ onClick, label = "Continue", tone = "neutral", message }: { onClick: () => void; label?: string; tone?: "neutral" | "right" | "wrong"; message?: ReactNode }) {
  return (
    <div
      className={cn(
        "sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 md:bottom-4",
        tone === "right" ? "bg-success-bg" : tone === "wrong" ? "bg-gold-50" : "bg-surface shadow-[var(--shadow-md)] ring-1 ring-line",
      )}
      role={tone === "neutral" ? undefined : "status"}
    >
      <div className="min-w-0 text-[0.9375rem] leading-6">{message}</div>
      <Button onClick={onClick} trailing={<ArrowRight aria-hidden />} className="ml-auto" autoFocus={tone !== "neutral"}>
        {label}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ intro -- */

export function IntroStep({ title, context, signs, onNext }: { title: string; context: string; signs: string[]; onNext: () => void }) {
  const library = useSignLibrary();
  return (
    <div className="max-w-2xl">
      <StepHeading eyebrow="Lesson" title={title}>
        {context}
      </StepHeading>
      {signs.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow">You will learn</p>
          <p className="mt-2 flex flex-wrap gap-2">
            {signs.map((gloss) => (
              <span key={gloss} className="rounded-full bg-sky-50 px-3 py-1.5 text-[0.8125rem] font-semibold tracking-[0.04em] text-navy uppercase ring-1 ring-sky-200">
                {englishOf(gloss, library)}
              </span>
            ))}
          </p>
        </div>
      )}
      <ul className="mt-8 space-y-3 text-[0.9375rem] leading-6 text-ink-2">
        <li className="flex gap-3">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-gold-800" aria-hidden />
          Copy each sign with your own hands as you watch. Making a sign helps you remember it far better than only watching.
        </li>
        <li className="flex gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden />
          Signs come from the ISLRTC dictionary, recorded by an official signer. Camera practice is optional and stays on this device.
        </li>
      </ul>
      <ContinueBar onClick={onNext} label="Start" />
    </div>
  );
}

/* ------------------------------------------------------------------ watch -- */

export function WatchStep({ gloss, onNext }: { gloss: string; onNext: () => void }) {
  const library = useSignLibrary();
  const introduce = useLearn((s) => s.introduce);
  useEffect(() => introduce([gloss]), [gloss, introduce]);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <SignViewer gloss={gloss} />
      <div>
        <StepHeading eyebrow="New sign" title={capitalise(englishOf(gloss, library))}>
          Watch it two or three times, slowed down, then sign along with the figure.
        </StepHeading>
        <p className="mt-4 text-[0.8125rem] font-semibold tracking-[0.06em] text-ink-3 uppercase">Gloss: {glossTextOf(gloss, library)}</p>
        <ContinueBar onClick={onNext} label="Got it" />
      </div>
    </div>
  );
}

export function WatchAvatarStep({ token, onNext }: { token: string; onNext: () => void }) {
  const spelled = /^[A-Z0-9](-[A-Z0-9])+$/.test(token);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <Suspense fallback={<div className="aspect-[4/3] animate-pulse rounded-2xl bg-sky-50" />}>
        <RemyGuide token={token} />
      </Suspense>
      <div>
        <StepHeading eyebrow={spelled ? "Fingerspelling" : "3D guide only"} title={readableSignLabel(token)}>
          {spelled
            ? "Names and numbers without a sign are spelled letter by letter."
            : "There is no ISLRTC recording for this word in Parlance yet, so only the approximate 3D guide is shown. Check a dictionary or a fluent signer before relying on it."}
        </StepHeading>
        <ContinueBar onClick={onNext} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- choices -- */

interface ChoiceStepProps {
  eyebrow: string;
  question: string;
  /** The recording(s) to watch. */
  glosses: string[];
  options: { key: string; label: string }[];
  answer: string;
  /** Shown once answered. */
  reveal?: ReactNode;
  onAnswered?: (correct: boolean) => void;
  onNext: (result: StepResult) => void;
}

export function ChoiceStep({ eyebrow, question, glosses, options, answer, reveal, onAnswered, onNext }: ChoiceStepProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const [firstTry, setFirstTry] = useState<boolean | null>(null);
  const done = picked === answer;
  const choose = (key: string) => {
    if (done) return;
    setPicked(key);
    if (firstTry === null) {
      const correct = key === answer;
      setFirstTry(correct);
      onAnswered?.(correct);
    }
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <ReferencePlayer glosses={glosses} loop={glosses.length === 1} label="A sign to recognise" />
      <div>
        <StepHeading eyebrow={eyebrow} title={question} />
        <ul className="mt-6 grid gap-2.5" aria-label="Choices">
          {options.map((option) => {
            const isPicked = picked === option.key;
            const right = isPicked && option.key === answer;
            const wrong = isPicked && option.key !== answer;
            return (
              <li key={option.key}>
                <button
                  type="button"
                  onClick={() => choose(option.key)}
                  aria-pressed={isPicked}
                  disabled={done && !right}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 text-left text-[1.0625rem] font-medium transition-colors",
                    right
                      ? "border-success bg-success-bg text-success"
                      : wrong
                        ? "border-gold bg-gold-50 text-gold-800"
                        : "border-line-strong bg-surface text-navy hover:border-royal hover:bg-brand-25 disabled:opacity-50",
                  )}
                >
                  {option.label}
                  {right && <Check className="size-5" aria-hidden />}
                  {wrong && <X className="size-5" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
        {picked && !done && <p className="mt-3 text-[0.9375rem] text-ink-2" role="status">Not quite. Watch it again and pick another.</p>}
        {done && (
          <ContinueBar
            onClick={() => onNext(firstTry)}
            tone={firstTry ? "right" : "wrong"}
            message={
              <span className="flex flex-col">
                <span className="font-semibold text-navy">{firstTry ? "Correct." : "Got there."}</span>
                {reveal}
              </span>
            }
          />
        )}
      </div>
    </div>
  );
}

export function RecognizeStep({ gloss, options, onNext }: { gloss: string; options: string[]; onNext: (r: StepResult) => void }) {
  const library = useSignLibrary();
  const grade = useLearn((s) => s.grade);
  return (
    <ChoiceStep
      key={gloss}
      eyebrow="Recognise"
      question="What does this sign mean?"
      glosses={[gloss]}
      options={options.map((key) => ({ key, label: capitalise(englishOf(key, library)) }))}
      answer={gloss}
      onAnswered={(correct) => grade(gloss, correct ? "good" : "again")}
      onNext={onNext}
    />
  );
}

/* ------------------------------------------------------------------ order -- */

function RuleNotes({ rules }: { rules: readonly GrammarRule[] }) {
  if (!rules.length) return null;
  return (
    <ul className="mt-4 space-y-2.5">
      {rules.map((rule) => (
        <li key={rule} className="rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-200">
          <p className="text-[0.9375rem] font-semibold text-navy">{GRAMMAR_RULES[rule].title}</p>
          <p className="mt-0.5 text-sm leading-6 text-ink-2">{GRAMMAR_RULES[rule].body}</p>
        </li>
      ))}
    </ul>
  );
}

interface OrderStepProps {
  eyebrow: string;
  prompt: string;
  literal?: string;
  answer: string[];
  tiles: string[];
  rules: GrammarRule[];
  onNext: (result: StepResult) => void;
}

export function OrderStep({ eyebrow, prompt, literal, answer, tiles, rules, onNext }: OrderStepProps) {
  const library = useSignLibrary();
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const label = (key: string) => glossTextOf(key, library);
  const built = chosen.map((i) => tiles[i]!);
  const playable = useMemo(() => answer.filter((key) => library.available.has(key)), [answer, library.available]);
  const check = () => setChecked(built.length === answer.length && built.every((key, i) => key === answer[i]));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <div>
        <StepHeading eyebrow={eyebrow} title={`“${prompt}”`}>
          Tap the signs in ISL order.{tiles.length > answer.length ? " One of them doesn't belong." : ""}
        </StepHeading>
        <div
          className={cn(
            "mt-6 flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3",
            checked === null ? "border-line-strong" : checked ? "border-success bg-success-bg/50" : "border-gold bg-gold-50/60",
          )}
          aria-label="Your sentence"
          aria-live="polite"
        >
          {built.length === 0 && <span className="px-1 text-[0.9375rem] text-ink-3">Your ISL sentence appears here</span>}
          {chosen.map((tileIndex, position) => (
            <button
              key={`${tileIndex}-${position}`}
              type="button"
              disabled={checked !== null}
              onClick={() => setChosen((prev) => prev.filter((_, i) => i !== position))}
              className="h-11 rounded-lg bg-navy px-3.5 text-[0.875rem] font-semibold tracking-[0.05em] text-white"
              aria-label={`Remove ${label(tiles[tileIndex]!)}`}
            >
              {label(tiles[tileIndex]!)}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Signs to choose from">
          {tiles.map((key, index) => (
            <button
              key={`${key}-${index}`}
              type="button"
              disabled={chosen.includes(index) || checked !== null}
              onClick={() => setChosen((prev) => [...prev, index])}
              className="h-11 rounded-lg border border-line-strong bg-surface px-3.5 text-[0.875rem] font-semibold tracking-[0.05em] text-navy transition-colors hover:border-royal disabled:opacity-30"
            >
              {label(key)}
            </button>
          ))}
        </div>
        {checked === null ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={check} disabled={built.length === 0} leading={<CornerDownLeft aria-hidden />}>
              Check
            </Button>
            <Button variant="ghost" onClick={() => setChosen([])} disabled={built.length === 0} leading={<Undo2 aria-hidden />}>
              Clear
            </Button>
          </div>
        ) : (
          <>
            {!checked && (
              <p className="mt-4 text-[0.9375rem] text-ink-2">
                ISL order: <strong className="font-semibold tracking-[0.04em] text-navy">{answer.map(label).join(" · ")}</strong>
              </p>
            )}
            {literal && <p className="mt-2 text-sm text-ink-3">Word for word: “{literal}”</p>}
            <RuleNotes rules={rules} />
            <ContinueBar
              onClick={() => onNext(checked)}
              tone={checked ? "right" : "wrong"}
              message={<span className="font-semibold text-navy">{checked ? "That's the ISL order." : "Close. Compare with the ISL order."}</span>}
            />
          </>
        )}
      </div>
      {checked !== null && playable.length > 0 && (
        <ReferencePlayer glosses={playable} loop={false} label="The ISLRTC signer signing the sentence" caption={(gloss) => <span className="text-[0.9375rem] font-semibold tracking-[0.05em] text-navy uppercase">{englishOf(gloss, library)}</span>} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- sign -- */

export function SignStep({ gloss, onNext, onScore }: { gloss: string; onNext: () => void; onScore?: (score: number) => void }) {
  const library = useSignLibrary();
  const grade = useLearn((s) => s.grade);
  const [best, setBest] = useState<number | null>(null);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
      <PracticePanel
        gloss={gloss}
        onScored={(score) => {
          setBest((prev) => Math.max(prev ?? 0, score));
          grade(gloss, gradeFromScore(score), score);
          onScore?.(score);
        }}
      />
      <div>
        <StepHeading eyebrow="Sign it" title={capitalise(englishOf(gloss, library))}>
          Stand back so your head and shoulders are in view, press record, sign it once, then lower your hands.
        </StepHeading>
        <ContinueBar
          onClick={onNext}
          label={best === null ? "Skip for now" : "Continue"}
          message={best !== null ? <span className="text-ink-2">Best match: <strong className="text-navy tabular-nums">{best}</strong></span> : undefined}
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- dialogue -- */

export function ListenStep({ glosses, english, options, onNext }: { glosses: string[]; english: string; options: string[]; onNext: (r: StepResult) => void }) {
  const library = useSignLibrary();
  return (
    <ChoiceStep
      key={english}
      eyebrow="They sign"
      question="What did they say?"
      glosses={glosses}
      options={options.map((text) => ({ key: text, label: text }))}
      answer={english}
      reveal={<span className="text-sm tracking-[0.04em] text-ink-2 uppercase">{glosses.map((g) => englishOf(g, library)).join(" · ")}</span>}
      onNext={onNext}
    />
  );
}

export function DialogueBadge({ setting }: { setting: string }) {
  return (
    <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-gold-50 px-3 py-1.5 text-[0.8125rem] font-medium text-gold-800 ring-1 ring-gold-300">
      <MessageCircle className="size-4" aria-hidden /> {setting}
    </p>
  );
}
