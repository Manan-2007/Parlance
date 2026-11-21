/**
 * Fingerspelling: read words spelled at speed, and practise spelling your own
 * name. Letters are Remy's approximate forms (there are no ISLRTC letter
 * recordings in Parlance); a letter can be checked with the camera when
 * someone has recorded it in Teach.
 */
import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, Check, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import type { PlayerState } from "@/avatar/playback";
import { normalizeSpelling, spellingMatches, wordsForLevel } from "@/learn/fingerspell";
import { customKey } from "@/learn/recordings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { useLearn, type LearnSpeed } from "@/stores/learn";
import { findLetter, useTeach } from "@/stores/teach";
import { PracticePanel } from "./PracticePanel";
import { avatarLetterKey, statusOf } from "@/learn/reviews";
import { useReviewSummaries } from "./ReviewBadge";

const SpellingAvatar = lazy(() => import("./SpellingAvatar"));

type Mode = "read" | "spell";
const LEVEL_NAMES = ["Short words", "Up to five letters", "Any length"];

function Stage({ word, take, onState, label }: { word: string; take: number; onState?: (s: PlayerState) => void; label: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))] ring-1 ring-sky-200 sm:aspect-[16/11]">
      <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-sky-50" />}>
        <SpellingAvatar word={word} take={take} onState={onState} label={label} />
      </Suspense>
      <span className="absolute top-3 left-3 rounded-full bg-gold-100 px-2.5 py-1 text-[0.75rem] font-semibold text-gold-800">3D guide · approximate letters</span>
    </div>
  );
}

function SpeedControl() {
  const speed = useLearn((s) => s.speed);
  const setPreference = useLearn((s) => s.setPreference);
  return (
    <Segmented<LearnSpeed>
      label="Spelling speed"
      size="sm"
      value={speed}
      onChange={(v) => setPreference("speed", v)}
      options={[
        { value: 0.5, label: "Slow" },
        { value: 0.75, label: "Medium" },
        { value: 1, label: "Full" },
      ]}
    />
  );
}

function ReadMode() {
  const [level, setLevel] = useState(0);
  const [seed] = useState(() => Date.now());
  const words = useMemo(() => wordsForLevel(level, `${seed}-${level}`), [level, seed]);
  const [wordIndex, setWordIndex] = useState(0);
  const [take, setTake] = useState(0);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<null | "right" | "wrong" | "shown">(null);
  const [streak, setStreak] = useState(0);
  const word = words[wordIndex % words.length]!;

  const next = () => {
    setWordIndex((i) => i + 1);
    setGuess("");
    setResult(null);
    setTake((t) => t + 1);
  };
  const check = () => {
    if (!normalizeSpelling(guess)) return;
    if (spellingMatches(guess, word)) {
      setResult("right");
      const nextStreak = streak + 1;
      if (nextStreak >= 3 && level < 2) {
        setLevel((l) => l + 1);
        setWordIndex(0);
        setStreak(0);
      } else setStreak(nextStreak);
    } else {
      setResult("wrong");
      setStreak(0);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <div>
        <Stage word={word} take={take} label="The avatar fingerspelling a word to read" />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setTake((t) => t + 1)} leading={<RotateCcw aria-hidden />}>
            Spell it again
          </Button>
          <SpeedControl />
        </div>
      </div>
      <div>
        <p className="eyebrow text-royal!">
          Read · {LEVEL_NAMES[level]} · streak {streak}
        </p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-navy sm:text-[2.5rem]">What word was spelled?</h1>
        <p className="mt-2 text-[0.9375rem] leading-6 text-ink-2">Names and places are spelled when there is no sign. Read the whole word, not letter by letter.</p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (result === "right" || result === "shown") next();
            else check();
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Your answer</span>
            <input
              value={guess}
              onChange={(e) => {
                setGuess(e.target.value.slice(0, 20));
                if (result === "wrong") setResult(null);
              }}
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="Type the word"
              disabled={result === "right" || result === "shown"}
              className="h-12 w-full rounded-md border border-line-strong bg-surface px-3 text-lg font-semibold tracking-[0.12em] uppercase outline-none focus:border-royal"
            />
          </label>
          {result === "right" || result === "shown" ? (
            <Button type="submit" size="lg" trailing={<ArrowRight aria-hidden />}>
              Next
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={!normalizeSpelling(guess)}>
              Check
            </Button>
          )}
        </form>
        <div className="mt-3 min-h-12" role="status" aria-live="polite">
          {result === "right" && (
            <p className="inline-flex items-center gap-2 font-semibold text-success">
              <Check className="size-4" aria-hidden /> {word}. Correct.
            </p>
          )}
          {result === "wrong" && (
            <p className="text-[0.9375rem] text-ink-2">
              Not quite. Watch it again, or{" "}
              <button type="button" className="font-medium text-royal underline" onClick={() => setResult("shown")}>
                show the word
              </button>
              .
            </p>
          )}
          {result === "shown" && (
            <p className="text-[0.9375rem] text-ink-2">
              It was <strong className="tracking-[0.1em] text-navy">{word}</strong>. Replay it now that you know.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SpellMode() {
  const teach = useTeach();
  const summaries = useReviewSummaries();
  const [text, setText] = useState("");
  const [word, setWord] = useState("");
  const [take, setTake] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const letters = [...word];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <div>
        {word ? (
          <>
            <Stage word={word} take={take} label={`The avatar fingerspelling ${word}`} onState={(s) => setActive(s.finished ? null : s.index)} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setTake((t) => t + 1)} leading={<RotateCcw aria-hidden />}>
                Again
              </Button>
              <SpeedControl />
            </div>
          </>
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-sky-50 p-6 text-center text-ink-3 ring-1 ring-sky-200 sm:aspect-[16/11]">
            Type your name and press Show me.
          </div>
        )}
      </div>
      <div>
        <p className="eyebrow text-royal!">Spell</p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-navy sm:text-[2.5rem]">Spell your name</h1>
        <p className="mt-2 text-[0.9375rem] leading-6 text-ink-2">It's often the first thing you'll fingerspell to someone new. Copy it slowly, then at full speed.</p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const value = normalizeSpelling(text).slice(0, 14);
            if (!value) return;
            setWord(value);
            setTake((t) => t + 1);
            setChecking(null);
          }}
        >
          <label className="flex-1">
            <span className="sr-only">Name or word</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 20))}
              placeholder="Your name"
              autoComplete="given-name"
              className="h-12 w-full rounded-md border border-line-strong bg-surface px-3 text-lg font-semibold tracking-[0.08em] uppercase outline-none focus:border-royal"
            />
          </label>
          <Button type="submit" size="lg" disabled={!normalizeSpelling(text)} leading={<Eye aria-hidden />}>
            Show me
          </Button>
        </form>
        {letters.length > 0 && (
          <>
            <ol className="mt-6 flex flex-wrap gap-2" aria-label="Letters">
              {letters.map((letter, i) => {
                const recorded = findLetter(letter, teach);
                return (
                  <li key={`${letter}-${i}`}>
                    <button
                      type="button"
                      disabled={!recorded}
                      onClick={() => recorded && setChecking(customKey(recorded.id))}
                      title={recorded ? `Check ${letter} with the camera` : `No recorded reference for ${letter} yet`}
                      className={cn(
                        "relative inline-flex size-12 items-center justify-center rounded-xl text-xl font-semibold transition-colors",
                        active === i ? "bg-navy text-white" : "bg-surface text-navy ring-1 ring-line-strong",
                        recorded && "hover:ring-royal",
                      )}
                    >
                      {letter}
                      {recorded && <Camera className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-gold p-0.5 text-navy" aria-label="can be checked" />}
                      {(() => {
                        const status = statusOf(summaries.get(avatarLetterKey(letter)));
                        if (status === "unchecked") return null;
                        return (
                          <span
                            className={cn("absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rounded-full", status === "checked" ? "bg-success" : status === "flagged" ? "bg-danger" : "bg-royal")}
                            aria-label={status === "checked" ? "checked by a signer" : status === "flagged" ? "flagged by a signer" : "regional variant"}
                          />
                        );
                      })()}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-xs leading-5 text-ink-3">
              Letters marked with a camera have a recorded reference from Teach and can be checked. A green dot means a reviewer marked the avatar's letter correct (identity and fluency are self-reported);
              red means they flagged it.{" "}
              <Link to="/app/learn/teach/record" className="font-medium text-royal hover:underline">
                Record letters
              </Link>
            </p>
          </>
        )}
      </div>
      {checking && (
        <section className="lg:col-span-2" aria-label="Check a letter">
          <PracticePanel gloss={checking} />
        </section>
      )}
    </div>
  );
}

export function FingerspellingPage() {
  useDocumentTitle("Fingerspelling");
  const [mode, setMode] = useState<Mode>("read");
  return (
    <div className="container-page max-w-6xl py-8 sm:py-12">
      <Link to="/app/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Learn
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[2.75rem]">Fingerspelling</h1>
          <p className="mt-2 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">Read names spelled at speed, and spell your own.</p>
        </div>
        <Segmented<Mode>
          label="Practice"
          value={mode}
          onChange={setMode}
          options={[
            { value: "read", label: "Read" },
            { value: "spell", label: "Spell my name" },
          ]}
        />
      </div>
      <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-gold-50 px-4 py-3 text-sm leading-6 text-ink-2 ring-1 ring-gold-300">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold-800" aria-hidden />
        <span>
          Parlance has no ISLRTC recordings of the alphabet yet, so letters are shown by the 3D guide and are approximate. Use this for reading speed and
          practice, and check letter shapes with a fluent signer. A teacher can{" "}
          <Link to="/app/learn/teach/record" className="font-medium text-royal underline">
            record the alphabet
          </Link>{" "}
          so learners can be checked against it.
        </span>
      </p>
      <div className="mt-8">{mode === "read" ? <ReadMode /> : <SpellMode />}</div>
    </div>
  );
}
