import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, AudioLines, Camera, Hand, Play, Users, Workflow } from "lucide-react";
import { RainbowRings } from "@/components/brand/RainbowArch";
import { SignHands } from "@/components/brand/SignHands";
import { Logo } from "./Logo";

/** The wireframe's four destinations, as the footer's index. */
const DESTINATIONS = [
  { to: "/app/speech-to-sign", icon: AudioLines, title: "Speech → Sign", spoken: "Speech to sign", note: "Speak or type; the signer answers in ISL." },
  { to: "/app/sign-to-text", icon: Hand, title: "Sign → Text", spoken: "Sign to text", note: "Sign to the camera; read and hear the reply." },
  { to: "/#how-it-works", icon: Workflow, title: "How it works", spoken: "How it works", note: "Both pipelines, step by step." },
  { to: "/#about", icon: Users, title: "About us", spoken: "About us", note: "Why we built it, and who we are." },
];

const MORE = [
  { to: "/app/learn", label: "Learn ISL" },
  { to: "/app/learn/signs", label: "Sign library" },
  { to: "/app/history", label: "History" },
  { to: "/app/settings", label: "Settings" },
  { to: "/app/help#vocabulary", label: "Supported signs" },
  { to: "/app/help#limits", label: "What it can't do" },
  { to: "/app/help#privacy", label: "Privacy" },
  { to: "/app/help", label: "Help" },
];

export function SiteFooter({ onReplayIntro }: { onReplayIntro?: () => void }) {
  return (
    <footer>
      {/* A last invitation with both ways in. The rainbow lives only here. */}
      <section aria-labelledby="footer-cta" className="pt-24 sm:pt-32">
        <div className="container-wide flex flex-col items-center gap-5 text-center">
          <p className="font-mono text-[0.78rem] tracking-[0.14em] text-ink-2 uppercase">Ready when you are</p>
          <h2 id="footer-cta" className="text-section">
            Let&rsquo;s talk <em>with our hands.</em>
          </h2>
          <p className="max-w-xl text-[1.0625rem] leading-7 text-ink-2">
            Choose the side you&rsquo;re on. Both directions run in your browser, with no account. For anything
            consequential, such as a diagnosis or consent, book a qualified ISL interpreter.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/app/speech-to-sign"
              className="press inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-navy px-6 text-[0.9375rem] font-semibold text-white hover:bg-cobalt-500"
            >
              <AudioLines className="size-[1.125rem]" aria-hidden />
              Speech <span aria-hidden>→</span>
              <span className="sr-only">to</span> Sign
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/app/sign-to-text"
              className="press inline-flex h-12 items-center justify-center gap-2.5 rounded-full border border-navy bg-transparent px-6 text-[0.9375rem] font-semibold text-navy hover:bg-surface"
            >
              <Camera className="size-[1.125rem]" aria-hidden />
              Sign <span aria-hidden>→</span>
              <span className="sr-only">to</span> Text
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="relative mx-auto mt-14 w-full max-w-[980px] px-4 sm:px-8" aria-hidden>
          <RainbowRings rings={7} opening={0.56} className="w-full" />
          <div className="absolute inset-x-0 bottom-0 flex justify-center">
            <div className="animate-float">
              <SignHands letter="HELLO" size="clamp(200px, 30vw, 340px)" sleeve="var(--color-tomato-400)" />
            </div>
          </div>
        </div>
      </section>

      <div className="bg-navy pb-safe-tabbar text-white">
        <div className="container-wide">
          <nav aria-label="Footer" className="grid border-b border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {DESTINATIONS.map((d, i) => (
              <Link
                key={d.to}
                to={d.to}
                className={
                  "group relative flex flex-col gap-2 border-b border-white/15 py-7 transition-colors focus-visible:outline-gold sm:pr-6 lg:border-b-0 " +
                  (i > 0 ? "lg:border-l lg:pl-6" : "") +
                  (i % 2 === 1 ? " sm:border-l sm:pl-6" : "")
                }
              >
                <d.icon className="mb-1 size-5 text-white/70" aria-hidden />
                <span className="flex items-center justify-between gap-3 text-[1.25rem] font-semibold tracking-[-0.02em]">
                  <span aria-hidden>{d.title}</span>
                  <span className="sr-only">{d.spoken}</span>
                  <ArrowUpRight
                    className="size-4 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
                    aria-hidden
                  />
                </span>
                <span className="text-[0.9375rem] leading-6 text-white/70">{d.note}</span>
              </Link>
            ))}
          </nav>

          <div className="grid gap-10 py-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Logo inverse />
              <p className="mt-4 max-w-sm text-[0.9375rem] leading-7 text-white/70">
                Two-way communication between spoken English and Indian Sign Language. Built to support qualified
                interpreters, never to replace them.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:col-span-7 lg:justify-items-start">
              {MORE.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex min-h-10 items-center text-[0.9375rem] text-white/80 transition-colors hover:text-white focus-visible:outline-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/15 py-6 text-[0.8125rem] text-white/60 sm:flex-row sm:justify-between">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              Team APX_GP · The Builder&rsquo;s Theory 1.0
              {onReplayIntro && (
                <button
                  type="button"
                  onClick={onReplayIntro}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-1 text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white focus-visible:outline-gold"
                >
                  <Play className="size-3" aria-hidden /> Replay the welcome
                </button>
              )}
            </p>
            <p>No video is stored or sent. Sign motion from the ISLRTC dictionary.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
