/**
 * Record a sign: a teacher (or anyone fluent) signs to the camera and Parlance
 * keeps the hand and body positions as a reference learners can watch and be
 * checked against. No video is stored.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Hand, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toaster";
import { anchorOf, fillHandGaps, sequenceFeatures, type PracticeError } from "@/learn/motion";
import { encodeFrames, MAX_RECORDING_FRAMES } from "@/learn/recordings";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { createId } from "@/lib/id";
import { useLearn } from "@/stores/learn";
import { useTeach } from "@/stores/teach";
import { CaptureStage } from "../learn/CaptureStage";
import { SignFigure } from "../learn/SignFigure";
import { signFacts } from "../learn/signData";
import { useFrameLoop } from "../learn/useFrameLoop";
import { useSignCapture } from "../learn/useSignCapture";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const ERRORS: Record<PracticeError | "timeout", string> = {
  "no-body": "Your head and both shoulders need to be in view, so the sign can be placed on the body. Step back and record again.",
  "no-hands": "No hands were seen in the signing space. Raise them in front of your chest or face while you sign.",
  "too-short": "That was very short. Sign the whole movement, then lower your hands.",
  timeout: "Recording starts when a hand comes up. Raise your hand into view, sign, then lower it.",
};

/** Trim a capture to the signing, with a frame of lead-in and lead-out. */
function prepare(frames: Float32Array[]): Float32Array[] | PracticeError {
  const filled = fillHandGaps(frames);
  const seq = sequenceFeatures(filled);
  if (!seq) return "no-body";
  if (!seq.features.length) return "no-hands";
  if (seq.features.filter((f) => f.hands.some(Boolean)).length < 4) return "too-short";
  return filled.slice(seq.offset, seq.offset + seq.features.length).slice(0, MAX_RECORDING_FRAMES);
}

export function RecordPage() {
  useDocumentTitle("Record a sign");
  const navigate = useNavigate();
  const author = useTeach((s) => s.author);
  const setAuthor = useTeach((s) => s.setAuthor);
  const addRecording = useTeach((s) => s.addRecording);
  const mirror = useLearn((s) => s.mirror);
  const speed = useLearn((s) => s.speed);
  const [english, setEnglish] = useState("");
  const [letter, setLetter] = useState("");
  const [notes, setNotes] = useState("");
  const [captured, setCaptured] = useState<Float32Array[] | null>(null);
  const [error, setError] = useState<PracticeError | "timeout" | null>(null);

  const capture = useSignCapture({
    maxMs: 8000,
    onCaptured: (frames) => {
      const result = prepare(frames);
      if (typeof result === "string") {
        setError(result);
        setCaptured(null);
      } else {
        setError(null);
        setCaptured(result);
      }
    },
    onTimeout: () => setError("timeout"),
  });

  const preview = useFrameLoop(captured, Boolean(captured), speed, 15);
  const previewAnchor = useMemo(() => (captured ? anchorOf(captured) : null), [captured]);
  const facts = useMemo(() => (captured ? signFacts({ gloss: "", english: "", pos: "", fps: 15, frames: captured }) : null), [captured]);
  const meaning = english.trim() || (letter ? `letter ${letter}` : "");
  const busy = capture.phase === "countdown" || capture.phase === "waiting" || capture.phase === "recording";

  const save = () => {
    if (!captured || !meaning) return;
    addRecording({
      id: createId(),
      english: meaning.slice(0, 60),
      letter: letter || undefined,
      author: author.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
      fps: 15,
      count: captured.length,
      frames: encodeFrames(captured),
    });
    toast(`Saved "${meaning}"`);
    navigate("/app/learn/teach");
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <Link to="/app/learn/teach" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Teach
      </Link>
      <h1 className="mt-4 text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[2.75rem]">Record a sign</h1>
      <p className="mt-2 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">
        Sign it once to the camera. Learners can watch your recording and practise against it, here or in a deck you share.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <div>
          {/* The camera stage stays mounted so tracking keeps its video element; the preview sits on top. */}
          <div className="relative">
            <CaptureStage capture={capture} mirror={mirror} label="Camera" idleText="Turn on the camera. Only hand and body positions are kept, never video." />
            {captured && (
              <figure className="absolute inset-0 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))] ring-1 ring-sky-200">
                <SignFigure frame={preview} anchor={previewAnchor} mirror={mirror} label="Your recording, playing back" className="absolute inset-0" />
                <figcaption className="absolute top-2.5 left-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-[0.75rem] font-semibold text-navy shadow-xs">Your recording</figcaption>
              </figure>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!captured && (capture.phase === "ready" || capture.phase === "done") && (
              <Button onClick={() => { setError(null); capture.record(); }} leading={<Hand aria-hidden />}>
                {capture.phase === "done" ? "Record again" : "Record"}
              </Button>
            )}
            {capture.phase === "recording" && (
              <Button variant="secondary" onClick={capture.stopEarly}>
                Done
              </Button>
            )}
            {captured && (
              <Button variant="secondary" onClick={() => { setCaptured(null); capture.reset(); }} leading={<RotateCcw aria-hidden />}>
                Record again
              </Button>
            )}
          </div>
          {error && (
            <p className="mt-4 rounded-xl border-l-2 border-gold bg-gold-50 px-4 py-3 text-sm leading-6 text-ink-2" role="status">
              {ERRORS[error]}
            </p>
          )}
          {facts && (
            <p className="mt-4 text-sm text-ink-2" role="status">
              {facts.hands === "both" ? "Both hands" : "One hand"} · {facts.zone ?? "signing space"} · {facts.seconds.toFixed(1)} s · {captured?.length} frames
            </p>
          )}
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <label className="block">
            <span className="text-[0.9375rem] font-semibold text-ink">What does it mean?</span>
            <input
              value={english}
              onChange={(e) => setEnglish(e.target.value.slice(0, 60))}
              placeholder={letter ? `letter ${letter}` : "e.g. canteen, my name, Priya"}
              className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] outline-none focus:border-royal"
            />
          </label>
          <label className="block">
            <span className="text-[0.9375rem] font-semibold text-ink">Is it a fingerspelled letter?</span>
            <select value={letter} onChange={(e) => setLetter(e.target.value)} className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem]">
              <option value="">No, it's a sign</option>
              {LETTERS.map((l) => (
                <option key={l} value={l}>
                  Letter {l}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-ink-3">Recorded letters let Fingerspelling check learners with the camera.</span>
          </label>
          <label className="block">
            <span className="text-[0.9375rem] font-semibold text-ink">Signed by</span>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name (optional, shown to learners)"
              className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-[0.9375rem] outline-none focus:border-royal"
            />
          </label>
          <label className="block">
            <span className="text-[0.9375rem] font-semibold text-ink">Tips for learners</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="Optional, e.g. 'eyebrows raised'"
              className="mt-1.5 w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-[0.9375rem] outline-none focus:border-royal"
            />
          </label>
          <Button type="submit" disabled={!captured || !meaning || busy} leading={<Save aria-hidden />}>
            Save recording
          </Button>
          <p className="flex items-start gap-2 text-xs leading-5 text-ink-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            Saved in this browser only. Learners see recordings as "not reviewed", so record signs you are sure of, in the form your community uses.
          </p>
        </form>
      </div>
    </div>
  );
}
