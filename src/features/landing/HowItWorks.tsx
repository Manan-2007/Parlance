import { useEffect, useRef, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AudioLines, Camera, Keyboard, MessageSquareText, Sparkles, Workflow, type LucideIcon } from "lucide-react";
import { SectionIndex } from "@/components/brand/Arcs";
import { FluidSection } from "@/components/layout/FluidSection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { CameraVisual, ReorderVisual, SentenceVisual, SignVisual, SpeakVisual } from "./HowItWorksVisuals";
import { Reveal } from "./Reveal";

interface Step {
  lane: "Speech → Sign" | "Sign → Text";
  title: string;
  body: string;
  detail: string;
  icon: LucideIcon;
  Visual: ComponentType<{ active: boolean }>;
}

const STEPS: Step[] = [
  {
    lane: "Speech → Sign",
    title: "Speak or type",
    body: "The hearing person talks the way they normally would. The browser turns speech into English text, or they simply type.",
    detail: "Microphone or keyboard · English",
    icon: Keyboard,
    Visual: SpeakVisual,
  },
  {
    lane: "Speech → Sign",
    title: "Reorder into ISL grammar",
    body: "ISL is not English on the hands. Time moves first, the verb goes last, question words go to the end, and words like “is” and “the” drop away.",
    detail: "Rule-based ISL grammar engine",
    icon: Workflow,
    Visual: ReorderVisual,
  },
  {
    lane: "Speech → Sign",
    title: "The avatar signs it",
    body: "The avatar performs the available signs. Playback controls let you pause, replay or slow it down.",
    detail: "164 word and phrase signs · speed, replay, mirror",
    icon: Sparkles,
    Visual: SignVisual,
  },
  {
    lane: "Sign → Text",
    title: "The camera reads the reply",
    body: "The ISL signer answers to the camera. Hands and upper body are tracked on the device; video never leaves the browser, and only confident signs are accepted.",
    detail: "On-device tracking · Trained word recognition",
    icon: Camera,
    Visual: CameraVisual,
  },
  {
    lane: "Sign → Text",
    title: "Text and voice come back",
    body: "Accepted signs are rebuilt into an English sentence, shown in large text and spoken aloud, so both people can keep taking turns.",
    detail: "On-screen text · optional speech",
    icon: MessageSquareText,
    Visual: SentenceVisual,
  },
];

/**
 * A sticky visual on large screens that advances as each explanation reaches
 * the middle of the viewport. Ordinary scrolling, no hijacking; on small
 * screens every step carries its own visual.
 */
export function HowItWorks() {
  const reduced = useReducedMotion();
  const wide = useMediaQuery("(min-width: 64rem)");
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    if (!wide || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    stepRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [wide]);

  const step = STEPS[active]!;

  return (
    <FluidSection id="how-it-works" aria-labelledby="how-title" from="#ffffff" surface="bg-paper-50" className="scroll-mt-20 py-24 sm:py-32">
      <div className="container-wide">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-7">
            <SectionIndex index="02" label="How it works" />
            <h2 id="how-title" className="text-section mt-5">
              From voice to signs,
              <br />
              <span className="text-ink-3">and back again.</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p className="text-[1.125rem] leading-[1.65] text-ink-2">
              One conversation, five steps. Scroll through the round trip: the hearing person speaks, the signer
              watches, replies by signing, and is heard.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-x-12">
          {/* Explanations */}
          <ol className="lg:col-span-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const on = !wide || i === active;
              return (
                <li
                  key={s.title}
                  ref={(node) => {
                    stepRefs.current[i] = node;
                  }}
                  data-step={i}
                  aria-current={wide && i === active ? "step" : undefined}
                  className={cn(
                    "relative border-l py-8 pl-7 transition-[border-color] duration-500 lg:flex lg:min-h-[46vh] lg:flex-col lg:justify-center lg:py-10 [&_h3]:transition-colors [&_h3]:duration-500",
                    wide ? (on ? "border-navy" : "border-line-strong [&_h3]:text-ink-3") : "border-line-strong",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-9 -left-[0.3125rem] size-2.5 rounded-full transition-colors duration-500 lg:top-1/2 lg:-translate-y-1/2",
                      on ? "bg-sun-400 ring-4 ring-sun-100" : "bg-line-strong",
                    )}
                  />
                  <p className="flex items-center gap-2.5 text-sm font-semibold text-navy">
                    <span
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-full",
                        s.lane === "Speech → Sign" ? "bg-tangerine-100 text-tangerine-800" : "bg-forest-100 text-forest-800",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="tabular-nums">({i + 1})</span>
                    <span className="text-ink-3">{s.lane}</span>
                  </p>
                  <h3 className="mt-4 text-[1.625rem] leading-tight font-bold tracking-[-0.03em]">{s.title}</h3>
                  <p className="mt-3 max-w-[44ch] text-[1.0625rem] leading-[1.7] text-ink-2">{s.body}</p>
                  <p className="mt-4 text-[0.8125rem] font-medium tracking-[0.02em] text-ink-3">{s.detail}</p>
                  {/* Small screens: each step carries its own visual */}
                  {!wide && (
                    <div className="relative mt-6 grid min-h-[23rem] overflow-hidden rounded-[1.75rem] border border-line bg-surface sm:block sm:aspect-[4/3] sm:min-h-0" aria-hidden>
                      <s.Visual active={!reduced} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {/* Sticky visual (large screens) */}
          {wide && (
            <div className="lg:col-span-7">
              <div className="sticky top-[calc(50vh-17rem)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-line bg-surface">
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-3 text-navy",
                      step.lane === "Speech → Sign" ? "[&_svg]:text-tangerine-800" : "[&_svg]:text-forest-800",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {step.lane === "Speech → Sign" ? <AudioLines className="size-4" aria-hidden /> : <Camera className="size-4" aria-hidden />}
                      <span aria-hidden>{step.lane}</span>
                      <span className="font-normal text-ink-3">· {step.title}</span>
                    </span>
                    <span className="flex gap-1.5" aria-hidden>
                      {STEPS.map((_, i) => (
                        <span key={i} className={cn("h-1.5 rounded-full transition-all duration-500", i === active ? "w-6 bg-navy" : i < active ? "w-1.5 bg-ink-3" : "w-1.5 bg-line-strong")} />
                      ))}
                    </span>
                  </div>
                  <div key={active} className="absolute inset-0 top-12 animate-fade" aria-hidden>
                    <step.Visual active={!reduced} />
                  </div>
                </div>
                <Link to={step.lane === "Speech → Sign" ? "/app/speech-to-sign" : "/app/sign-to-text"} className="mt-5 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-royal hover:underline">
                  Try {step.lane === "Speech → Sign" ? "speech to sign" : "sign to text"} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* The wireframe's three steps, as one sentence */}
        <Reveal className="mt-20 border-t border-line pt-10 sm:mt-28">
          <p className="text-statement max-w-5xl leading-[1.5] text-navy">
            {[
              ["1", "Speak naturally."],
              ["2", "See signs."],
              ["3", "Understand each other."],
            ].map(([n, text]) => (
              <span key={n} className="mr-4 inline-block sm:mr-6 sm:whitespace-nowrap">
                <span className="mr-2.5 inline-flex size-8 -translate-y-0.5 items-center justify-center rounded-full bg-sun-100 align-middle text-sm font-bold text-navy">
                  {n}
                </span>
                {text}
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </FluidSection>
  );
}
