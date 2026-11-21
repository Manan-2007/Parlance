import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Eye, Loader2, RefreshCw, ServerOff, Video, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { useCameraTracking } from "@/services/camera/useCameraTracking";
import { useRecognitionService, type AcceptedSign } from "@/services/recognition/useRecognitionService";
import { useSignLibrary } from "@/services/signs/library";
import { dueCards } from "@/learn/srs";
import { useLearn } from "@/stores/learn";
import { useSettings } from "@/stores/settings";
import { ReferencePlayer } from "./ReferencePlayer";
import { capitalise, englishOf } from "./signData";

type Status = "waiting" | "right" | "almost" | "wrong";

const REASON: Record<string, string> = {
  "low-confidence": "not confident enough yet",
  unverified: "not a sign it is allowed to output",
  unstable: "lower your hands to finish the sign",
  "already-emitted": "lower your hands before signing again",
};

export function ReaderPage() {
  useDocumentTitle("Sign to the reader");
  const library = useSignLibrary();
  const settings = useSettings();
  const grade = useLearn((s) => s.grade);
  const cards = useLearn((s) => s.cards);
  const [params] = useSearchParams();
  const requested = useRef(params.get("sign"));

  const [target, setTarget] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("waiting");
  const [heard, setHeard] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, tries: 0 });
  const [peek, setPeek] = useState(false);
  const [connect, setConnect] = useState(true);
  const statusRef = useRef(status);
  statusRef.current = status;
  const targetRef = useRef(target);
  targetRef.current = target;

  const onAccepted = (sign: AcceptedSign) => {
    if (statusRef.current !== "waiting" || !targetRef.current) return;
    setHeard(sign.word);
    const right = sign.word === targetRef.current;
    setStatus(right ? "right" : "wrong");
    setScore((s) => ({ right: s.right + (right ? 1 : 0), tries: s.tries + 1 }));
    grade(targetRef.current, right ? "good" : "again");
  };

  const service = useRecognitionService({ url: settings.serviceUrl, enabled: connect, threshold: settings.confidenceThreshold, onAccepted });
  // The sign ended without an automatic word, but the target was one of the recogniser's guesses.
  const nearMiss = status === "waiting" && target ? service.suggestions.findIndex((s) => s.word === target) : -1;
  useEffect(() => {
    if (nearMiss < 0 || !targetRef.current) return;
    setStatus("almost");
    setHeard(null);
    setScore((s) => ({ right: s.right, tries: s.tries + 1 }));
    grade(targetRef.current, "hard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearMiss]);
  const pool = useMemo(() => (service.automaticWords ?? []).filter((g) => library.available.has(g)).sort(), [service.automaticWords, library.available]);
  const yours = useMemo(() => pool.filter((g) => cards[g]), [pool, cards]);
  // Mostly signs from your lessons (due ones first), sometimes a new one.
  const pick = (avoid?: string | null) => {
    const random = (list: string[]) => list[Math.floor(Math.random() * list.length)] ?? null;
    const due = new Set(dueCards(cards, Date.now()).map((c) => c.gloss));
    const options = pool.filter((g) => g !== avoid);
    const dueOptions = options.filter((g) => due.has(g));
    const yourOptions = options.filter((g) => cards[g]);
    if (dueOptions.length) return random(dueOptions);
    if (yourOptions.length && Math.random() < 0.7) return random(yourOptions);
    return random(options);
  };
  useEffect(() => {
    const wanted = requested.current;
    if (wanted && pool.includes(wanted)) {
      requested.current = null;
      setTarget(wanted);
    } else if (pool.length && (!target || !pool.includes(target))) setTarget(pick());
    else if (!pool.length) setTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, target]);

  const camera = useCameraTracking({
    onVector: service.send,
    sending: status === "waiting" && service.connection === "open",
    showLandmarks: true,
    cameraId: settings.cameraId,
    onCameraMissing: () => settings.set("cameraId", null),
  });
  const running = camera.status === "running";
  const online = service.connection === "open";

  const next = () => {
    setTarget((t) => pick(t));
    setStatus("waiting");
    setHeard(null);
    setPeek(false);
    service.resetLive();
  };

  const english = target ? capitalise(englishOf(target, library)) : "";

  return (
    <div className="container-page max-w-6xl py-8 sm:py-12">
      <Link to="/app/learn" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-navy">
        <ArrowLeft className="size-4" aria-hidden /> Learn
      </Link>
      <div className="mt-4 border-b border-line pb-6">
        <h1 className="text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[2.75rem]">Sign to the reader</h1>
        <p className="mt-2 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">
          Practise with the local recogniser. {pool.length} signs have both a reference and automatic output enabled in the connected model
          {yours.length > 0 && <>, {yours.length} of them from your lessons, which come up most</>}.
          This is experimental feedback; recognition does not verify that your sign is correct.
        </p>
      </div>

      {!online ? (
        <div className="mt-8 rounded-2xl border-l-2 border-danger bg-surface p-6 ring-1 ring-line">
          <p className="flex items-center gap-2 text-lg font-semibold text-navy">
            {service.connection === "connecting" ? <Loader2 className="size-5 animate-spin text-royal" aria-hidden /> : <ServerOff className="size-5 text-danger" aria-hidden />}
            {service.connection === "connecting" ? "Connecting to the recogniser…" : service.connection === "no-model" ? "The recogniser has no model loaded" : "The recogniser isn't running"}
          </p>
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-6 text-ink-2">
            Start the bundled recognition service from the Parlance folder with <code className="rounded bg-subtle px-1.5 py-0.5 text-[0.8125rem]">npm run dev</code>,
            then try again. Its address is in Settings → Camera and microphone ({settings.serviceUrl}).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setConnect(true);
                service.retry();
              }}
              leading={<RefreshCw aria-hidden />}
            >
              Try again
            </Button>
            <Link to="/app/help#service" className="inline-flex h-11 items-center px-2 text-[0.9375rem] font-medium text-royal hover:underline">
              How to start it
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-navy ring-1 ring-line">
              <video ref={camera.videoRef} muted playsInline aria-hidden className={cn("absolute inset-0 h-full w-full -scale-x-100 object-cover", !running && "invisible")} />
              <canvas ref={camera.canvasRef} aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover", !running && "invisible")} />
              {!running && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
                  <p className="max-w-xs text-sm text-white/80">
                    {camera.status === "denied" ? "Camera access is blocked. Allow it in your browser's site settings." : "Video stays on this device. Only hand positions go to the recogniser on this computer."}
                  </p>
                  <Button variant="inverse" onClick={camera.start} leading={<Video aria-hidden />}>
                    Start camera
                  </Button>
                </div>
              )}
              {running && !camera.quality.hands && (
                <p className="absolute inset-x-3 bottom-3 rounded-md bg-navy/85 px-3 py-2 text-[0.8125rem] text-white">Bring your hands into view with enough space for the full movement.</p>
              )}
            </div>
            {running && status === "waiting" && (
              <div className="mt-3 text-sm text-ink-2" role="status" aria-live="polite">
                {service.buffered ? (
                  <span className="flex items-center gap-3">
                    Watching…
                    <span className="h-1 w-40 overflow-hidden rounded-full bg-line-soft">
                      <span className="block h-full rounded-full bg-royal" style={{ width: `${Math.round((service.buffered.have / Math.max(1, service.buffered.need)) * 100)}%` }} />
                    </span>
                  </span>
                ) : service.candidate && service.candidate.reason !== "resting" && !service.candidate.final ? (
                  "Reading your sign… finish it, then pause or lower your hands."
                ) : service.candidate && service.candidate.reason !== "resting" ? (
                  <span>
                    Closest guess {capitalise(englishOf(service.candidate.word, library))}, {REASON[service.candidate.reason] ?? "not sure yet"}.
                  </span>
                ) : (
                  "Sign the word, then pause or lower your hands. It reads the whole sign when you finish."
                )}
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow text-royal!">
              Sign this · {score.right}/{score.tries} read
            </p>
            <h2 className="mt-2 text-[3rem] leading-none font-semibold tracking-[-0.045em] text-navy">{english || (service.automaticWords === null ? "Loading…" : "No supported signs")}</h2>
            {status === "right" && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-success-bg px-3 py-1.5 font-semibold text-success" role="status">
                <Check className="size-4" aria-hidden /> Read as {english}
              </p>
            )}
            {status === "almost" && (
              <p className="mt-5 max-w-sm rounded-2xl bg-gold-50 px-4 py-3 text-[0.9375rem] leading-6 text-gold-800" role="status">
                <span className="font-semibold">Almost.</span> {english} was among its guesses, but not certain enough to write. Try it once more: start
                from rest, make the movement full size, then lower your hands.
              </p>
            )}
            {status === "wrong" && heard && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold-50 px-3 py-1.5 font-semibold text-gold-800" role="status">
                <X className="size-4" aria-hidden /> Read as {capitalise(englishOf(heard, library))}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {status === "waiting" ? (
                <Button variant="secondary" onClick={next} disabled={!pool.length}>
                  Skip
                </Button>
              ) : (
                <>
                  <Button onClick={next} trailing={<ArrowRight aria-hidden />}>
                    Next word
                  </Button>
                  {status !== "right" && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setStatus("waiting");
                        setHeard(null);
                        service.resetLive();
                      }}
                    >
                      Try again
                    </Button>
                  )}
                </>
              )}
              {!peek && target && (
                <Button variant="ghost" onClick={() => setPeek(true)} leading={<Eye aria-hidden />}>
                  Show me how
                </Button>
              )}
            </div>
            {peek && target && <ReferencePlayer glosses={[target]} label={`The ISLRTC signer signing ${english}`} compact className="mt-6" />}
            <p className="mt-6 text-xs leading-5 text-ink-3">
              The recogniser uses hand movement only. Its source-dataset scores do not establish webcam accuracy. A miss can be the model, not you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
