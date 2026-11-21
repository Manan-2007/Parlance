/**
 * Video sign reading: a short clip of camera frames around one finished sign is
 * sent to the app server's `/api/sign-video`, which asks a vision model (Gemini,
 * or an Azure OpenAI vision deployment) which ISL word it shows.
 *
 * Frames are captured only while the user has turned the mode on, kept in memory
 * for a few seconds, and never stored.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Suggestion } from "./useRecognitionService";

export interface VideoAvailability {
  available: boolean;
  provider: "gemini" | "azure" | null;
}

export interface VideoReading {
  word: string | null;
  confidence: number;
  provider: string;
  ms: number;
}

export const PROVIDER_NAMES: Record<string, string> = { gemini: "Google Gemini", azure: "Azure OpenAI" };

let availability: Promise<VideoAvailability> | null = null;

export function videoAvailability(): Promise<VideoAvailability> {
  availability ??= fetch("/api/sign-video")
    .then((response) => (response.ok ? response.json() : { available: false, provider: null }))
    .catch(() => ({ available: false, provider: null }));
  return availability;
}

export function useVideoAvailability(): VideoAvailability | null {
  const [state, setState] = useState<VideoAvailability | null>(null);
  useEffect(() => {
    let live = true;
    void videoAvailability().then((value) => live && setState(value));
    return () => {
      live = false;
    };
  }, []);
  return state;
}

export async function readSignFromVideo(frames: string[], hints: Suggestion[], signal?: AbortSignal): Promise<VideoReading> {
  const response = await fetch("/api/sign-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frames, hints: hints.slice(0, 5) }),
    signal,
  });
  if (!response.ok) throw new Error(`Video reading failed (${response.status})`);
  return (await response.json()) as VideoReading;
}

const CAPTURE_INTERVAL_MS = 125;
const KEEP_MS = 6000;
const WIDTH = 512;
const MAX_FRAMES = 12;

interface Frame {
  at: number;
  blob: Blob;
}

function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Keeps the last few seconds of camera frames (8 per second, 512 px JPEG) while
 * `enabled`, timestamped with `performance.now()` like the recognition frames.
 */
export function useSignClips(videoRef: React.RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const frames = useRef<Frame[]>([]);

  useEffect(() => {
    frames.current = [];
    if (!enabled) return;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    let busy = false;
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (!context || busy || !video || video.readyState < 2 || !video.videoWidth) return;
      canvas.width = WIDTH;
      canvas.height = Math.round((WIDTH * video.videoHeight) / video.videoWidth / 2) * 2;
      const at = performance.now();
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      busy = true;
      canvas.toBlob(
        (blob) => {
          busy = false;
          if (!blob) return;
          frames.current.push({ at, blob });
          const cutoff = performance.now() - KEEP_MS;
          while (frames.current.length && frames.current[0].at < cutoff) frames.current.shift();
        },
        "image/jpeg",
        0.72,
      );
    }, CAPTURE_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      frames.current = [];
    };
  }, [enabled, videoRef]);

  /** Up to 12 evenly spaced frames covering [start, end], as base64 JPEG. */
  const clip = useCallback(async (start: number, end: number): Promise<string[]> => {
    const inside = frames.current.filter((frame) => frame.at >= start - 250 && frame.at <= end + 250);
    const step = Math.max(1, inside.length / MAX_FRAMES);
    const picked: Frame[] = [];
    for (let i = 0; i < inside.length && picked.length < MAX_FRAMES; i += step) picked.push(inside[Math.floor(i)]);
    return Promise.all(picked.map((frame) => base64(frame.blob)));
  }, []);

  return clip;
}
