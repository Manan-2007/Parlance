import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CheckCircle2, CircleHelp, CirclePause, Hand, PlugZap, RefreshCw, ScanLine, ServerOff, TriangleAlert, WalletCards } from "lucide-react";
import { SigningLoader } from "@/components/ui/SigningLoader";
import { cn } from "@/lib/cn";
import type { CameraTracking } from "@/services/camera/useCameraTracking";
import type { AcceptedSign, RecognitionService, RejectReason } from "@/services/recognition/useRecognitionService";
import { glossLabel, trustOf, type RecognitionMetrics, type SignLibrary } from "@/services/signs/library";

interface ReadoutProps {
  camera: CameraTracking;
  service: RecognitionService;
  recognising: boolean;
  accepted: AcceptedSign | null;
  threshold: number;
  metrics: RecognitionMetrics;
  library: SignLibrary;
  /** Present while video reading is on. */
  video?: { reading: boolean; note: string | null } | null;
}

const REASON_TEXT: Record<Exclude<RejectReason, "resting">, string> = {
  "low-confidence": "Below the confidence threshold, so nothing is output.",
  unverified: "This word needs your confirmation before it is added.",
  unstable: "Looks confident so far. Finish the sign, then pause or lower your hands to add it.",
  "already-emitted": "Already added. Lower your hands briefly before repeating a sign.",
};

type Tone = "neutral" | "success" | "warning" | "danger" | "muted";

/* Every state pairs its colour with an icon and a written title. */
const TONE: Record<Tone, { card: string; icon: string }> = {
  neutral: { card: "bg-cobalt-100", icon: "bg-cobalt-400 text-white" },
  success: { card: "bg-forest-100", icon: "bg-forest-400 text-white" },
  warning: { card: "bg-sun-100", icon: "bg-sun-400 text-navy" },
  danger: { card: "bg-danger-bg", icon: "bg-surface text-danger" },
  muted: { card: "bg-paper", icon: "bg-surface text-navy" },
};

function State({ icon, title, children, tone = "neutral", action }: { icon: ReactNode; title: ReactNode; children?: ReactNode; tone?: Tone; action?: ReactNode }) {
  return (
    <div className={cn("min-h-[8.5rem] animate-pop rounded-[1.75rem] p-5", TONE[tone].card)}>
      <span className={cn("inline-flex size-10 items-center justify-center rounded-full [&_svg]:size-5", TONE[tone].icon)}>{icon}</span>
      <div className="mt-3 text-[1.375rem] leading-7 font-extrabold tracking-[-0.03em] text-navy">{title}</div>
      {children && <div className="mt-1.5 text-[0.9375rem] leading-6 text-ink-2">{children}</div>}
      {action && <div className="mt-3 flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

function Meter({ value, threshold, label }: { value: number; threshold: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs font-bold text-ink-2">
        <span>{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div
        className="relative mt-1.5 h-2.5 rounded-full bg-surface"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={cn("absolute inset-y-0 left-0 rounded-full", value >= threshold ? "bg-forest-400" : "bg-ink-3/50")} style={{ width: `${pct}%` }} />
        <div aria-hidden className="absolute -top-1 -bottom-1 w-1 rounded-full bg-navy" style={{ left: `${Math.round(threshold * 100)}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-3">Line marks the {Math.round(threshold * 100)}% threshold</p>
    </div>
  );
}

/** When a sign isn't read, a ready-made card still gets the message across. */
function CardFallback() {
  return (
    <Link to="/app/cards" className="inline-flex min-h-10 items-center gap-1.5 text-[0.8125rem] font-bold text-navy underline underline-offset-4 hover:text-cobalt-400">
      <WalletCards className="size-4" aria-hidden /> In a hurry? Show a card instead
    </Link>
  );
}

export function ServiceStatus({ service }: { service: RecognitionService }) {
  const c = service.connection;
  const view =
    c === "open"
      ? { icon: <CheckCircle2 className="size-4 text-success" aria-hidden />, text: "Recognition service connected", pill: "bg-forest-100" }
      : c === "connecting"
        ? { icon: <SigningLoader label="Connecting" decorative className="size-5" />, text: "Connecting to the recognition service", pill: "bg-cobalt-100" }
        : c === "no-model"
          ? { icon: <TriangleAlert className="size-4 text-sun-800" aria-hidden />, text: "Service running without a model", pill: "bg-sun-100" }
          : { icon: <ServerOff className="size-4 text-danger" aria-hidden />, text: "Recognition service offline", pill: "bg-danger-bg" };
  return (
    <p className={cn("flex w-fit items-center gap-2 rounded-full py-1.5 pr-3.5 pl-2.5 text-[0.8125rem] font-bold text-navy", view.pill)} role="status">
      <span className="inline-flex size-5 items-center justify-center">{view.icon}</span>
      {view.text}
    </p>
  );
}

export function RecognitionReadout({ camera, service, recognising, accepted, threshold, metrics, library, video }: ReadoutProps) {
  if (video?.reading) {
    return (
      <State tone="neutral" icon={<SigningLoader label="Reading" decorative className="size-6" />} title="Reading your sign from video…">
        The clip of your sign is with the vision model. This takes a few seconds.
      </State>
    );
  }
  if (accepted) {
    const verified = trustOf(accepted.word, metrics) === "verified";
    const status = accepted.confirmed
      ? "Added after your confirmation"
      : accepted.via
        ? "Read from video and added"
        : `Recognised and added${verified ? " · automatic word" : ""}`;
    return (
      <State tone="success" icon={<BadgeCheck />} title={<span className="text-[3rem] leading-none tracking-[-0.035em] uppercase">{glossLabel(accepted.word, library)}</span>}>
        <span className="font-bold text-success">{status}</span>
        {accepted.via ? (
          <span className="mt-2 block text-xs text-ink-3">Vision model&rsquo;s own confidence: {Math.round(accepted.confidence * 100)}%</span>
        ) : (
          <Meter value={accepted.confidence} threshold={threshold} label="Model score" />
        )}
      </State>
    );
  }
  if (service.connection === "offline" || service.connection === "idle") {
    return (
      <State
        tone="danger"
        icon={<ServerOff />}
        title="Recognition service offline"
        action={
          <>
            <button
              type="button"
              onClick={service.retry}
              className="press inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-navy bg-surface px-4 text-[0.8125rem] font-bold text-navy hover:bg-sun-100"
            >
              <RefreshCw className="size-3.5" aria-hidden /> {service.gaveUp ? "Try again" : "Retry now"}
            </button>
            <Link to="/app/help#service" className="inline-flex h-10 items-center px-1 text-[0.8125rem] font-bold text-navy underline underline-offset-4 hover:text-cobalt-400">
              How to start it
            </Link>
            <CardFallback />
          </>
        }
      >
        The camera and hand tracking still work here, but signs can&rsquo;t be interpreted until the service is running.
        {!service.gaveUp && <span className="mt-1 block text-xs text-ink-3">Retrying automatically…</span>}
      </State>
    );
  }
  if (service.connection === "connecting") {
    return <State tone="muted" icon={<SigningLoader label="Connecting" decorative className="size-6" />} title="Connecting…" />;
  }
  if (service.connection === "no-model") {
    return (
      <State tone="warning" icon={<PlugZap />} title="No trained model loaded">
        The service is running but cannot recognise signs until a model is added to its model folder.
      </State>
    );
  }
  if (service.error) {
    return (
      <State tone="warning" icon={<CircleHelp />} title="Try the sign again" action={<button type="button" onClick={service.resetLive} className="min-h-11 text-sm font-medium text-royal hover:underline">Reset recognition</button>}>
        {service.error}
      </State>
    );
  }
  if (camera.status !== "running") {
    return (
      <State tone="muted" icon={<ScanLine />} title="Start the camera to begin">
        Sign one word at a time, then lower your hands briefly. Recognised words build a sentence below.
      </State>
    );
  }
  if (!recognising) {
    return (
      <State tone="muted" icon={<CirclePause />} title="Recognition paused">
        The camera is on, but nothing is being sent for recognition.
      </State>
    );
  }
  if (camera.quality.hands === 0 && !service.suggestions.length) {
    return (
      <State tone="muted" icon={<Hand />} title="Waiting for a sign">
        Raise your hands into the frame and sign one word.
      </State>
    );
  }
  if (service.buffered) {
    const pct = Math.round((service.buffered.have / Math.max(1, service.buffered.need)) * 100);
    return (
      <State tone="neutral" icon={<ScanLine />} title="Watching your signing…">
        Collecting a short movement window. Finish the sign naturally.
        <span className="mt-3 block h-2.5 overflow-hidden rounded-full bg-surface" aria-hidden>
          <span className="block h-full rounded-full bg-cobalt-400 transition-[width]" style={{ width: `${pct}%` }} />
        </span>
      </State>
    );
  }
  if (video?.note && !service.suggestions.length) {
    return (
      <State tone="warning" icon={<CircleHelp />} title="Not recognised" action={<CardFallback />}>
        {video.note}
      </State>
    );
  }
  const candidate = service.candidate;
  if (candidate && candidate.reason !== "resting" && !candidate.final && !service.suggestions.length) {
    return (
      <State tone="neutral" icon={<ScanLine />} title="Reading your sign…">
        Finish the sign, then pause or lower your hands. Parlance reads the whole movement before it answers.
      </State>
    );
  }
  if (candidate && candidate.reason !== "resting") {
    return (
      <State tone="warning" icon={<CircleHelp />} title={service.suggestions.length ? "Possible match" : "Not recognised"} action={service.suggestions.length ? undefined : <CardFallback />}>
        {REASON_TEXT[candidate.reason]}
        <span className="mt-2 block text-xs text-ink-3">
          Closest guess, not accepted: <span className="font-semibold text-ink-2">{glossLabel(candidate.word, library)}</span>
        </span>
        <Meter value={candidate.confidence} threshold={threshold} label="Closest guess" />
        {service.suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Confirm a suggested word">
            {service.suggestions.map((suggestion) => (
              <button key={suggestion.word} type="button" onClick={() => service.confirm(suggestion.word)} className="min-h-11 rounded-sm border border-line-strong bg-surface px-3 text-sm font-medium text-royal hover:border-royal">
                Add {glossLabel(suggestion.word, library)}
              </button>
            ))}
          </div>
        )}
      </State>
    );
  }
  return (
    <State tone="neutral" icon={<Hand />} title="No sign detected">
      Hands are in view but no sign is being made. Parlance stays silent rather than guess.
    </State>
  );
}
