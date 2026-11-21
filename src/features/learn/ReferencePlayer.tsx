/**
 * Plays one or more ISLRTC recordings as a figure, with the controls a learner
 * needs: pause, replay, slow down, mirror.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FlipHorizontal2, Pause, Play, RotateCcw } from "lucide-react";
import type { SignMotion } from "@/engine/avatar/signMotion";
import { anchorOf, frozenBlocks, type Anchor } from "@/learn/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { useLearn, type LearnSpeed } from "@/stores/learn";
import { SignFigure } from "./SignFigure";
import { sourceLabel, useSignMotions } from "./signData";

const GAP_MS = 450;

interface Track {
  motion: SignMotion;
  anchor: Anchor | null;
  hide: [boolean, boolean];
  durationMs: number;
}

/** Drive a list of recordings on a single clock. */
function usePlayback(tracks: Track[], { speed, loop, autoPlay }: { speed: number; loop: boolean; autoPlay: boolean }) {
  const [playing, setPlaying] = useState(autoPlay);
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  const total = tracks.reduce((sum, t) => sum + t.durationMs + GAP_MS, 0);
  const key = tracks.map((t) => t.motion.gloss).join(" ");

  useEffect(() => {
    timeRef.current = 0;
    setTime(0);
    setPlaying(autoPlay);
  }, [key, autoPlay]);

  useEffect(() => {
    if (!playing || !total) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(100, now - last) * speed;
      last = now;
      let next = timeRef.current + dt;
      if (next >= total) {
        if (loop) next %= total;
        else {
          timeRef.current = total - GAP_MS;
          setTime(timeRef.current);
          setPlaying(false);
          return;
        }
      }
      timeRef.current = next;
      setTime(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, total, speed, loop]);

  // Which recording, and which frame of it, the clock is on.
  let start = 0;
  let index = 0;
  for (; index < tracks.length - 1; index += 1) {
    if (time < start + tracks[index]!.durationMs + GAP_MS) break;
    start += tracks[index]!.durationMs + GAP_MS;
  }
  const track = tracks[index];
  let frame: Float32Array | null = null;
  if (track) {
    const local = Math.max(0, Math.min(track.durationMs, time - start));
    const position = Math.min(track.motion.frames.length - 1, Math.floor((local / track.durationMs) * track.motion.frames.length));
    frame = track.motion.frames[position] ?? null;
  }
  const restart = () => {
    timeRef.current = 0;
    setTime(0);
    setPlaying(true);
  };
  return { frame, index, track, playing, setPlaying, restart, progress: total ? time / total : 0 };
}

interface ReferencePlayerProps {
  glosses: readonly string[];
  autoPlay?: boolean;
  loop?: boolean;
  /** Visible label under the figure for the sign on screen; omit to hide (quizzes). */
  caption?: (gloss: string, index: number) => ReactNode;
  label: string;
  compact?: boolean;
  className?: string;
  /** Extra controls placed in the toolbar. */
  toolbar?: ReactNode;
}

export function ReferencePlayer({ glosses, autoPlay = true, loop = true, caption, label, compact, className, toolbar }: ReferencePlayerProps) {
  const reduced = useReducedMotion();
  const speed = useLearn((s) => s.speed);
  const mirror = useLearn((s) => s.mirror);
  const setPreference = useLearn((s) => s.setPreference);
  const { motions, loading } = useSignMotions(glosses);
  const tracks = useMemo<Track[]>(
    () =>
      motions
        .filter((m): m is SignMotion => Boolean(m && m.frames.length))
        .map((motion) => ({
          motion,
          anchor: anchorOf(motion.frames),
          hide: frozenBlocks(motion.frames),
          durationMs: (motion.frames.length / (motion.fps || 15)) * 1000 * 1.1,
        })),
    [motions],
  );
  const playback = usePlayback(tracks, { speed, loop, autoPlay: autoPlay && !reduced });
  const missing = !loading && tracks.length === 0;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn("relative overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))] ring-1 ring-sky-200", compact ? "aspect-[4/3]" : "aspect-[4/3] sm:aspect-[16/11]")}>
        {missing ? (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink-3">This recording could not be loaded.</p>
        ) : (
          <SignFigure
            frame={playback.frame}
            anchor={playback.track?.anchor ?? null}
            hide={playback.track?.hide}
            mirror={mirror}
            label={label}
            className="absolute inset-0"
          />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-surface/90 px-2.5 py-1 text-[0.75rem] font-semibold text-navy shadow-xs">
          {sourceLabel(playback.track?.motion.gloss ?? glosses[0] ?? "")}
        </span>
        {playback.track?.hide.some(Boolean) && (
          <span className="absolute right-3 bottom-3 left-3 rounded-md bg-surface/90 px-3 py-1.5 text-center text-[0.75rem] leading-4 text-ink-2">
            The recording lost track of one hand. Check the official video for it.
          </span>
        )}
      </div>
      {caption && playback.track && <div className="mt-3 text-center">{caption(playback.track.motion.gloss, playback.index)}</div>}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => (playback.playing ? playback.setPlaying(false) : playback.progress > 0.98 ? playback.restart() : playback.setPlaying(true))}
          disabled={!tracks.length}
          aria-label={playback.playing ? "Pause" : "Play"}
          className="inline-flex size-10 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-royal disabled:opacity-40"
        >
          {playback.playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4 translate-x-px" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={playback.restart}
          disabled={!tracks.length}
          aria-label="Replay from the start"
          title="Replay"
          className="inline-flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-subtle hover:text-navy disabled:opacity-40"
        >
          <RotateCcw className="size-4" aria-hidden />
        </button>
        <div role="group" aria-label="Playback speed" className="flex items-center rounded-full bg-subtle p-0.5">
          {([0.5, 0.75, 1] as LearnSpeed[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={speed === value}
              onClick={() => setPreference("speed", value)}
              className={cn(
                "h-8 rounded-full px-2.5 text-[0.8125rem] font-medium tabular-nums transition-colors",
                speed === value ? "bg-navy text-white" : "text-ink-2 hover:text-navy",
              )}
            >
              {value}×
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={mirror}
          onClick={() => setPreference("mirror", !mirror)}
          title="Mirror: the signer's right hand appears on your right, so you can copy it like a mirror"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium transition-colors",
            mirror ? "bg-brand-50 text-royal" : "text-ink-2 hover:bg-subtle",
          )}
        >
          <FlipHorizontal2 className="size-4" aria-hidden /> Mirror
        </button>
        {toolbar}
      </div>
    </div>
  );
}
