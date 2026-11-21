import { useEffect, useRef, useState } from "react";
import { MonitorX } from "lucide-react";
import { createAvatar, type AvatarPlayer } from "@/avatar/player.js";
import type { PlayerState, Presentation, QueueItem, SignPlayer } from "@/avatar/playback";
import { SigningLoader } from "@/components/ui/SigningLoader";
import { cn } from "@/lib/cn";

interface AvatarViewportProps {
  queue?: readonly QueueItem[];
  mirror?: boolean;
  presentation?: Presentation;
  playbackSpeed?: number;
  loop?: boolean;
  suspended?: boolean;
  onState?: (state: PlayerState) => void;
  onPlayer?: (player: SignPlayer | null) => void;
  interactive?: boolean;
  label: string;
  /** Use the calm loading indicator (for neutral surfaces). */
  quietLoader?: boolean;
  className?: string;
}

export function AvatarViewport({
  queue, mirror = false, presentation = "figure", playbackSpeed = 1,
  loop = false, suspended = false, onState, onPlayer, interactive = true, label, quietLoader = false, className,
}: AvatarViewportProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<AvatarPlayer | null>(null);
  const callbacks = useRef({ onState, onPlayer });
  callbacks.current = { onState, onPlayer };
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    setStatus("loading");
    const player = createAvatar(mount, {
      interactive,
      onState: (state) => callbacks.current.onState?.(state),
      onStatus: (status) => {
        setStatus(status);
        callbacks.current.onPlayer?.(status === "ready" ? player : null);
      },
    });
    playerRef.current = player;
    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [interactive, attempt]);

  useEffect(() => {
    playerRef.current?.setQueue(queue ?? []);
  }, [queue, interactive, attempt]);

  useEffect(() => {
    playerRef.current?.setOptions({ mirror, presentation, speed: playbackSpeed, loop, suspended });
  }, [mirror, presentation, playbackSpeed, loop, suspended, interactive, attempt]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div ref={mountRef} role="img" aria-label={label} data-avatar-status={status}
        className={cn("absolute inset-0", interactive && "touch-pan-y cursor-grab active:cursor-grabbing")} />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <SigningLoader
            label="Loading the 3D signer"
            tone={quietLoader ? "quiet" : "bright"}
            className="rounded-3xl bg-surface/85 px-5 py-4 shadow-card backdrop-blur-sm"
          />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-tangerine-100 text-tangerine-800">
            <MonitorX className="size-6" aria-hidden />
          </span>
          <p className="text-[0.9375rem] font-semibold text-navy" role="status">The 3D signer could not load.</p>
          <button
            className="press inline-flex h-10 items-center rounded-full bg-royal px-5 text-sm font-semibold text-white hover:bg-brand-700"
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
