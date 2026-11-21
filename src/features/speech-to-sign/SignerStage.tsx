/**
 * The Speech → Sign stage: the signer large, between the Parlance arcs, with a
 * big caption, a clickable gloss rail, a floating toolbar and a dark transport.
 */
import { useReducer, useRef } from "react";
import { Check, Expand, FlipHorizontal2, Hand, MessageCircle, Pause, PersonStanding, Play, Repeat, RotateCcw, Shrink } from "lucide-react";
import { RainbowWindow } from "@/components/brand/RainbowWindow";
import { AvatarViewport } from "@/components/avatar/AvatarViewport";
import { SigningLoader } from "@/components/ui/SigningLoader";
import type { PlayerState, QueueItem, SignPlayer } from "@/avatar/playback";
import { useFullscreen } from "@/hooks/useFullscreen";
import { cn } from "@/lib/cn";
import { useSettings, type AvatarView, type PlaybackSpeed } from "@/stores/settings";
import { avatarKey, statusOf } from "@/learn/reviews";
import { useReviewSummaries } from "@/features/learn/ReviewBadge";

interface SignerStageProps {
  queue: readonly QueueItem[];
  loading: boolean;
  state: PlayerState;
  onState: (state: PlayerState) => void;
  player: SignPlayer | null;
  onPlayer: (player: SignPlayer | null) => void;
}

function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

export function SignerStage({ queue, loading, state, onState, player, onPlayer }: SignerStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const view = useSettings((s) => s.avatarView);
  const speed = useSettings((s) => s.playbackSpeed);
  const loop = useSettings((s) => s.loop);
  const mirror = useSettings((s) => s.mirror);
  const showCaptions = useSettings((s) => s.showCaptions);
  const set = useSettings((s) => s.set);

  const summaries = useReviewSummaries();
  const has = queue.length > 0;
  const index = has ? Math.min(state.index, queue.length - 1) : 0;
  const current = has ? queue[index] : null;
  const overall = has ? (index + (state.finished ? 1 : state.progress)) / queue.length : 0;

  const status = loading
    ? "Preparing signs"
    : !has
      ? "Waiting for a message"
      : state.playing
        ? `Signing ${index + 1} of ${queue.length}`
        : state.finished
          ? "Finished"
          : "Paused";

  const statusIcon = loading ? (
    <SigningLoader label={status} size="sm" decorative inverse className="size-5" />
  ) : !has ? (
    <MessageCircle className="size-4 text-white/75" aria-hidden />
  ) : state.playing ? (
    <span aria-hidden className="relative inline-flex size-2.5">
      <span className="absolute inset-0 animate-ping rounded-full bg-gold/70" />
      <span className="relative size-2.5 rounded-full bg-gold" />
    </span>
  ) : state.finished ? (
    <Check className="size-4 text-forest-300" aria-hidden />
  ) : (
    <Pause className="size-4 text-sun-400" aria-hidden />
  );

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative isolate flex h-full min-h-[26rem] flex-col overflow-hidden bg-paper-2",
        fullscreen.active && "min-h-screen",
      )}
    >
      <div aria-hidden className="absolute -top-20 -left-20 -z-10 size-52 rounded-full bg-tangerine-400" />
      <div aria-hidden className="absolute -right-16 bottom-28 -z-10 size-40 rounded-full bg-sun-400" />

      {/* top bar: status + toolbar */}
      <div className="relative z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
        <p
          className="flex min-w-0 items-center gap-2 rounded-full bg-navy py-2 pr-4 pl-3 text-[0.8125rem] font-bold whitespace-nowrap text-white"
          role="status"
        >
          <span className="inline-flex size-5 shrink-0 items-center justify-center">{statusIcon}</span>
          <span className="truncate">{status}</span>
        </p>
        <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-surface p-1 ring-2 ring-navy" role="toolbar" aria-label="Signer view">
          <ToolButton label="Whole signer, including the face" pressed={view === "figure"} onClick={() => set("avatarView", "figure" as AvatarView)}>
            <PersonStanding aria-hidden />
          </ToolButton>
          <ToolButton label="Hands focus" pressed={view === "hands"} onClick={() => set("avatarView", "hands" as AvatarView)}>
            <Hand aria-hidden />
          </ToolButton>
          <span aria-hidden className="mx-1 h-6 w-px bg-line" />
          <ToolButton label={mirror ? "Mirrored view on" : "Mirror the signer"} pressed={mirror} onClick={() => set("mirror", !mirror)}>
            <FlipHorizontal2 aria-hidden />
          </ToolButton>
          <ToolButton label={loop ? "Looping on" : "Loop the phrase"} pressed={loop} onClick={() => set("loop", !loop)}>
            <Repeat aria-hidden />
          </ToolButton>
          {fullscreen.supported && (
            <ToolButton label={fullscreen.active ? "Exit full screen" : "Full screen"} onClick={fullscreen.toggle}>
              {fullscreen.active ? <Shrink aria-hidden /> : <Expand aria-hidden />}
            </ToolButton>
          )}
        </div>
      </div>

      {/* The signer stands in a still rainbow window: plain white behind the
          hands and face, colour only at the edges. Faded for the hands view,
          where the hands fill more of the stage. */}
      <div className="relative min-h-0 flex-1">
        <RainbowWindow
          rings={5}
          band={40}
          fill="#FFFFFF"
          className={cn(
            "absolute top-0 bottom-0 left-1/2 w-[min(92%,30rem)] -translate-x-1/2 transition-opacity duration-300",
            view === "hands" && "opacity-35",
          )}
        />
        <div className="absolute inset-0">
          <AvatarViewport
            queue={queue}
            mirror={mirror}
            presentation={view}
            playbackSpeed={speed}
            loop={loop}
            onState={onState}
            onPlayer={onPlayer}
            label={current ? `3D signer ${current.kind === "fingerspelling" ? "spelling" : "performing"} ${current.label.toUpperCase()}. Drag sideways to turn the signer.` : "3D signer, idle. Drag sideways to turn the signer."}
          />
        </div>
        {loading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <SigningLoader
              label="Preparing signs"
              size="sm"
              layout="inline"
              live={false}
              className="animate-pop rounded-full bg-surface px-4 py-2 ring-2 ring-navy"
            />
          </div>
        )}
        {!has && !loading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <p className="max-w-sm animate-pop rounded-[1.25rem] rounded-b-md bg-sun-400 px-4 py-2.5 text-center text-[0.9375rem] leading-6 font-bold text-navy">
              Type or say a message, and the signer will perform it in ISL.
            </p>
          </div>
        )}
      </div>

      {/* caption + gloss rail */}
      {has && (
        <div className="relative z-10 min-w-0 px-3 pb-2 text-center">
          {showCaptions && current && (
            <>
              <p key={`${index}-${current.label}`} className="animate-pop text-[2.5rem] leading-none font-extrabold tracking-[-0.03em] text-navy uppercase sm:text-[3.25rem]">
                {current.label}
              </p>
              <p className="mt-2 inline-flex items-center rounded-full bg-surface px-3 py-0.5 text-[0.8125rem] font-bold text-ink-2">
                {current.missing ? "No sign in the library yet, shown as text" : state.transitioning ? "Moving to the next sign" : current.kind === "fingerspelling" ? `Spelling letter by letter · ${index + 1} of ${queue.length}` : `Sign ${index + 1} of ${queue.length}`}
              </p>
              {(() => {
                const summary = summaries.get(avatarKey(current.gloss));
                if (statusOf(summary) !== "flagged") return null;
                const note = summary?.notes.find((n) => n.verdict === "wrong");
                return (
                  <p className="mx-auto mt-2 max-w-md rounded-md bg-danger-bg px-3 py-1.5 text-[0.8125rem] leading-5 text-danger" role="note">
                    A review flagged this animation as wrong{note ? `: “${note.note}”` : "."}
                  </p>
                );
              })()}
            </>
          )}
          <ol className="mt-3 flex flex-wrap items-start justify-center gap-1.5" aria-label="Signs in this phrase">
            {queue.map((item, i) => {
              const now = i === index;
              return (
                <li key={`${item.gloss}-${i}`}>
                  <button
                    type="button"
                    aria-current={now ? "step" : undefined}
                    onClick={() => {
                      player?.step(i);
                      player?.play();
                      rerender();
                    }}
                    className={cn(
                      "press inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold tracking-[0.05em] uppercase",
                      item.missing
                        ? "border-2 border-dashed border-ink-3/60 bg-surface/70 text-ink-3 line-through"
                        : now
                          ? "bg-navy text-white"
                          : "bg-surface text-navy ring-2 ring-navy/15 hover:bg-sun-100",
                    )}
                  >
                    {now && !item.missing && <span aria-hidden className="size-2 rounded-full bg-gold" />}
                    {item.label}
                    {item.missing && <span className="sr-only"> (no sign yet)</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* transport */}
      <div className="relative z-10 px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="focus-inverse mx-auto flex max-w-2xl items-center gap-2 rounded-full bg-navy p-1.5 text-white sm:gap-3 sm:p-2">
          <button
            type="button"
            disabled={!has || !player}
            onClick={() => {
              player?.toggle();
              rerender();
            }}
            className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sun-400 text-navy hover:bg-sun-300 disabled:bg-white/20 disabled:text-white/60"
            aria-label={state.playing ? "Pause signing" : "Play signing"}
          >
            {state.playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 translate-x-px" aria-hidden />}
          </button>
          <button
            type="button"
            disabled={!has || !player}
            onClick={() => {
              player?.restart();
              rerender();
            }}
            className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full text-white/85 hover:bg-white/10 disabled:opacity-40"
            aria-label="Replay from the start"
            title="Replay from the start"
          >
            <RotateCcw className="size-[1.125rem]" aria-hidden />
          </button>
          <div
            className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label="Phrase progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(overall * 100)}
          >
            {/* The progress fill is a slice of the rainbow. */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-100 ease-linear"
              style={{ width: `${overall * 100}%` }}
            >
              <div className="h-full w-[min(42rem,70vw)] bg-[linear-gradient(90deg,var(--color-tangerine-400),var(--color-sun-400),var(--color-forest-300),var(--color-cobalt-300),var(--color-bubblegum-400))]" />
            </div>
          </div>
          <span className="hidden w-12 shrink-0 text-right text-[0.8125rem] font-semibold tabular-nums text-white/75 sm:block">
            {has ? `${index + 1}/${queue.length}` : "0/0"}
          </span>
          <div role="group" aria-label="Playback speed" className="flex shrink-0 items-center rounded-full bg-white/10 p-0.5">
            {([0.5, 0.75, 1] as PlaybackSpeed[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={speed === value}
                aria-label={value === 1 ? "Normal speed" : `${value} times speed`}
                onClick={() => set("playbackSpeed", value)}
                className={cn(
                  "press h-9 rounded-full px-2 text-[0.8125rem] font-semibold tabular-nums sm:px-2.5",
                  speed === value ? "bg-white text-navy" : "text-white/75 hover:text-white",
                )}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
