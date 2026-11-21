/**
 * Capture one sign from the camera: countdown, then record from the moment a
 * hand rises into the signing space until the hands come down. Frames are
 * format-2 motion frames at ~15 fps (the library's rate). Shared by camera
 * practice and by recording a sign in Teach.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ResultMessage } from "@/engine/workers/mediapipe.worker";
import { anchorOf, liveFrame, raisedHands, type Anchor } from "@/learn/motion";
import { useCameraTracking } from "@/services/camera/useCameraTracking";
import { useSettings } from "@/stores/settings";

export type CapturePhase = "off" | "starting" | "ready" | "countdown" | "waiting" | "recording" | "done";

const KEEP_MS = 60;
const STILL_MS = 750;
const WAIT_MS = 8000;

interface Options {
  /** Longest attempt before recording stops by itself. */
  maxMs: number;
  onCaptured: (frames: Float32Array[]) => void;
  /** Nobody raised a hand within a few seconds of "sign now". */
  onTimeout: () => void;
  /** Also forward the recogniser's vectors (for an optional VOX check). */
  onVector?: (vector: Float32Array) => void;
  sendVectors?: boolean;
}

export function useSignCapture({ maxMs, onCaptured, onTimeout, onVector, sendVectors = false }: Options) {
  const cameraId = useSettings((s) => s.cameraId);
  const setSetting = useSettings((s) => s.set);
  const [phase, setPhase] = useState<CapturePhase>("off");
  const phaseRef = useRef<CapturePhase>("off");
  const go = useCallback((next: CapturePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const [count, setCount] = useState(3);
  const [live, setLive] = useState<{ frame: Float32Array; anchor: Anchor | null } | null>(null);

  const recent = useRef<Float32Array[]>([]);
  const preRoll = useRef<Float32Array[]>([]);
  const recorded = useRef<Float32Array[]>([]);
  const lastKept = useRef(0);
  const lastActive = useRef(0);
  const startedAt = useRef(0);
  const lastLive = useRef(0);
  const timers = useRef<number[]>([]);
  const callbacks = useRef({ onCaptured, onTimeout, maxMs });
  callbacks.current = { onCaptured, onTimeout, maxMs };

  const finish = useCallback(() => {
    const frames = recorded.current;
    recorded.current = [];
    go("done");
    callbacks.current.onCaptured(frames);
  }, [go]);

  const onResult = useCallback(
    (msg: ResultMessage) => {
      const frame = liveFrame(msg.vector, msg.world, msg.pose, msg.aspect);
      const now = performance.now();
      const buffer = recent.current;
      buffer.push(frame);
      if (buffer.length > 24) buffer.shift();
      if (now - lastLive.current > 45) {
        lastLive.current = now;
        setLive({ frame, anchor: anchorOf(buffer) });
      }
      const current = phaseRef.current;
      if (current !== "waiting" && current !== "recording") return;
      if (now - lastKept.current < KEEP_MS) return;
      lastKept.current = now;
      const up = raisedHands(frame) > 0;
      if (current === "waiting") {
        preRoll.current.push(frame);
        if (preRoll.current.length > 3) preRoll.current.shift();
        if (up) {
          recorded.current = [...preRoll.current];
          startedAt.current = now;
          lastActive.current = now;
          go("recording");
        }
        return;
      }
      recorded.current.push(frame);
      if (up) lastActive.current = now;
      const still = now - lastActive.current > STILL_MS && recorded.current.length >= 8;
      if (still || now - startedAt.current > callbacks.current.maxMs) finish();
    },
    [go, finish],
  );

  const camera = useCameraTracking({
    onVector: onVector ?? (() => {}),
    sending: sendVectors && (phase === "waiting" || phase === "recording"),
    showLandmarks: false,
    cameraId,
    onCameraMissing: () => setSetting("cameraId", null),
    onResult,
    bodyTracking: true,
  });

  const cameraReady = camera.status === "running" && camera.tracker === "ready";
  const failed = camera.status === "denied" || camera.status === "unavailable" || camera.status === "in-use" || camera.status === "error" || camera.tracker === "error";
  useEffect(() => {
    if (phase === "starting" && cameraReady) go("ready");
    if (phase !== "off" && failed) go("off");
  }, [phase, cameraReady, failed, go]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const startCamera = useCallback(() => {
    camera.start();
    go("starting");
  }, [camera, go]);

  const record = useCallback(() => {
    clearTimers();
    setCount(3);
    go("countdown");
    [1, 2, 3].forEach((n) => {
      timers.current.push(
        window.setTimeout(() => {
          if (n < 3) {
            setCount(3 - n);
            return;
          }
          preRoll.current = [];
          recorded.current = [];
          go("waiting");
          timers.current.push(
            window.setTimeout(() => {
              if (phaseRef.current !== "waiting") return;
              go("done");
              callbacks.current.onTimeout();
            }, WAIT_MS),
          );
        }, n * 700),
      );
    });
  }, [go]);

  const stopEarly = useCallback(() => {
    if (phaseRef.current === "recording") finish();
  }, [finish]);

  /** Back to "ready" (camera still on), e.g. when the sign being practised changes. */
  const reset = useCallback(() => {
    clearTimers();
    if (phaseRef.current !== "off" && phaseRef.current !== "starting") go("ready");
  }, [go]);

  const cameraError =
    camera.status === "denied"
      ? "Camera access is blocked. Allow it in your browser's site settings, then try again."
      : camera.status === "unavailable"
        ? "No camera was found."
        : camera.status === "in-use"
          ? "The camera is being used by another app."
          : camera.tracker === "error"
            ? "Hand tracking could not start on this device."
            : camera.status === "error"
              ? "The camera could not start."
              : null;

  return { camera, phase, count, live, record, stopEarly, startCamera, reset, cameraError };
}
