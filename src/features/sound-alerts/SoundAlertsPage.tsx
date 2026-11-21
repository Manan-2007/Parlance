/**
 * Sound alerts, for home: choose the sounds that matter, start listening, and
 * Parlance flashes the screen (and vibrates where phones allow) when it hears
 * one. Listening continues while you use the rest of Parlance.
 */
import { BellRing, Ear, MicOff, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { SigningLoader } from "@/components/ui/SigningLoader";
import { Switch, SwitchRow } from "@/components/ui/Switch";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/lib/cn";
import { SOUND_GROUPS, type Sensitivity } from "@/lib/soundAlerts";
import { SOUND_ERRORS, useSoundRuntime, useSoundSettings } from "@/services/sound/useSoundAlerts";

const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;
const canNotify = typeof window !== "undefined" && "Notification" in window;

export function SoundAlertsPage() {
  useDocumentTitle("Sound alerts");
  const { status, error, heard, level, log, start, stop, test } = useSoundRuntime();
  const settings = useSoundSettings();
  const listening = status === "listening";
  const enabled = new Set(settings.enabled);

  const toggle = (id: string, on: boolean) => settings.set({ enabled: on ? [...settings.enabled, id] : settings.enabled.filter((g) => g !== id) });

  const setNotify = async (on: boolean) => {
    if (on && canNotify && Notification.permission !== "granted") {
      const result = await Notification.requestPermission().catch(() => "denied" as const);
      if (result !== "granted") return;
    }
    settings.set({ notify: on });
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="eyebrow">At home</p>
        <h1 className="mt-1 text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.045em] text-navy sm:text-[3rem]">Sound alerts</h1>
        <p className="mt-3 text-[1.0625rem] leading-7 text-ink-2">
          See the doorbell, an alarm or the cooker whistle. Parlance listens on this device and flashes the whole screen when it hears a sound you
          chose. The sound never leaves your device and nothing is recorded.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div className="grid gap-6">
          {/* listening control */}
          <section aria-label="Listening" className={cn("relative overflow-hidden rounded-[2rem] p-6 sm:p-8", listening ? "bg-navy text-white" : "bg-surface ring-1 ring-line")}>
            <div className="flex flex-wrap items-center gap-5">
              <span className={cn("relative inline-flex size-16 shrink-0 items-center justify-center rounded-full", listening ? "bg-sun-400 text-navy" : "bg-cobalt-100 text-cobalt-800")}>
                {listening && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-sun-400/40 motion-reduce:hidden" />}
                {status === "loading" ? <SigningLoader label="Starting" decorative className="size-8" /> : <Ear className="relative size-7" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className={cn("text-[1.5rem] leading-7 font-extrabold tracking-[-0.03em]", listening ? "text-white" : "text-navy")}>
                  {listening ? "Listening" : status === "loading" ? "Starting…" : "Not listening"}
                </h2>
                <p className={cn("mt-1 text-[0.9375rem] leading-6", listening ? "text-white/75" : "text-ink-2")} aria-live="polite">
                  {listening
                    ? heard && heard.score > 0.2
                      ? `Hearing: ${heard.categoryName.toLowerCase()}`
                      : "Quiet. Parlance will flash when it hears a chosen sound."
                    : "Start when you are at home. You can keep using Parlance; listening continues until you stop it."}
                </p>
              </div>
              {listening ? (
                <Button variant="inverse" size="lg" onClick={stop} leading={<MicOff aria-hidden />}>
                  Stop
                </Button>
              ) : (
                <Button size="lg" onClick={() => void start()} disabled={status === "loading"} leading={<Ear aria-hidden />}>
                  Start listening
                </Button>
              )}
            </div>
            {listening && (
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15" aria-hidden>
                <div className="h-full rounded-full bg-sun-400 transition-[width] duration-300" style={{ width: `${Math.round(level * 100)}%` }} />
              </div>
            )}
            {error && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-[1rem] bg-danger-bg px-4 py-3 text-[0.9375rem] leading-6 text-danger">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {SOUND_ERRORS[error]}
              </p>
            )}
          </section>

          {/* sounds */}
          <section aria-labelledby="sounds-title" className="rounded-[2rem] bg-surface p-5 ring-1 ring-line sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="sounds-title" className="text-xl font-extrabold tracking-[-0.025em] text-navy">Sounds to alert you to</h2>
                <p className="mt-1 text-[0.9375rem] text-ink-3">Press Test to see what an alert looks like.</p>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {SOUND_GROUPS.map((group) => (
                <li key={group.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] font-bold text-ink">{group.label}</p>
                    <p lang="hi" className="text-sm text-ink-3">{group.hi}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => test(group.id)}
                    className="press inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-bold text-ink-2 hover:bg-paper-2 hover:text-navy"
                  >
                    <BellRing className="size-4" aria-hidden /> Test
                  </button>
                  <Switch checked={enabled.has(group.id)} onChange={(on) => toggle(group.id, on)} label={`Alert for ${group.label.toLowerCase()}`} hideLabel />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-6">
          <section aria-labelledby="how-title" className="rounded-[2rem] bg-surface p-5 ring-1 ring-line sm:p-6">
            <h2 id="how-title" className="text-lg font-extrabold text-navy">How alerts reach you</h2>
            <div className="mt-2">
              <p className="text-[0.9375rem] font-semibold text-ink">How easily it alerts</p>
              <Segmented<Sensitivity>
                label="How easily it alerts"
                value={settings.sensitivity}
                onChange={(sensitivity) => settings.set({ sensitivity })}
                options={[
                  { value: "low", label: "Fewer" },
                  { value: "normal", label: "Normal" },
                  { value: "high", label: "More" },
                ]}
                block
                className="mt-2"
              />
              <p className="mt-2 text-sm leading-5 text-ink-3">"More" catches quieter sounds, with more false alarms.</p>
            </div>
            <div className="divide-y divide-line">
              <SwitchRow
                label="Vibrate"
                checked={settings.vibrate && canVibrate}
                disabled={!canVibrate}
                onChange={(vibrate) => settings.set({ vibrate })}
                description={canVibrate ? "On Android phones. The screen flashes as well." : "This device can't vibrate from a web app. The screen still flashes."}
              />
              <SwitchRow
                label="Notify me in the background"
                checked={settings.notify && canNotify}
                disabled={!canNotify}
                onChange={(on) => void setNotify(on)}
                description="A notification when Parlance is open in another tab or behind another app."
              />
            </div>
          </section>

          <section aria-labelledby="log-title" className="rounded-[2rem] bg-surface p-5 ring-1 ring-line sm:p-6">
            <h2 id="log-title" className="text-lg font-extrabold text-navy">Today's alerts</h2>
            {log.length === 0 ? (
              <p className="mt-1 text-[0.9375rem] text-ink-3">Nothing yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {log.map((alert) => {
                  const group = SOUND_GROUPS.find((g) => g.id === alert.group);
                  return (
                    <li key={alert.id} className="flex items-center justify-between gap-3 py-2.5 text-[0.9375rem]">
                      <span className="font-semibold text-ink">
                        {group?.label}
                        {alert.test && <span className="font-normal text-ink-3"> · test</span>}
                      </span>
                      <time className="text-sm text-ink-3 tabular-nums" dateTime={new Date(alert.at).toISOString()}>
                        {new Date(alert.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <aside className="flex items-start gap-3 rounded-[1.75rem] bg-sun-100 p-5 text-[0.9375rem] leading-6 text-ink-2">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sun-800" aria-hidden />
            <p>
              <strong className="font-extrabold text-navy">Keep Parlance open and the screen on.</strong> Phones can stop the microphone when locked.
              Sound recognition can miss a sound or mistake a similar one, so don't rely on it as your only smoke alarm alert.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
