import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, PartyPopper, RotateCcw, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { curriculumGlosses, getUnit, lessonIds } from "@/learn/curriculum";
import { planDeckLesson, type Deck } from "@/learn/decks";
import { getWorkPath, workDeckId, workParts } from "@/learn/workPaths";
import { planLesson, planPhraseLesson, type LessonPlan, type Step } from "@/learn/lessonPlan";
import { dueCards } from "@/learn/srs";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { useTeach } from "@/stores/teach";
import { englishOf } from "./signData";
import {
  DialogueBadge,
  IntroStep,
  ListenStep,
  OrderStep,
  RecognizeStep,
  SignStep,
  WatchAvatarStep,
  WatchStep,
  type StepResult,
} from "./steps";

function lessonTitle(plan: LessonPlan, englishFor: (key: string) => string): string {
  return plan.key.startsWith("phrase/") ? plan.title : plan.key.startsWith("sign/") ? englishFor(plan.title) : plan.title;
}

export function LessonPage() {
  const { unitId, lessonId, phraseId, deckId, pathId } = useParams();
  const [search] = useSearchParams();
  const library = useSignLibrary();
  const phrases = useLearn((s) => s.phrases);
  const cards = useLearn((s) => s.cards);
  const completeLesson = useLearn((s) => s.completeLesson);
  const [seed] = useState(() => Date.now());

  const teachReady = useTeach((s) => s.hydrated);
  const savedDeck = useTeach((s) => (deckId ? s.decks.find((d) => d.id === deckId) : undefined));
  // Signs for your work: one part of a path, taught as a built-in deck.
  const workPath = getWorkPath(pathId);
  const part = Math.max(0, Number(search.get("part") ?? 0) || 0);
  const workDeck = useMemo<Deck | undefined>(() => {
    if (!workPath || !library.loaded) return undefined;
    const items = workParts(workPath, library.available)[part];
    if (!items) return undefined;
    return { id: workDeckId(workPath.id, part), title: `${workPath.title} · part ${part + 1}`, description: workPath.who, author: "", createdAt: 0, items, signs: [], phrases: [] };
  }, [workPath, part, library.loaded, library.available]);
  const deck = savedDeck ?? workDeck;
  const unit = unitId ? getUnit(unitId) : undefined;
  const phrase = phraseId ? phrases.find((p) => p.id === phraseId) : undefined;
  const plan = useMemo<LessonPlan | null>(() => {
    if (phraseId) return phrase && library.loaded ? planPhraseLesson(phrase, library.available) : null;
    if (deckId || pathId) return deck && library.loaded ? planDeckLesson(deck, (key) => englishOf(key, library), curriculumGlosses(), `${deck.id}/${seed}`) : null;
    if (unitId && lessonId) return planLesson(unitId, lessonId, `${unitId}/${lessonId}/${seed}`);
    return null;
    // A phrase lesson is planned once, when the library arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, lessonId, phraseId, deckId, pathId, deck?.id, library.loaded, seed]);

  const [index, setIndex] = useState(0);
  const [tally, setTally] = useState({ correct: 0, total: 0 });
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const completed = useRef(false);
  useDocumentTitle(plan ? lessonTitle(plan, (k) => englishOf(k, library)) : "Lesson");

  const step: Step | undefined = plan?.steps[index];
  const back = pathId ? `/app/learn/work/${pathId}` : deckId ? `/app/learn/decks/${deckId}` : phraseId ? "/app/learn" : unit ? `/app/learn/${unit.id}` : "/app/learn";

  useEffect(() => {
    if (step?.kind !== "done" || !plan || completed.current) return;
    completed.current = true;
    completeLesson(plan.key, tally.correct, tally.total);
  }, [step, plan, tally, completeLesson]);

  if (deckId && teachReady && !deck) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<X />} title="This deck is no longer saved" action={<ButtonLink to="/app/learn">Back to Learn</ButtonLink>}>
          Open the deck link or file again to get it back.
        </EmptyState>
      </div>
    );
  }
  if (phraseId && !phrase) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<X />} title="This phrase is no longer saved" action={<ButtonLink to="/app/learn">Back to Learn</ButtonLink>}>
          Save it again from the translator or your history.
        </EmptyState>
      </div>
    );
  }
  if (!plan || !step) {
    return (
      <div className="container-page py-16">
        {(unitId && lessonId && !planLesson(unitId, lessonId)) || (pathId && (!workPath || (library.loaded && !deck))) ? (
          <EmptyState icon={<X />} title="Lesson not found" action={<ButtonLink to="/app/learn">Back to Learn</ButtonLink>} />
        ) : (
          <p className="text-center text-ink-3" role="status">Preparing the lesson…</p>
        )}
      </div>
    );
  }

  const next = (result?: StepResult) => {
    if (result === true || result === false) setTally((t) => ({ correct: t.correct + (result ? 1 : 0), total: t.total + 1 }));
    setIndex((i) => Math.min(plan.steps.length - 1, i + 1));
    window.scrollTo({ top: 0 });
  };

  const total = plan.steps.length - 1;
  const ids = unit ? lessonIds(unit) : [];
  const position = lessonId ? ids.indexOf(lessonId) : -1;
  const nextLesson = unit && position >= 0 && position < ids.length - 1 ? ids[position + 1] : null;
  const due = dueCards(cards, Date.now()).length;
  const scores = Object.values(bestScores);

  return (
    <div className="container-page max-w-6xl pt-4 pb-10 sm:pt-6">
      <div className="flex items-center gap-3">
        <Link to={back} aria-label="Leave the lesson" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-subtle hover:text-navy">
          <X className="size-5" aria-hidden />
        </Link>
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft"
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index}
        >
          <div className="h-full rounded-full bg-royal transition-[width] duration-500" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <span className="w-14 shrink-0 text-right text-sm font-medium text-ink-3 tabular-nums">
          {Math.min(index, total)}/{total}
        </span>
      </div>

      <div key={index} className="mt-6 animate-fade sm:mt-8">
        {(step.kind === "listen" || step.kind === "reply") && unit?.dialogue && <DialogueBadge setting={unit.dialogue.setting} />}
        {step.kind === "intro" && <IntroStep title={lessonTitle(plan, (k) => englishOf(k, library))} context={plan.context} signs={plan.signs} onNext={() => next()} />}
        {step.kind === "watch" && <WatchStep gloss={step.gloss} onNext={() => next()} />}
        {step.kind === "watch-avatar" && <WatchAvatarStep token={step.token} onNext={() => next()} />}
        {step.kind === "recognize" && <RecognizeStep gloss={step.gloss} options={step.options} onNext={next} />}
        {step.kind === "sign" && (
          <SignStep gloss={step.gloss} onNext={() => next()} onScore={(score) => setBestScores((prev) => ({ ...prev, [step.gloss]: Math.max(prev[step.gloss] ?? 0, score) }))} />
        )}
        {step.kind === "order" && (
          <OrderStep eyebrow="Build the sentence" prompt={step.english} literal={step.literal} answer={step.answer} tiles={step.tiles} rules={step.rules} onNext={next} />
        )}
        {step.kind === "listen" && <ListenStep glosses={step.line.glosses} english={step.line.english} options={step.options} onNext={next} />}
        {step.kind === "reply" && (
          <OrderStep eyebrow="Your reply" prompt={step.line.english} answer={step.line.glosses} tiles={step.tiles} rules={step.line.rules ?? []} onNext={next} />
        )}
        {step.kind === "done" && (
          <div className="mx-auto max-w-xl py-6 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-gold text-navy">
              <PartyPopper className="size-7" aria-hidden />
            </span>
            <h1 className="mt-5 text-[2rem] leading-tight font-semibold tracking-[-0.035em] text-navy">Lesson complete</h1>
            <p className="mt-2 text-[1.0625rem] leading-7 text-ink-2">
              {tally.total > 0 ? `${tally.correct} of ${tally.total} right first time.` : "Nicely done."}
              {scores.length > 0 && ` Best camera match: ${Math.max(...scores)}.`}
            </p>
            {plan.signs.length > 0 && (
              <p className="mt-3 text-sm text-ink-3">
                {plan.signs.length} sign{plan.signs.length === 1 ? "" : "s"} added to your review deck. They come back just before you would forget them.
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {nextLesson && unit && (
                <ButtonLink to={`/app/learn/${unit.id}/${nextLesson}`} trailing={<ArrowRight aria-hidden />}>
                  Next lesson
                </ButtonLink>
              )}
              {due > 0 && (
                <ButtonLink to="/app/learn/review" variant={nextLesson ? "secondary" : "primary"} leading={<RotateCcw aria-hidden />}>
                  Review {due} sign{due === 1 ? "" : "s"}
                </ButtonLink>
              )}
              {workPath && workParts(workPath, library.available)[part + 1] && (
                <ButtonLink to={`/app/learn/work/${workPath.id}/lesson?part=${part + 1}`} trailing={<ArrowRight aria-hidden />}>
                  Next part
                </ButtonLink>
              )}
              <ButtonLink to={back} variant="secondary">
                {unit ? "Back to the unit" : workPath ? workPath.title : deckId ? "Back to the deck" : "Back to Learn"}
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
