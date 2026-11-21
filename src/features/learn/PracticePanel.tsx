/**
 * "Sign it": the learner signs to the camera and gets specific feedback.
 *
 * Tracking runs on this device (the existing MediaPipe worker); frames are
 * converted to the motion library's format and compared with the reference
 * recording (ISLRTC, or one recorded in Teach) by src/learn/motion.ts.
 * Recording starts when a hand rises into the signing space and stops when the
 * hands come down. Video never leaves the browser.
 */
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Hand, Play, RotateCcw, ServerCog, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import {
  anchorOf,
  comparePractice,
  frozenBlocks,
  isPracticeError,
  type Dimension,
  type PracticeError,
  type PracticeResult,
} from "@/learn/motion";
import { isCustomKey } from "@/learn/recordings";
import { cn } from "@/lib/cn";
import { useRecognitionService } from "@/services/recognition/useRecognitionService";
import { useRecognitionMetrics, useSignLibrary } from "@/services/signs/library";
import { useLearn } from "@/stores/learn";
import { useSettings } from "@/stores/settings";
import { CaptureStage } from "./CaptureStage";
import { SignFigure } from "./SignFigure";
import { englishOf, useSignMotions } from "./signData";
import { useFrameLoop } from "./useFrameLoop";
import { useSignCapture } from "./useSignCapture";

type Outcome = PracticeResult | PracticeError | "timeout";

const ERROR_TEXT: Record<PracticeError | "timeout", { title: string; body: string }> = {
  "no-body": { title: "Step back a little", body: "Parlance needs to see your head and both shoulders to measure where your hands are." },
  "no-hands": { title: "Hands not seen", body: "Raise your hands into the space in front of your chest and face while you sign." },
  "too-short": { title: "That was very short", body: "Sign the whole movement, then lower your hands to finish." },
  timeout: { title: "No signing seen", body: "Recording starts when a hand comes up. Raise your hand into view, sign, then lower it." },
};

const DIMENSIONS: { key: Dimension; label: string }[] = [
  { key: "hands", label: "Hands used" },
  { key: "position", label: "Position" },
  { key: "shape", label: "Hand shape" },
  { key: "movement", label: "Movement" },
];

export function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const colour = score >= 75 ? "var(--color-success)" : score >= 50 ? "var(--color-gold)" : "var(--color-ink-3)";
  return (
    <svg viewBox="0 0 64 64" className="size-20 shrink-0" role="img" aria-label={`Match score ${score} out of 100`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-line-soft)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={colour} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" className="fill-navy text-[15px] font-semibold tabular-nums">
        {score}
      </text>
    </svg>
  );
}

interface PracticePanelProps {
  /** ISLRTC gloss or "rec:<id>". */
  gloss: string;
  /** Called with each completed attempt's score. */
  onScored?: (score: number) => void;
}

export function PracticePanel({ gloss, onScored }: PracticePanelProps) {
  const library = useSignLibrary();
  const metrics = useRecognitionMetrics();
  const english = englishOf(gloss, library);
  const serviceUrl = useSettings((s) => s.serviceUrl);
  const threshold = useSettings((s) => s.confidenceThreshold);
  const leftHanded = useLearn((s) => s.leftHanded);
  const mirror = useLearn((s) => s.mirror);
  const speed = useLearn((s) => s.speed);
  const setPreference = useLearn((s) => s.setPreference);
  const logPractice = useLearn((s) => s.logPractice);
  const rateTips = useLearn((s) => s.rateTips);
  const [attemptAt, setAttemptAt] = useState<number | null>(null);
  const [rated, setRated] = useState<boolean | null>(null);

  const { motions } = useSignMotions([gloss]);
  const reference = motions[0] ?? null;
  const refAnchor = useMemo(() => (reference ? anchorOf(reference.frames) : null), [reference]);
  const refHide = useMemo(() => (reference ? frozenBlocks(reference.frames) : [false, false]), [reference]);
  const custom = isCustomKey(gloss);

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [replayStep, setReplayStep] = useState(0);
  const [checkWithService, setCheckWithService] = useState(false);
  const [serviceWord, setServiceWord] = useState<string | null>(null);

  const verified = !custom && metrics.verified.has(gloss);
  const service = useRecognitionService({
    url: serviceUrl,
    enabled: verified && checkWithService,
    threshold,
    onAccepted: (sign) => setServiceWord(sign.word),
  });

  const maxMs = reference ? Math.max(4000, (reference.frames.length / (reference.fps || 15)) * 1000 * 2.5 + 1500) : 6000;
  const capture = useSignCapture({
    maxMs,
    onCaptured: (frames) => {
      if (!reference) return;
      const result = comparePractice(frames, reference.frames, { leftHanded, fps: 15 });
      setOutcome(result);
      setRated(null);
      if (!isPracticeError(result)) {
        const at = Date.now();
        setAttemptAt(at);
        logPractice({ at, key: gloss, score: result.score, distance: Math.round(result.distance * 1000) / 1000, dimensions: result.dimensions, tips: result.tips.map((t) => t.kind), leftHanded });
        onScored?.(result.score);
      }
    },
    onTimeout: () => setOutcome("timeout"),
    onVector: service.send,
    sendVectors: verified && checkWithService && service.connection === "open",
  });
  const { phase, reset } = capture;

  // A new sign resets the attempt.
  useEffect(() => {
    setOutcome(null);
    setReplaying(false);
    reset();
  }, [gloss, reset]);

  const record = () => {
    setOutcome(null);
    setReplaying(false);
    setServiceWord(null);
    capture.record();
  };

  const result = typeof outcome === "object" && outcome ? outcome : null;
  const failure = typeof outcome === "string" ? outcome : null;
  const replayAnchors = useMemo(() => (result ? { user: anchorOf(result.frames.user), ref: anchorOf(result.frames.reference) } : null), [result]);
  useEffect(() => {
    if (!replaying || !result) return;
    setReplayStep(0);
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      if (step >= result.path.length) {
        window.clearInterval(id);
        setReplaying(false);
        return;
      }
      setReplayStep(step);
    }, 1000 / 15 / speed);
    return () => window.clearInterval(id);
  }, [replaying, result, speed]);

  const loopFrame = useFrameLoop(reference?.frames ?? null, !replaying, speed, reference?.fps || 15);
  const pair = replaying && result ? result.path[replayStep] : null;
  const leftFrame = pair && result ? result.frames.reference[pair[1]]! : loopFrame;
  const leftAnchor = pair && replayAnchors ? replayAnchors.ref : refAnchor;
  // Left-handers see the reference flipped, so their main hand lines up with it.
  const referenceMirror = mirror !== leftHanded;
  const done = phase === "done";

  return (
    <section aria-label={`Practise ${english}`} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))] ring-1 ring-sky-200">
          <SignFigure frame={leftFrame} anchor={leftAnchor} hide={refHide} mirror={referenceMirror} label={`Reference for ${english}`} className="absolute inset-0" />
          <figcaption className="absolute top-2.5 left-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-[0.75rem] font-semibold text-navy shadow-xs">
            {custom ? "Reference" : "ISLRTC"}
          </figcaption>
        </figure>
        <CaptureStage
          capture={capture}
          frame={pair && result ? result.frames.user[pair[0]]! : undefined}
          anchor={pair && replayAnchors ? replayAnchors.user : undefined}
          mirror={mirror}
          idleText="Turn on the camera to practise. Video stays on this device and is never recorded."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(phase === "ready" || done) && (
          <Button onClick={record} leading={done ? <RotateCcw aria-hidden /> : <Hand aria-hidden />}>
            {done ? "Try again" : "Record my sign"}
          </Button>
        )}
        {phase === "recording" && (
          <Button variant="secondary" onClick={capture.stopEarly}>
            Done
          </Button>
        )}
        {result && (
          <Button variant="secondary" onClick={() => setReplaying(true)} disabled={replaying} leading={<Play aria-hidden />}>
            Replay side by side
          </Button>
        )}
        <span className="ml-auto">
          <Switch checked={leftHanded} onChange={(on) => setPreference("leftHanded", on)} label="I sign left-handed" />
        </span>
      </div>

      {failure && (
        <div className="rounded-xl border-l-2 border-gold bg-gold-50 px-4 py-3" role="status">
          <p className="font-semibold text-navy">{ERROR_TEXT[failure].title}</p>
          <p className="mt-0.5 text-sm leading-6 text-ink-2">{ERROR_TEXT[failure].body}</p>
        </div>
      )}
      {result && (
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5" role="status" aria-live="polite">
          <div className="flex items-start gap-4">
            <ScoreRing score={result.score} />
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-[-0.02em] text-navy">{result.score >= 75 ? "Great match" : result.score >= 50 ? "Close" : "Not yet"}</p>
              <p className="mt-0.5 text-sm leading-6 text-ink-3">How closely your signing matched the {custom ? "reference" : "ISLRTC"} recording.</p>
            </div>
          </div>
          {result.tips.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {result.tips.map((tip) => (
                <li key={tip.kind + tip.text} className="flex items-start gap-2.5 text-[0.9375rem] leading-6 text-ink">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  {custom ? tip.text.replace("The ISLRTC signer makes", "The reference makes").replace("in the ISLRTC sign", "in the reference") : tip.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 flex items-center gap-2 text-[0.9375rem] text-success">
              <CheckCircle2 className="size-4" aria-hidden /> No big differences found. Use the replay to compare the details.
            </p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-4">
            {DIMENSIONS.map(({ key, label }) => (
              <div key={key}>
                <dt className="text-xs font-medium text-ink-3">{label}</dt>
                <dd className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-soft" aria-label={`${label}: ${result.dimensions[key]} out of 100`}>
                  <span
                    className={cn("block h-full rounded-full", result.dimensions[key] >= 70 ? "bg-success" : result.dimensions[key] >= 45 ? "bg-gold" : "bg-ink-3/60")}
                    style={{ width: `${Math.max(4, result.dimensions[key])}%` }}
                  />
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm text-ink-2">
            {rated === null ? (
              <>
                <span>{result.tips.length ? "Were these tips useful?" : "Did this score feel right?"}</span>
                {([true, false] as const).map((helpful) => (
                  <button
                    key={String(helpful)}
                    type="button"
                    aria-label={helpful ? "Yes" : "No"}
                    onClick={() => {
                      if (attemptAt !== null) rateTips(attemptAt, helpful);
                      setRated(helpful);
                    }}
                    className="inline-flex size-9 items-center justify-center rounded-full text-ink-2 ring-1 ring-line-strong hover:bg-subtle hover:text-navy"
                  >
                    {helpful ? <ThumbsUp className="size-4" aria-hidden /> : <ThumbsDown className="size-4" aria-hidden />}
                  </button>
                ))}
              </>
            ) : (
              <span>Thanks. Your answers stay on this device and help tune the feedback (Settings → Learning).</span>
            )}
          </div>
          {verified && checkWithService && (
            <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-sm text-ink-2">
              <ServerCog className="size-4 text-royal" aria-hidden />
              {service.connection !== "open"
                ? "The recognition service is not connected."
                : serviceWord
                  ? `Recognition service: ${englishOf(serviceWord, library).toUpperCase()}${serviceWord === gloss ? " ✓" : ""}`
                  : "Recognition service: no confident match."}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 text-xs leading-5 text-ink-3">
        <p>
          Compares which hands you use, where they are, their shape, which way your palm faces, and the movement. It can't see your face, and in ISL the face
          carries grammar{custom ? "" : ", so check the official video for expression"}.
        </p>
        {verified && (
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={checkWithService} onChange={(e) => setCheckWithService(e.target.checked)} />
            Also check with the recognition service (needs it running; see Settings)
          </label>
        )}
      </div>
    </section>
  );
}
