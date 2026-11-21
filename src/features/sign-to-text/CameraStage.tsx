/**
 * The Sign → Text camera stage: a large viewport with minimal overlays, live
 * subtitles for accepted signs, and a floating transport for camera controls.
 */
import type { ReactNode } from "react";
import { Camera, CameraOff, CheckCircle2, Grid2x2, Loader2, Lock, Power, ShieldAlert, Spline, TriangleAlert, VideoOff, XCircle } from "lucide-react";
import { Pal } from "@/components/brand/Pal";
import { RainbowArch } from "@/components/brand/RainbowArch";
import { WavingHand } from "@/components/brand/Hands";
import { SigningLoader } from "@/components/ui/SigningLoader";
import { cn } from "@/lib/cn";
import type { CameraTracking } from "@/services/camera/useCameraTracking";
import { FramingGuide } from "./FramingGuide";

interface CameraStageProps {
  camera: CameraTracking;
  recognising: boolean;
  onRecognising: (on: boolean) => void;
  recognitionAvailable: boolean;
  cameraId: string | null;
  onCameraId: (id: string | null) => void;
  showLandmarks: boolean;
  onShowLandmarks: (on: boolean) => void;
  showGuide: boolean;
  onShowGuide: (on: boolean) => void;
  serviceHost: string;
  /** Labels of the signs accepted in the sentence being built. */
  subtitles: string[];
  /** The sign just accepted, briefly. */
  flash: string | null;
}

function ToolButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "press inline-flex size-9 items-center justify-center rounded-full sm:size-10 [&_svg]:size-[1.125rem]",
        pressed ? "bg-navy text-white" : "text-navy hover:bg-sun-200",
      )}
    >
      {children}
    </button>
  );
}

export function CameraStage({
  camera,
  recognising,
  onRecognising,
  recognitionAvailable,
  cameraId,
  onCameraId,
  showLandmarks,
  onShowLandmarks,
  showGuide,
  onShowGuide,
  serviceHost,
  subtitles,
  flash,
}: CameraStageProps) {
  const running = camera.status === "running";
  const { quality } = camera;
  const hint = !running
    ? null
    : camera.tracker === "loading"
      ? { tone: "busy", text: "Starting the hand tracker…" }
      : camera.tracker === "error"
        ? { tone: "error", text: "Hand tracking failed to start" }
        : quality.hands === 0
            ? { tone: "warn", text: "Raise your hands into the frame" }
            : quality.losingHand
              ? { tone: "warn", text: "Losing a hand: add light, or move away from the background" }
              : { tone: "ok", text: quality.hands === 2 ? "Tracking both hands" : "Tracking one hand" };

  return (
    <section
      aria-label="Camera"
      className="relative isolate flex h-full min-h-[28rem] flex-col overflow-hidden bg-paper-2"
    >
      <div aria-hidden className="absolute -top-20 -right-20 -z-10 size-52 rounded-full bg-forest-400" />
      <div aria-hidden className="absolute -bottom-16 -left-16 -z-10 size-44 rounded-full bg-bubblegum-400" />
      {/* top bar */}
      <div className="flex items-start justify-between gap-3 p-3 sm:p-4">
        <p className="flex items-center gap-2 rounded-full bg-navy py-2 pr-4 pl-3 text-[0.8125rem] font-bold text-white">
          {running ? (
            <span aria-hidden className="relative inline-flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-danger/50" />
              <span className="relative size-2.5 rounded-full bg-danger" />
            </span>
          ) : (
            <CameraOff className="size-4 text-white/75" aria-hidden />
          )}
          {running ? "Camera on" : "Camera off"}
          {running && camera.fps > 0 && <span className="font-semibold text-white/70">· {camera.fps} fps on-device</span>}
        </p>
        <div className="flex items-center gap-0.5 rounded-full bg-surface p-1 ring-2 ring-navy" role="toolbar" aria-label="Camera overlays">
          <ToolButton label={showLandmarks ? "Hide hand landmarks" : "Show hand landmarks"} pressed={showLandmarks} onClick={() => onShowLandmarks(!showLandmarks)}>
            <Spline aria-hidden />
          </ToolButton>
          <ToolButton label={showGuide ? "Hide framing guide" : "Show framing guide"} pressed={showGuide} onClick={() => onShowGuide(!showGuide)}>
            <Grid2x2 aria-hidden />
          </ToolButton>
        </div>
      </div>

      {/* viewport */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 sm:px-6">
        <div className="relative aspect-[3/4] w-full max-w-[min(100%,calc((100dvh-15rem)*16/9))] overflow-hidden rounded-[1.75rem] bg-surface ring-4 ring-navy sm:aspect-video">
          <video
            ref={camera.videoRef}
            playsInline
            muted
            aria-label="Your camera preview, mirrored"
            className={cn("absolute inset-0 h-full w-full -scale-x-100 object-cover", !running && "invisible")}
          />
          <canvas
            ref={camera.canvasRef}
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover", !running && "invisible")}
          />
          {running && showGuide && <FramingGuide highlight={quality.hands === 0 ? "hands" : "ok"} />}

          {running && hint && (
            <p
              role="status"
              className={cn(
                "absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] animate-pop items-center gap-2 rounded-full bg-surface/95 py-1.5 pr-3.5 pl-2.5 text-[0.8125rem] font-semibold shadow-sm",
                hint.tone === "warn" ? "text-gold-800" : hint.tone === "error" ? "text-danger" : hint.tone === "ok" ? "text-success" : "text-royal",
              )}
            >
              {hint.tone === "busy" ? (
                <SigningLoader label={hint.text} size="sm" decorative className="size-5" />
              ) : hint.tone === "warn" ? (
                <TriangleAlert className="size-4 shrink-0" aria-hidden />
              ) : hint.tone === "error" ? (
                <XCircle className="size-4 shrink-0" aria-hidden />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              )}
              {hint.text}
            </p>
          )}

          {/* live subtitles */}
          {running && (subtitles.length > 0 || flash) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6" aria-hidden>
              <p className="max-w-full rounded-[1.25rem] bg-navy px-5 py-2.5 text-center text-xl leading-snug font-extrabold tracking-[0.02em] text-white uppercase sm:text-[1.75rem]">
                {subtitles.map((w, i) => (
                  <span key={`${w}-${i}`} className={cn("mx-1.5 inline-block", i === subtitles.length - 1 && flash ? "text-gold" : "")}>
                    {w}
                  </span>
                ))}
              </p>
            </div>
          )}

          {!running && <CameraState camera={camera} />}
        </div>
      </div>

      {/* transport */}
      <div className="p-3 sm:p-4">
        <div className="focus-inverse mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-[1.75rem] bg-navy p-2 text-white sm:gap-3">
          {running ? (
            <button
              type="button"
              onClick={camera.stop}
              className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white/10 px-4 text-[0.9375rem] font-bold text-white hover:bg-white/15"
            >
              <CameraOff className="size-[1.125rem]" aria-hidden /> Stop camera
            </button>
          ) : (
            <button
              type="button"
              onClick={camera.start}
              disabled={camera.status === "requesting"}
              className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-forest-400 px-5 text-[0.9375rem] font-extrabold text-white ring-2 ring-forest-300 hover:bg-forest-500 disabled:opacity-60"
            >
              {camera.status === "requesting" ? <Loader2 className="size-[1.125rem] animate-spin" aria-hidden /> : <Power className="size-[1.125rem]" aria-hidden />}
              {camera.status === "requesting" ? "Waiting for permission…" : "Start camera"}
            </button>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={recognising && recognitionAvailable}
            disabled={!recognitionAvailable}
            onClick={() => onRecognising(!recognising)}
            className="press inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full px-3 text-[0.9375rem] font-semibold text-white/90 hover:bg-white/10 disabled:opacity-50"
          >
            <span
              aria-hidden
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                recognising && recognitionAvailable ? "bg-forest-300" : "bg-white/25",
              )}
            >
              <span
                className={cn(
                  "absolute size-4 rounded-full bg-white transition-transform",
                  recognising && recognitionAvailable ? "translate-x-[1.125rem] bg-navy" : "translate-x-0.5",
                )}
              />
            </span>
            {!recognitionAvailable ? "Recognition unavailable" : recognising ? "Recognising" : "Paused"}
          </button>

          <label className="flex min-w-[min(100%,11rem)] flex-1 items-center gap-2 text-[0.8125rem] text-white/70">
            <Camera className="size-4 shrink-0" aria-hidden />
            <span className="sr-only">Camera</span>
            <select
              value={cameraId ?? ""}
              onChange={(e) => onCameraId(e.target.value || null)}
              disabled={camera.devices.length === 0}
              className="h-11 w-full min-w-0 rounded-full bg-white/10 px-4 text-[0.875rem] text-white disabled:opacity-60 [&>option]:text-ink"
            >
              <option value="">Default camera</option>
              {camera.devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mx-auto mt-2.5 flex max-w-3xl items-start justify-center gap-1.5 text-center text-xs leading-5 font-medium text-ink-2">
          <Lock className="mt-0.5 size-3 shrink-0 text-forest-400" aria-hidden />
          <span>
            Video stays on this device. Only hand landmark positions are sent to{" "}
            <span className="font-medium text-ink-2">{serviceHost}</span>.
          </span>
        </p>
      </div>
    </section>
  );
}

function StateBody({ icon, title, children, tone = "neutral" }: { icon: ReactNode; title: string; children?: ReactNode; tone?: "neutral" | "warning" | "danger" }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <span
        className={cn(
          "inline-flex size-16 items-center justify-center rounded-full [&_svg]:size-7",
          tone === "danger" && "bg-danger-bg text-danger",
          tone === "warning" && "bg-sun-400 text-navy",
          tone === "neutral" && "bg-cobalt-100 text-cobalt-800",
        )}
      >
        {icon}
      </span>
      <p className="mt-4 text-2xl font-extrabold tracking-[-0.035em] text-navy" role="status">
        {title}
      </p>
      {children && <div className="mt-2 max-w-md text-[0.9375rem] leading-6 text-ink-2">{children}</div>}
    </div>
  );
}

function CameraState({ camera }: { camera: CameraTracking }) {
  switch (camera.status) {
    case "requesting":
      return (
        <StateBody icon={<SigningLoader label="Waiting for camera permission" decorative className="size-9" />} title="Waiting for camera permission">
          Your browser is asking whether Parlance may use the camera. Choose Allow to continue.
        </StateBody>
      );
    case "denied":
      return (
        <StateBody icon={<ShieldAlert />} title="Camera access is blocked" tone="danger">
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-left">
            <li>Open the site settings icon in your browser&rsquo;s address bar.</li>
            <li>Set Camera to Allow for this site.</li>
            <li>Press Start camera again.</li>
          </ol>
        </StateBody>
      );
    case "unavailable":
      return (
        <StateBody icon={<VideoOff />} title="No camera available" tone="warning">
          {camera.errorDetail ?? "Connect a camera, or check that your system settings allow this browser to use it."}
        </StateBody>
      );
    case "in-use":
      return (
        <StateBody icon={<VideoOff />} title="The camera is in use elsewhere" tone="warning">
          Another app or tab is using the camera. Close it, then press Start camera again.
        </StateBody>
      );
    case "error":
      return (
        <StateBody icon={<VideoOff />} title="The camera couldn't start" tone="danger">
          {camera.errorDetail ?? "Try again, or choose a different camera."}
        </StateBody>
      );
    default:
      if (camera.permission === "denied") {
        return (
          <StateBody icon={<ShieldAlert />} title="Camera access is blocked for this site" tone="danger">
            Allow the camera in your browser&rsquo;s site settings, then press Start camera.
          </StateBody>
        );
      }
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative w-48 sm:w-60" aria-hidden>
            <RainbowArch rings={5} opening={0.5} offset={4} className="w-full" />
            <Pal pose="rest" outfit="cobalt" skin="deep" hair="curly" className="absolute bottom-0 left-1/2 h-[62%] -translate-x-1/2" />
            <WavingHand color="sun" cuff="#233059" motion="bounce" className="absolute bottom-0 left-[4%] h-[46%]" />
            <WavingHand color="bubblegum" cuff="#3C5A99" motion="bounce" className="absolute right-[4%] bottom-0 h-[46%] -scale-x-100" style={{ animationDelay: "-0.6s" }} />
          </div>
          <p className="mt-5 text-2xl font-extrabold tracking-[-0.035em] text-navy sm:text-[1.75rem]">Sign to the camera</p>
          <p className="mt-2 max-w-sm text-[0.9375rem] leading-6 text-ink-2">
            Press Start camera, stand about an arm&rsquo;s length back, and sign one word at a time.
          </p>
        </div>
      );
  }
}
