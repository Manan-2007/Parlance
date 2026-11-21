import { useCallback, useEffect, useRef, useState } from "react";
import { GraduationCap } from "lucide-react";
import { SignHands } from "@/components/brand/SignHands";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ALPHABET, TIPS } from "@/lib/fingerspell";
import { cn } from "@/lib/cn";
import { WorkspaceHeader } from "../shared/WorkspaceHeader";
import "./learn.css";

const TONES = [
  { bg: "var(--color-royal)", fg: "#fffaf2", sleeve: "var(--color-gold)" },
  { bg: "var(--color-gold)", fg: "var(--color-navy)", sleeve: "var(--color-royal)" },
  { bg: "var(--color-tomato-400)", fg: "#fffaf2", sleeve: "var(--color-navy)" },
  { bg: "var(--color-sky-200)", fg: "var(--color-navy)", sleeve: "var(--color-tomato-400)" },
];

/* letters told apart only by their movement are left out of the quiz */
const POOL = ALPHABET.filter((l) => !["J", "Z", "R"].includes(l));
const CHEERS = ["nice!", "yes!", "sharp!", "ooh!", "smooth."];

function shuffle<T>(items: T[]) {
  return items
    .map((v) => [Math.random(), v] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

function readBest() {
  try {
    return Number(localStorage.getItem("parlance-learn-best") || 0);
  } catch {
    return 0;
  }
}

export function AlphabetPage() {
  useDocumentTitle("Learn the ISL alphabet");
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  return (
    <div className="container-app max-w-6xl py-10 sm:py-14">
      <WorkspaceHeader
        title="The ISL alphabet"
        description="In Indian Sign Language most letters use both hands: one holds still, the other points or touches. Tap a card to flip it for a tip, then test yourself below."
        icon={<GraduationCap />}
        tone="sun"
        meta="26 letters · two-handed"
        illustration={<SignHands letter="A" size="15rem" sleeve="var(--color-tomato-400)" />}
      />

      <ul className="learn-deck mt-10" role="list">
        {ALPHABET.map((l, i) => {
          const t = TONES[i % TONES.length]!;
          const on = !!flipped[l];
          return (
            <li key={l}>
              <button
                type="button"
                className="learn-flip"
                aria-pressed={on}
                aria-label={`Letter ${l}. ${TIPS[l]}`}
                style={{ "--bg": t.bg, "--fg": t.fg } as React.CSSProperties}
                onClick={() => setFlipped((f) => ({ ...f, [l]: !f[l] }))}
              >
                <span className="learn-flip__inner">
                  <span className="learn-flip__face learn-flip__front">
                    <span className="learn-flip__corner">{l}</span>
                    <SignHands letter={l} size="96%" sleeve={t.sleeve} />
                    <span className="learn-flip__corner learn-flip__corner--b">{l}</span>
                  </span>
                  <span className="learn-flip__face learn-flip__back">
                    <span className="learn-flip__big">{l}</span>
                    <span className="learn-flip__tip">{TIPS[l]}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-sm text-ink-3">
        These are illustrations of the two-handed ISL manual alphabet, drawn from the front. Check them with a Deaf ISL
        signer before teaching from them.
      </p>

      <Quiz />
    </div>
  );
}

function Quiz() {
  const hands = useRef<SVGSVGElement>(null);
  const [answer, setAnswer] = useState(() => POOL[Math.floor(Math.random() * POOL.length)]!);
  const [choices, setChoices] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(readBest);
  const [total, setTotal] = useState(0);
  const [cheer, setCheer] = useState({ text: "", n: 0 });
  const timer = useRef<number | undefined>(undefined);

  const round = useCallback((prev?: string) => {
    let next = POOL[Math.floor(Math.random() * POOL.length)]!;
    while (next === prev) next = POOL[Math.floor(Math.random() * POOL.length)]!;
    setAnswer(next);
    setChoices(shuffle([next, ...shuffle(POOL.filter((l) => l !== next)).slice(0, 3)]));
    setPicked(null);
  }, []);

  useEffect(() => {
    round();
    return () => window.clearTimeout(timer.current);
  }, [round]);

  const right = picked === answer;

  const pick = (c: string) => {
    if (picked) return;
    setPicked(c);
    setTotal((t) => t + 1);
    if (c === answer) {
      const s = streak + 1;
      setStreak(s);
      if (s > best) {
        setBest(s);
        try {
          localStorage.setItem("parlance-learn-best", String(s));
        } catch {
          /* private mode */
        }
      }
      setCheer((x) => ({ text: CHEERS[Math.floor(Math.random() * CHEERS.length)]!, n: x.n + 1 }));
    } else {
      setStreak(0);
    }
    timer.current = window.setTimeout(() => round(answer), 1300);
  };

  return (
    <section id="quiz" className="learn-quiz mt-16" aria-labelledby="quiz-title">
      <div className="learn-quiz__copy">
        <p className="font-mono text-[0.78rem] tracking-[0.14em] text-ink-2 uppercase">Quick quiz</p>
        <h2 id="quiz-title" className="text-section">
          Which letter <em>is this?</em>
        </h2>
        <p className="text-[1.0625rem] leading-7 text-ink-2">Read the hands, pick the letter.</p>
        <dl className="learn-quiz__score">
          <div>
            <dt>streak</dt>
            <dd>{streak}</dd>
          </div>
          <div>
            <dt>best</dt>
            <dd>{best}</dd>
          </div>
          <div>
            <dt>answered</dt>
            <dd>{total}</dd>
          </div>
        </dl>
      </div>
      <div className="learn-quiz__play">
        <div className={cn("learn-quiz__stage", picked && (right ? "is-right" : "is-wrong"))}>
          <SignHands ref={hands} letter={answer} size="88%" sleeve="var(--color-tomato-400)" />
          {cheer.n > 0 && (
            <span key={cheer.n} className="learn-quiz__burst" aria-hidden>
              {cheer.text}
            </span>
          )}
        </div>
        <div className="learn-quiz__opts" role="group" aria-label="Answer choices">
          {choices.map((c) => (
            <button
              key={c}
              type="button"
              disabled={!!picked}
              onClick={() => pick(c)}
              className={cn(picked && c === answer && "is-right", picked === c && c !== answer && "is-wrong")}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="learn-quiz__feedback" aria-live="polite">
          {picked ? (right ? `Yes — that’s ${answer}.` : `Close! That one’s ${answer}.`) : ""}
        </p>
      </div>
    </section>
  );
}
