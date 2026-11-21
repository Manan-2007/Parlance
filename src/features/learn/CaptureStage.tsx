/**
 * The learner's side of the camera: their tracked hands as a figure, a small
 * mirrored camera preview, and the start / countdown / recording overlays.
 */
import { Camera, CameraOff, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Anchor } from "@/learn/motion";
import { cn } from "@/lib/cn";
import { SignFigure } from "./SignFigure";
import type { useSignCapture } from "./useSignCapture";

interface CaptureStageProps {
  capture: ReturnType<typeof useSignCapture>;
  /** Show this frame instead of the live one (replays). */
  frame?: Float32Array | null;
  anchor?: Anchor | null;
  mirror: boolean;
  label?: string;
  className?: string;
  idleText?: string;
}

export function CaptureStage({ capture, frame, anchor, mirror, label = "You", className, idleText }: CaptureStageProps) {
  const { camera, phase, count, live, cameraError } = capture;
  const shown = frame !== undefined ? frame : live?.frame ?? null;
  const shownAnchor = frame !== undefined ? anchor ?? null : live?.anchor ?? null;
  return (
    <figure className={cn("relative aspect-[4/3] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#fffdf6,#fbf1cf)] ring-1 ring-gold-300", className)}>
      <SignFigure frame={shown} anchor={shownAnchor} tone="you" mirror={mirror} label="Your hands, as tracked" className="absolute inset-0" />
      <figcaption className="absolute top-2.5 left-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-[0.75rem] font-semibold text-gold-800 shadow-xs">{label}</figcaption>
      <video
        ref={camera.videoRef}
        muted
        playsInline
        aria-hidden
        className={cn(
          "absolute right-2 bottom-2 w-[32%] -scale-x-100 rounded-lg object-cover ring-2 ring-white transition-opacity",
          camera.status === "running" ? "opacity-100" : "opacity-0",
        )}
      />
      <canvas ref={camera.canvasRef} className="hidden" aria-hidden />

      {phase === "off" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/70 p-4 text-center backdrop-blur-[2px]">
          {cameraError ? <CameraOff className="size-6 text-danger" aria-hidden /> : <Camera className="size-6 text-royal" aria-hidden />}
          <p className="max-w-[16rem] text-[0.8125rem] leading-5 text-ink-2">
            {cameraError ?? idleText ?? "Turn on the camera. Video stays on this device and is never recorded."}
          </p>
          <Button size="sm" onClick={capture.startCamera} leading={<Video aria-hidden />}>
            {cameraError ? "Try again" : "Start camera"}
          </Button>
        </div>
      )}
      {phase === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/70 text-[0.8125rem] text-ink-2">
          <Loader2 className="size-5 animate-spin text-royal" aria-hidden />
          {camera.tracker === "loading" ? "Loading hand tracking…" : "Starting the camera…"}
        </div>
      )}
      {phase === "countdown" && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy/25" aria-live="assertive">
          <span className="text-[4rem] leading-none font-semibold text-white drop-shadow tabular-nums">{count}</span>
        </div>
      )}
      {phase === "waiting" && (
        <p className="absolute bottom-2 left-2 w-[62%] rounded-md bg-navy/85 px-2.5 py-1.5 text-[0.75rem] font-medium text-white" aria-live="polite">
          Sign now. Lower your hands when you finish.
        </p>
      )}
      {phase === "recording" && (
        <p className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-danger px-2.5 py-1 text-[0.75rem] font-semibold text-white" aria-live="polite">
          <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden /> Recording
        </p>
      )}
    </figure>
  );
}
