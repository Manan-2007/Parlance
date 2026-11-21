/**
 * App-wide sound alert: when Parlance hears a chosen sound, the whole screen
 * flashes (a steady colour with reduced motion) until dismissed. Mounted in
 * the app shell, so it appears on any page while listening.
 */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AudioLines, BellRing } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { SOUND_GROUPS } from "@/lib/soundAlerts";
import { useSoundRuntime } from "@/services/sound/useSoundAlerts";

export function SoundAlertLayer() {
  const current = useSoundRuntime((s) => s.current);
  const dismiss = useSoundRuntime((s) => s.dismiss);
  const reduced = useReducedMotion();
  const button = useRef<HTMLButtonElement>(null);
  const group = current ? SOUND_GROUPS.find((g) => g.id === current.group) : undefined;

  useEffect(() => {
    if (!current) return;
    button.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, dismiss]);

  if (!current || !group) return null;
  const urgent = Boolean(group.urgent);
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sound-alert-title"
      className={cn("fixed inset-0 z-[70] flex flex-col items-center justify-center px-6 text-center", urgent ? "bg-danger text-white" : "bg-sun-400 text-navy")}
    >
      {!reduced && <div aria-hidden className={cn("absolute inset-0 animate-alert-flash", urgent ? "bg-tomato-400" : "bg-surface")} />}
      <div className="relative flex flex-col items-center">
        <span className={cn("inline-flex size-24 items-center justify-center rounded-full", urgent ? "bg-white text-danger" : "bg-navy text-white")}>
          <BellRing className="size-11" aria-hidden />
        </span>
        <p className="mt-6 text-sm font-bold opacity-80">{current.test ? "Test alert" : `Heard at ${new Date(current.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}</p>
        <h2 id="sound-alert-title" className={cn("mt-2 text-[clamp(2.75rem,10vw,6rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance", urgent ? "text-white" : "text-navy")}>
          {group.alert}
        </h2>
        <p lang="hi" className="mt-3 text-[clamp(1.5rem,4.5vw,2.5rem)] font-bold opacity-85">
          {group.hi}
        </p>
        <button
          ref={button}
          type="button"
          onClick={dismiss}
          className={cn("press mt-10 inline-flex h-14 items-center rounded-full px-10 text-lg font-extrabold", urgent ? "bg-white text-danger" : "bg-navy text-white")}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/** Header pill while the microphone is listening, so it is never on unnoticed. */
export function ListeningPill({ className }: { className?: string }) {
  const status = useSoundRuntime((s) => s.status);
  if (status !== "listening") return null;
  return (
    <Link
      to="/app/sound-alerts"
      title="Listening for sounds. Open sound alerts."
      className={cn("press inline-flex h-9 items-center gap-1.5 rounded-full bg-forest-100 px-3 text-[0.8125rem] font-bold text-forest-800 hover:bg-forest-200", className)}
    >
      <span className="relative inline-flex size-2.5">
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-forest-400 opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2.5 rounded-full bg-forest-400" />
      </span>
      <AudioLines className="size-4" aria-hidden />
      <span className="sr-only sm:not-sr-only">Listening</span>
    </Link>
  );
}
