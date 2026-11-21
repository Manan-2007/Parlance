/**
 * Spaced review: the signs that are due, alternating between recognising a
 * sign and recalling one from its meaning.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, Camera, Eye, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { curriculumGlosses } from "@/learn/curriculum";
import { seededRandom, shuffle } from "@/learn/lessonPlan";
import { dueCards, type Card, type Grade } from "@/learn/srs";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDay, formatTime } from "@/lib/time";
import { useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { findCustomSign, useTeach } from "@/stores/teach";
import { isCustomKey } from "@/learn/recordings";
import { PracticePanel } from "./PracticePanel";
import { ReferencePlayer } from "./ReferencePlayer";
import { capitalise, englishOf } from "./signData";
import { ChoiceStep } from "./steps";

const SESSION = 12;

function RecallCard({ card, onGrade }: { card: Card; onGrade: (grade: Grade) => void }) {
  const library = useSignLibrary();
  const [revealed, setRevealed] = useState(false);
  const [camera, setCamera] = useState(false);
  const english = englishOf(card.gloss, library);
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <div>
        {revealed ? (
          <ReferencePlayer glosses={[card.gloss]} label={`The ISLRTC signer signing ${english}`} />
        ) : camera ? (
          <PracticePanel gloss={card.gloss} />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl bg-sky-50 p-6 text-center ring-1 ring-sky-200 sm:aspect-[16/11]">
            <p className="text-[1.0625rem] leading-7 text-ink-2">Sign it from memory, then check.</p>
            <Button variant="secondary" size="sm" onClick={() => setCamera(true)} leading={<Camera aria-hidden />}>
              Use the camera
            </Button>
          </div>
        )}
      </div>
      <div>
        <p className="eyebrow text-royal!">Recall</p>
        <h1 className="mt-2 text-[2rem] leading-[1.1] font-semibold tracking-[-0.035em] text-navy sm:text-[2.5rem]">How do you sign “{english}”?</h1>
        {!revealed ? (
          <Button className="mt-6" onClick={() => setRevealed(true)} leading={<Eye aria-hidden />}>
            Show the sign
          </Button>
        ) : (
          <div className="mt-6">
            <p className="text-[0.9375rem] font-medium text-ink-2">How well did you remember it?</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ["again", "Not yet"],
                  ["hard", "Hard"],
                  ["good", "Got it"],
                  ["easy", "Easy"],
                ] as [Grade, string][]
              ).map(([grade, label]) => (
                <Button key={grade} variant={grade === "good" ? "primary" : "secondary"} onClick={() => onGrade(grade)}>
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewPage() {
  useDocumentTitle("Review");
  const hydrated = useTeach((s) => s.hydrated);
  const library = useSignLibrary();
  // Recorded signs need their recordings loaded before the session is drawn.
  if (!hydrated || !library.loaded) return <p className="container-page py-16 text-center text-ink-3" role="status">Loading…</p>;
  return <ReviewSession />;
}

/** A card can be reviewed while its recording (if any) still exists on this device. */
const reviewable = (key: string) => !isCustomKey(key) || Boolean(findCustomSign(key));

function ReviewSession() {
  const library = useSignLibrary();
  const cards = useLearn((s) => s.cards);
  const grade = useLearn((s) => s.grade);
  const [queue] = useState(() => dueCards(cards, Date.now(), Infinity).filter((c) => reviewable(c.gloss)).slice(0, SESSION));
  const [index, setIndex] = useState(0);
  // Choices are drawn once per session, so they don't reshuffle on re-render.
  const [choices] = useState(() => {
    const random = seededRandom(Date.now());
    const pool = [...new Set([...Object.keys(cards).filter(reviewable), ...curriculumGlosses()])];
    return queue.map((c) => {
      const meaning = englishOf(c.gloss, library);
      const others = shuffle(pool.filter((g) => g !== c.gloss && englishOf(g, library) !== meaning), random).slice(0, 3);
      return shuffle([c.gloss, ...others], random);
    });
  });

  if (queue.length === 0) {
    const upcoming = Object.values(cards).filter((c) => reviewable(c.gloss)).sort((a, b) => a.due - b.due)[0];
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<CalendarCheck />}
          title="Nothing to review"
          action={
            <ButtonLink to="/app/learn" trailing={<ArrowRight aria-hidden />}>
              Back to Learn
            </ButtonLink>
          }
        >
          {upcoming
            ? `The next sign comes back ${formatDay(upcoming.due).toLowerCase()} at ${formatTime(upcoming.due)}.`
            : "Signs you learn in lessons will show up here when it's time to practise them."}
        </EmptyState>
      </div>
    );
  }

  const card = queue[index];
  const finished = index >= queue.length;
  const advance = (g: Grade) => {
    if (card) grade(card.gloss, g);
    setIndex((i) => i + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="container-page max-w-6xl pt-4 pb-10 sm:pt-6">
      <div className="flex items-center gap-3">
        <Link to="/app/learn" aria-label="Leave the review" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-subtle hover:text-navy">
          <X className="size-5" aria-hidden />
        </Link>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-label="Review progress" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={index}>
          <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
        <span className="w-14 shrink-0 text-right text-sm font-medium text-ink-3 tabular-nums">
          {Math.min(index, queue.length)}/{queue.length}
        </span>
      </div>

      <div key={index} className="mt-6 animate-fade sm:mt-8">
        {finished || !card ? (
          <div className="mx-auto max-w-xl py-6 text-center">
            <CalendarCheck className="mx-auto size-10 text-success" aria-hidden />
            <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] text-navy">Review done</h1>
            <p className="mt-2 text-ink-2">Each sign is scheduled to come back when it is due.</p>
            <ButtonLink to="/app/learn" className="mt-6">
              Back to Learn
            </ButtonLink>
          </div>
        ) : index % 2 === 0 ? (
          <ChoiceStep
            key={card.gloss}
            eyebrow="Recognise"
            question="What does this sign mean?"
            glosses={[card.gloss]}
            options={(choices[index] ?? []).map((key) => ({ key, label: capitalise(englishOf(key, library)) }))}
            answer={card.gloss}
            onNext={(correct) => advance(correct ? "good" : "again")}
          />
        ) : (
          <RecallCard key={card.gloss} card={card} onGrade={advance} />
        )}
      </div>
    </div>
  );
}
