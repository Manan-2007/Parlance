/**
 * Landing: Parlance as a place to learn ISL, not only a translator.
 */
import { Link } from "react-router-dom";
import { ArrowRight, Camera, Eye, Lightbulb, MessagesSquare } from "lucide-react";
import { SectionIndex } from "@/components/brand/Arcs";
import { FluidSection } from "@/components/layout/FluidSection";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { HandTrace } from "./HandTrace";
import { Reveal } from "./Reveal";

const LOOP = [
  { icon: Eye, title: "Watch the real sign", body: "Every sign comes from the official ISLRTC dictionary. Slow it down, mirror it, or open the original video." },
  { icon: Camera, title: "Sign it yourself", body: "Your camera checks which hands you use, where they are, their shape and the movement, on your own device." },
  { icon: Lightbulb, title: "Get one clear tip", body: "Not a vague score: “Raise your hand. This sign is made at chin height.” Then try again." },
  { icon: MessagesSquare, title: "Use it for real", body: "Units built around a first hello, a clinic, an emergency, with ISL word order explained." },
];

export function LearnSection() {
  const reduced = useReducedMotion();
  return (
    <FluidSection id="learn" aria-labelledby="learn-title" from="#dce8ff" surface="bg-navy" className="scroll-mt-20 py-24 text-white sm:py-32">
      <div className="container-wide">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-7">
            <SectionIndex index="01" label="Learn" tone="inverse" />
            <h2 id="learn-title" className="text-section mt-5 text-white">
              Learn the language
              <br />
              <span className="text-gold">of the people around you.</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p className="text-[1.125rem] leading-[1.65] text-white/80">
              Parlance means the way a community speaks. Learn Indian Sign Language from the national dictionary, practise it with your camera,
              and use it where it matters most.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-x-12">
          <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:col-span-6 lg:self-center">
            {LOOP.map(({ icon: Icon, title, body }, i) => (
              <Reveal as="li" key={title} delay={i * 80}>
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/10 text-gold">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.025em] text-white">
                  <span className="mr-2 text-white/50 tabular-nums">{i + 1}</span>
                  {title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-[1.7] text-white/75">{body}</p>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={120} className="lg:col-span-6">
            <div className="rounded-[1.75rem] bg-surface p-4 text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))] ring-1 ring-sky-200">
                  <HandTrace glosses={["thankyou"]} playing={!reduced} className="absolute inset-0" />
                  <figcaption className="absolute top-2.5 left-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-[0.75rem] font-semibold text-navy shadow-xs">ISLRTC</figcaption>
                </figure>
                <figure className="relative flex aspect-[4/3] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[linear-gradient(180deg,#fffdf6,#fbf1cf)] p-4 text-center ring-1 ring-gold-300">
                  <Camera className="size-6 text-gold-800" aria-hidden />
                  <span className="text-[0.8125rem] leading-5 text-ink-2">Your hands appear here, tracked on your device</span>
                  <figcaption className="absolute top-2.5 left-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-[0.75rem] font-semibold text-gold-800 shadow-xs">You</figcaption>
                </figure>
              </div>
              <div className="mt-4 rounded-2xl border border-line px-4 py-3.5">
                <p className="eyebrow">Example feedback</p>
                <p className="mt-1.5 flex items-start gap-2.5 text-[0.9375rem] leading-6 text-ink">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                  Raise your hand. The ISLRTC signer makes this sign at chin height.
                </p>
              </div>
              <p className="mt-4 px-1 text-sm text-ink-3">6 units · 80 signs in lessons · a 239-sign library · free, no account</p>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-14 flex flex-col gap-4 border-t border-white/15 pt-10 sm:flex-row sm:items-center">
          <Link
            to="/app/learn"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold px-6 text-[0.9375rem] font-semibold text-navy transition-colors hover:bg-gold-300"
          >
            Start learning <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link to="/app/learn/signs" className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-white/85 hover:text-white">
            Browse the sign library
          </Link>
        </Reveal>
      </div>
    </FluidSection>
  );
}
