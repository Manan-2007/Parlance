import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Plus, ScanEye } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { UNITS } from "@/learn/curriculum";
import { isCustomKey } from "@/learn/recordings";
import { gradeFromScore } from "@/learn/srs";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useRecognitionMetrics, useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { findCustomSign, useTeach } from "@/stores/teach";
import { PracticePanel } from "./PracticePanel";
import { SignViewer } from "./SignViewer";
import { capitalise, englishOf } from "./signData";

export function SignPage() {
  const { gloss = "" } = useParams();
  const library = useSignLibrary();
  const metrics = useRecognitionMetrics();
  const card = useLearn((s) => s.cards[gloss]);
  const introduce = useLearn((s) => s.introduce);
  const grade = useLearn((s) => s.grade);
  const [practising, setPractising] = useState(false);
  const teach = useTeach();
  const custom = isCustomKey(gloss);
  const recording = custom ? findCustomSign(gloss, teach) : undefined;
  const english = englishOf(gloss, library);
  useDocumentTitle(library.loaded && (!custom || teach.hydrated) ? capitalise(english) : "Sign");

  if (custom && !teach.hydrated) return <p className="container-page py-16 text-center text-ink-3" role="status">Loading…</p>;
  if ((custom && !recording) || (!custom && library.loaded && !library.available.has(gloss))) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={<ArrowLeft />} title="Sign not found" action={<ButtonLink to="/app/learn/signs">Sign library</ButtonLink>} />
      </div>
    );
  }

  const units = UNITS.filter((unit) => unit.lessons.some((lesson) => lesson.signs.includes(gloss)));

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to={custom ? "/app/learn/teach" : "/app/learn/signs"} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> {custom ? "Teach" : "Sign library"}
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
        <SignViewer gloss={gloss} />
        <div>
          <p className="eyebrow">{custom ? (recording?.letter ? `Letter ${recording.letter} · recording` : "Recording") : library.signs[gloss]?.pos ?? "Sign"}</p>
          <h1 className="mt-2 text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.045em] text-navy">{capitalise(english)}</h1>
          {recording?.notes && <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-[0.9375rem] text-ink-2 ring-1 ring-sky-200">Tip: {recording.notes}</p>}
          {units.length > 0 && (
            <p className="mt-3 text-[0.9375rem] text-ink-2">
              Taught in{" "}
              {units.map((unit, i) => (
                <span key={unit.id}>
                  {i > 0 && ", "}
                  <Link to={`/app/learn/${unit.id}`} className="font-medium text-royal hover:underline">
                    {unit.title}
                  </Link>
                </span>
              ))}
              .
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setPractising(true)} disabled={practising} leading={<Camera aria-hidden />}>
              Practise with the camera
            </Button>
            {!custom && metrics.verified.has(gloss) && (
              <ButtonLink to={`/app/learn/reader?sign=${encodeURIComponent(gloss)}`} variant="secondary" leading={<ScanEye aria-hidden />}>
                Sign it to the reader
              </ButtonLink>
            )}
            {!card && (
              <Button variant="secondary" onClick={() => introduce([gloss])} leading={<Plus aria-hidden />}>
                Add to my reviews
              </Button>
            )}
          </div>
          {card?.bestScore !== undefined && <p className="mt-3 text-sm text-ink-3">Your best camera match: {card.bestScore}</p>}
        </div>
      </div>
      {practising && (
        <section className="mt-10 border-t border-line pt-8" aria-label="Practise">
          <PracticePanel gloss={gloss} onScored={(score) => grade(gloss, gradeFromScore(score), score)} />
        </section>
      )}
    </div>
  );
}
