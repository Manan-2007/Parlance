/**
 * Practise together: pass the screen between two people. One signs a word the
 * other can't see; the other reads it. Or a fluent signer watches and says
 * whether the sign was clear.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, RotateCcw, ThumbsDown, ThumbsUp, Users, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { UNITS, curriculumGlosses } from "@/learn/curriculum";
import { makeRounds, type Round, type TogetherMode } from "@/learn/together";
import { isCustomKey } from "@/learn/recordings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { findCustomSign, useTeach } from "@/stores/teach";
import { ReferencePlayer } from "./ReferencePlayer";
import { capitalise, englishOf } from "./signData";

type Stage = "handoff" | "sign" | "read" | "result";

interface Source {
  id: string;
  label: string;
  keys: string[];
}

export function TogetherPage() {
  useDocumentTitle("Practise together");
  const library = useSignLibrary();
  const cards = useLearn((s) => s.cards);
  const grade = useLearn((s) => s.grade);
  const decks = useTeach((s) => s.decks);
  const teach = useTeach();

  const sources = useMemo<Source[]>(() => {
    const seen = Object.keys(cards).filter((k) => !isCustomKey(k) || findCustomSign(k, teach));
    const list: Source[] = [];
    if (seen.length >= 4) list.push({ id: "seen", label: `Signs I've learned (${seen.length})`, keys: seen });
    for (const unit of UNITS) list.push({ id: unit.id, label: unit.title, keys: [...new Set(unit.lessons.flatMap((l) => l.signs))] });
    for (const deck of decks) if (deck.items.length >= 4) list.push({ id: `deck:${deck.id}`, label: `Deck: ${deck.title}`, keys: deck.items });
    return list;
  }, [cards, decks, teach]);

  const [mode, setMode] = useState<TogetherMode>("guess");
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [sourceId, setSourceId] = useState<string>("");
  const [length, setLength] = useState(6);
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<Stage>("handoff");
  const [picked, setPicked] = useState<string | null>(null);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [peeked, setPeeked] = useState(false);

  const source = sources.find((s) => s.id === sourceId) ?? sources[0];
  const english = (key: string) => englishOf(key, library);
  const player = (i: 0 | 1) => names[i].trim() || (mode === "check" ? (i === 0 ? "You" : "Your partner") : `Player ${i + 1}`);

  const start = () => {
    if (!source) return;
    setRounds(makeRounds(source.keys.length >= 4 ? source.keys : [...source.keys, ...curriculumGlosses()], length, mode, Date.now(), english));
    setIndex(0);
    setStage("handoff");
    setScores([0, 0]);
    setPicked(null);
    setPeeked(false);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setStage("handoff");
    setPicked(null);
    setPeeked(false);
    window.scrollTo({ top: 0 });
  };

  /* ------------------------------------------------------------- setup -- */
  if (!rounds) {
    return (
      <div className="container-page max-w-3xl py-8 sm:py-12">
        <Link to="/app/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
          <ArrowLeft className="size-4" aria-hidden /> Learn
        </Link>
        <p className="eyebrow mt-4 text-royal!">Two people, one screen</p>
        <h1 className="mt-3 text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[3rem]">Practise together</h1>
        <p className="mt-3 text-[1.0625rem] leading-7 text-ink-2">
          Signing for a real person, and reading a real person's signing, is what a conversation takes. Take turns: one of you signs a word the other can't
          see, the other works out what it was.
        </p>

        <div className="mt-8 space-y-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div>
            <p className="text-[0.9375rem] font-semibold text-ink">Who's playing?</p>
            <Segmented<TogetherMode>
              label="Who's playing"
              value={mode}
              onChange={setMode}
              block
              className="mt-2"
              options={[
                { value: "guess", label: "Two learners" },
                { value: "check", label: "With a fluent signer" },
              ]}
            />
            <p className="mt-2 text-sm leading-6 text-ink-3">
              {mode === "guess"
                ? "You take turns signing and guessing. Both of you practise reading signs as well as making them."
                : "You sign; a Deaf friend or fluent signer watches and says whether it was clear. Their answer updates your review schedule."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <label key={i} className="block">
                <span className="text-sm font-medium text-ink-2">{mode === "check" ? (i === 0 ? "Learner" : "Fluent signer") : `Player ${i + 1}`}</span>
                <input
                  value={names[i as 0 | 1]}
                  onChange={(e) => setNames((n) => (i === 0 ? [e.target.value.slice(0, 20), n[1]] : [n[0], e.target.value.slice(0, 20)]))}
                  placeholder="Name (optional)"
                  className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] outline-none focus:border-royal"
                />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="text-[0.9375rem] font-semibold text-ink">Signs to use</span>
            <select value={source?.id ?? ""} onChange={(e) => setSourceId(e.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem]">
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p className="text-[0.9375rem] font-semibold text-ink">Rounds</p>
            <Segmented<number>
              label="Rounds"
              value={length}
              onChange={setLength}
              className="mt-2"
              options={[
                { value: 6, label: "6" },
                { value: 10, label: "10" },
                { value: 16, label: "16" },
              ]}
            />
          </div>
          <Button onClick={start} size="lg" trailing={<ArrowRight aria-hidden />} disabled={!source}>
            Start
          </Button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- game -- */
  const round = rounds[index];
  if (!round) {
    const [a, b] = scores;
    return (
      <div className="container-page max-w-xl py-12 text-center">
        <Users className="mx-auto size-10 text-royal" aria-hidden />
        <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] text-navy">Well played</h1>
        {mode === "guess" ? (
          <p className="mt-2 text-[1.0625rem] text-ink-2">
            Signs read correctly: {player(0)} {a} · {player(1)} {b}. A point goes to the reader, and every point means a sign came across clearly.
          </p>
        ) : (
          <p className="mt-2 text-[1.0625rem] text-ink-2">
            {a} of {rounds.length} signs were clear to {player(1)}.
          </p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={start} leading={<RotateCcw aria-hidden />}>
            Play again
          </Button>
          <Button variant="secondary" onClick={() => setRounds(null)}>
            Change settings
          </Button>
        </div>
      </div>
    );
  }

  const signer = round.signer;
  const reader: 0 | 1 = mode === "check" ? 1 : signer === 0 ? 1 : 0;
  const meaning = capitalise(english(round.key));

  return (
    <div className="container-page max-w-5xl pt-4 pb-10 sm:pt-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setRounds(null)} aria-label="Stop the game" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-subtle hover:text-navy">
          <X className="size-5" aria-hidden />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-label="Rounds" aria-valuemin={0} aria-valuemax={rounds.length} aria-valuenow={index}>
          <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${(index / rounds.length) * 100}%` }} />
        </div>
        <span className="text-sm font-medium text-ink-3 tabular-nums">
          {index + 1}/{rounds.length}
        </span>
      </div>

      <div key={`${index}-${stage}`} className="mt-8 animate-fade">
        {stage === "handoff" && (
          <div className="mx-auto max-w-lg py-10 text-center">
            <p className="eyebrow">Round {index + 1}</p>
            <h1 className="mt-3 text-[2.25rem] leading-tight font-semibold tracking-[-0.04em] text-navy">Pass the screen to {player(signer)}</h1>
            <p className="mt-3 text-[1.0625rem] leading-7 text-ink-2">
              {player(reader)}, look away for a moment. {player(signer)} will see the word to sign.
            </p>
            <Button className="mt-8" size="lg" onClick={() => setStage("sign")} leading={<Eye aria-hidden />}>
              I'm {player(signer)}: show my word
            </Button>
          </div>
        )}

        {stage === "sign" && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="eyebrow text-royal!">{player(signer)}, sign this</p>
              <h1 className="mt-2 text-[3rem] leading-none font-semibold tracking-[-0.045em] text-navy sm:text-[4rem]">{meaning}</h1>
              <p className="mt-4 text-[1.0625rem] leading-7 text-ink-2">Hide the screen, then sign it to {player(reader)} once or twice. Keep your face expressive.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={() => setStage("read")} trailing={<ArrowRight aria-hidden />}>
                  I've signed it: pass to {player(reader)}
                </Button>
                {!peeked && (
                  <Button variant="ghost" onClick={() => setPeeked(true)}>
                    Remind me how
                  </Button>
                )}
              </div>
            </div>
            {peeked && <ReferencePlayer glosses={[round.key]} label={`Reminder: ${meaning}`} compact />}
          </div>
        )}

        {stage === "read" && mode === "guess" && (
          <div className="mx-auto max-w-xl">
            <p className="eyebrow text-royal!">{player(reader)}</p>
            <h1 className="mt-2 text-[2rem] leading-tight font-semibold tracking-[-0.035em] text-navy">What did {player(signer)} sign?</h1>
            <ul className="mt-6 grid gap-2.5">
              {round.options.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(key);
                      if (key === round.key) setScores((s) => (reader === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
                      setStage("result");
                    }}
                    className="flex min-h-14 w-full items-center rounded-xl border border-line-strong bg-surface px-4 text-left text-[1.0625rem] font-medium text-navy hover:border-royal hover:bg-brand-25"
                  >
                    {capitalise(english(key))}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage === "read" && mode === "check" && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <ReferencePlayer glosses={[round.key]} label={`Reference: ${meaning}`} compact />
            <div>
              <p className="eyebrow text-royal!">{player(reader)}</p>
              <h1 className="mt-2 text-[2rem] leading-tight font-semibold tracking-[-0.035em] text-navy">
                {player(signer)} signed “{meaning}”. Was it clear?
              </h1>
              <p className="mt-3 text-[0.9375rem] leading-6 text-ink-2">The reference is here for comparison. If you sign it differently in your community, go by what you'd understand.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    grade(round.key, "good");
                    setScores((s) => [s[0] + 1, s[1]]);
                    setPicked(round.key);
                    setStage("result");
                  }}
                  leading={<ThumbsUp aria-hidden />}
                >
                  Clear
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    grade(round.key, "again");
                    setPicked("unclear");
                    setStage("result");
                  }}
                  leading={<ThumbsDown aria-hidden />}
                >
                  Not quite
                </Button>
              </div>
            </div>
          </div>
        )}

        {stage === "result" && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div>
              {mode === "guess" ? (
                <p className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold", picked === round.key ? "bg-success-bg text-success" : "bg-gold-50 text-gold-800")}>
                  {picked === round.key ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
                  {picked === round.key ? "Read correctly" : `It was “${meaning}”`}
                </p>
              ) : (
                <p className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold", picked === round.key ? "bg-success-bg text-success" : "bg-gold-50 text-gold-800")}>
                  {picked === round.key ? "Clear. It comes back later." : "Not yet. It comes back soon."}
                </p>
              )}
              <h1 className="mt-4 text-[2.25rem] leading-none font-semibold tracking-[-0.04em] text-navy">{meaning}</h1>
              <p className="mt-3 text-[0.9375rem] leading-6 text-ink-2">Watch it together. Did the signing match?</p>
              <Button className="mt-6" onClick={next} trailing={<ArrowRight aria-hidden />}>
                {index + 1 < rounds.length ? "Next round" : "See results"}
              </Button>
            </div>
            <ReferencePlayer glosses={[round.key]} label={`Reference: ${meaning}`} compact />
          </div>
        )}
      </div>
    </div>
  );
}
