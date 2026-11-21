/**
 * The workspace home: everything Parlance does, grouped by the situation you
 * are in, so nothing has to be hunted for. Emergency is always first.
 */
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, AudioLines, BellRing, Captions, ClipboardList, GraduationCap, Hand, History, LifeBuoy, Settings, Siren, WalletCards,
} from "lucide-react";
import { Pal } from "@/components/brand/Pal";
import { InstallAppButton } from "@/app/pwa";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { CONVERSATION_LESSON_ID, UNITS } from "@/learn/curriculum";
import { cn } from "@/lib/cn";
import { visitHasContent } from "@/lib/visitCard";
import { useSoundRuntime } from "@/services/sound/useSoundAlerts";
import { useCards } from "@/stores/cards";
import { useLearn } from "@/stores/learn";
import { SignOfTheDay } from "@/features/learn/SignOfTheDay";
import { unitProgress } from "@/features/learn/units";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const TONES = {
  voice: { tile: "bg-tangerine-400 text-navy", icon: "bg-navy/10 text-navy", body: "text-navy/75" },
  hands: { tile: "bg-forest-400 text-white", icon: "bg-white/15 text-white", body: "text-white/80" },
  sun: { tile: "bg-sun-400 text-navy", icon: "bg-navy/10 text-navy", body: "text-navy/75" },
  plain: { tile: "bg-surface text-navy ring-1 ring-line hover:ring-royal/40", icon: "bg-cobalt-100 text-cobalt-800", body: "text-ink-2" },
} as const;

function Tile({ to, icon: Icon, title, body, tone, badge }: { to: string; icon: Icon; title: ReactNode; body: string; tone: keyof typeof TONES; badge?: ReactNode }) {
  const t = TONES[tone];
  return (
    <Link
      to={to}
      className={cn(
        "group relative grid h-full grid-cols-[auto_1fr] items-center gap-x-4 rounded-[1.75rem] p-4 transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:shadow-md sm:flex sm:flex-col sm:items-stretch sm:p-6",
        t.tile,
      )}
    >
      <span className="row-span-2 flex items-start justify-between gap-3">
        <span className={cn("inline-flex size-12 items-center justify-center rounded-full", t.icon)}>
          <Icon className="size-[1.375rem]" aria-hidden />
        </span>
        {badge}
      </span>
      <span className="text-[1.25rem] leading-7 font-extrabold tracking-[-0.03em] sm:mt-5 sm:text-[1.375rem]">{title}</span>
      <span className={cn("text-[0.9375rem] leading-6 sm:mt-1.5 sm:flex-1", t.body)}>{body}</span>
      <ArrowRight className="mt-4 hidden size-5 transition-transform group-hover:translate-x-1 sm:block" aria-hidden />
    </Link>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="text-xl font-extrabold tracking-[-0.025em] text-navy">
        {title}
      </h2>
      {description && <p className="mt-1 text-[0.9375rem] text-ink-3">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function HomePage() {
  useDocumentTitle("Home");
  const lessons = useLearn((s) => s.lessons);
  const visit = useCards((s) => s.visit);
  const listening = useSoundRuntime((s) => s.status === "listening");

  const continueAt = (() => {
    for (const unit of UNITS) {
      const progress = unitProgress(unit, lessons);
      if (progress.next) return { unit, lessonId: progress.next };
    }
    return null;
  })();
  const started = Object.keys(lessons).length > 0;
  const lessonTitle = continueAt
    ? continueAt.lessonId === CONVERSATION_LESSON_ID
      ? continueAt.unit.dialogue?.title ?? "Conversation"
      : continueAt.unit.lessons.find((l) => l.id === continueAt.lessonId)?.title
    : null;

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="flex items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Parlance</p>
          <h1 className="mt-1 text-[2.25rem] leading-[1.05] font-extrabold tracking-[-0.045em] text-navy sm:text-[3rem]">What do you need right now?</h1>
          <p className="mt-3 text-[1.0625rem] leading-7 text-ink-2">Talk with someone, show a card at a counter, follow speech in big text, or learn a few signs.</p>
        </div>
        <Pal pose="wave" outfit="tangerine" skin="medium" hair="short" animate className="hidden h-36 shrink-0 md:block" />
      </div>

      <Link
        to="/app/cards/emergency"
        className="group mt-8 flex items-center gap-4 rounded-[1.75rem] bg-danger px-5 py-4 text-white transition-[filter] hover:brightness-110 sm:px-6"
      >
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-danger">
          <Siren className="size-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg leading-6 font-extrabold">Emergency</span>
          <span className="block text-[0.9375rem] leading-6 text-white/85">Ask for help, call an ambulance or police through someone nearby, send your location.</span>
        </span>
        <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
      </Link>

      <Section id="talk-title" title="Talk with someone" description="Each direction has its own colour, everywhere in Parlance.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <Tile
              to="/app/speech-to-sign"
              icon={AudioLines}
              tone="voice"
              title={<>Speech <span aria-hidden>→</span><span className="sr-only">to</span> Sign</>}
              body="They speak or type in English or Hindi. The 3D signer shows it in ISL."
            />
          </li>
          <li>
            <Tile
              to="/app/sign-to-text"
              icon={Hand}
              tone="hands"
              title={<>Sign <span aria-hidden>→</span><span className="sr-only">to</span> Text</>}
              body="You sign to the camera. They read it, or hear it read aloud."
            />
          </li>
          <li>
            <Tile to="/app/speech-to-sign?view=captions" icon={Captions} tone="plain" title="Live captions" body="Follow a class, a meeting or an announcement in big text." />
          </li>
          <li>
            <Tile to="/app/cards" icon={WalletCards} tone="sun" title="Show a card" body="At a counter or clinic: ready-made messages, and they reply by tapping." />
          </li>
        </ul>
      </Section>

      <div className="grid gap-x-6 lg:grid-cols-2">
        <Section id="prepare-title" title="Before you go out">
          <ul className="grid gap-3">
            <li>
              <Link to="/app/cards/visit" className="group flex items-center gap-4 rounded-[1.5rem] bg-surface p-4 ring-1 ring-line hover:ring-royal/40">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sun-400 text-navy">
                  <ClipboardList className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-extrabold text-navy">Visit card</span>
                  <span className="block text-sm text-ink-3">
                    {visitHasContent(visit) ? `Ready${visit.place ? ` for ${visit.place}` : ""}` : "Symptoms, medicines and questions for an appointment"}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-ink-3 group-hover:text-navy" aria-hidden />
              </Link>
            </li>
          </ul>
        </Section>
        <Section id="home-title" title="At home">
          <Link to="/app/sound-alerts" className="group flex items-center gap-4 rounded-[1.5rem] bg-surface p-4 ring-1 ring-line hover:ring-royal/40">
            <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full", listening ? "bg-forest-400 text-white" : "bg-cobalt-100 text-cobalt-800")}>
              <BellRing className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-extrabold text-navy">Sound alerts</span>
              <span className="block text-sm text-ink-3">{listening ? "Listening now" : "Flash and vibrate for the doorbell, alarms, a baby crying"}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-ink-3 group-hover:text-navy" aria-hidden />
          </Link>
        </Section>
      </div>

      <Section id="learn-title" title="Keep learning">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Link to={continueAt ? `/app/learn/${continueAt.unit.id}/${continueAt.lessonId}` : "/app/learn"} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-navy p-6 text-white">
            <span>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-white/70">
                <GraduationCap className="size-4" aria-hidden /> {started ? "Continue where you left off" : "Start learning ISL"}
              </span>
              <span className="mt-2 block text-2xl font-semibold tracking-[-0.03em]">{lessonTitle ?? "Every lesson done"}</span>
              <span className="mt-1 block text-white/75">{continueAt?.unit.title ?? "Review your signs to keep them fresh."}</span>
            </span>
            <span className="mt-6 inline-flex items-center gap-1.5 font-bold text-sun-300">
              {started ? "Continue" : "Start the first lesson"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </span>
            <span aria-hidden className="pointer-events-none absolute -right-16 -bottom-20 size-56 rounded-full border-[18px] border-gold/30" />
          </Link>
          <SignOfTheDay />
        </div>
        <p className="mt-3 text-[0.9375rem] text-ink-2">
          Work with the public?{" "}
          <Link to="/app/learn#work" className="font-bold text-royal hover:underline">
            Signs for your work
          </Link>{" "}
          has short lessons for clinics, police, banks, stations, shops and schools.
        </p>
      </Section>

      <Section id="more-title" title="Your things">
        <ul className="grid gap-2 sm:grid-cols-3">
          {[
            { to: "/app/history", icon: History, title: "History", body: "What you translated, to replay or practise" },
            { to: "/app/settings", icon: Settings, title: "Settings", body: "Voice, camera, text size, privacy" },
            { to: "/app/help", icon: LifeBuoy, title: "Help", body: "How each part works, and its limits" },
          ].map(({ to, icon: Icon, title, body }) => (
            <li key={to}>
              <Link to={to} className="group flex h-full items-center gap-3 rounded-[1.25rem] bg-surface p-4 ring-1 ring-line hover:ring-royal/40">
                <Icon className="size-5 shrink-0 text-royal" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-extrabold text-navy">{title}</span>
                  <span className="block text-sm text-ink-3">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <InstallAppButton />
        </div>
      </Section>
    </div>
  );
}
