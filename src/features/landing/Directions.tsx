import { Link } from "react-router-dom";
import { ArrowRight, AudioLines, Camera, Volume2 } from "lucide-react";
import { Pal } from "@/components/brand/Pal";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

const DIRECTIONS = [
  {
    to: "/app/speech-to-sign",
    from: "Speech",
    target: "Sign",
    who: "For the hearing person",
    body: "Say or type a message in English or Hindi. Parlance shows the ISL gloss, the signs in ISL order, and a 3D signer performs them.",
    steps: ["Speak or type", "Check the ISL gloss", "Watch it signed"],
    note: null,
    icon: AudioLines,
    tint: "bg-tangerine-50",
    accent: "text-tangerine-800",
    num: "bg-tangerine-800",
  },
  {
    to: "/app/sign-to-text",
    from: "Sign",
    target: "Text",
    who: "For the ISL signer",
    body: "Sign one word at a time to the camera. Recognised signs become an English sentence, shown in large text and spoken aloud.",
    steps: ["Start the camera", "Sign one word at a time", "Read it or hear it"],
    note: "Camera recognition needs the Parlance recognition service to be running.",
    icon: Camera,
    tint: "bg-forest-50",
    accent: "text-forest-800",
    num: "bg-forest-800",
  },
] as const;

/*
 * Small explanatory vignettes. The people stand at rest: neither picture
 * shows a sign or gesture.
 */
function SpeechVignette() {
  return (
    <div className="flex h-full items-end justify-center gap-4 px-6 pt-6 sm:gap-6" aria-hidden>
      <div className="relative">
        <Pal pose="rest" outfit="slate" skin="medium" hair="short" className="h-28 sm:h-32" />
        <span className="absolute -top-2 left-[70%] w-max rounded-2xl rounded-bl-sm border border-line bg-surface px-3 py-1.5 text-[0.8125rem] font-semibold text-navy">
          Where is the pain?
        </span>
      </div>
      <ArrowRight className="mb-12 size-5 shrink-0 text-ink-3" />
      <div className="mb-6 w-36 rounded-2xl border border-line bg-surface p-3">
        <p className="text-[0.6875rem] font-semibold text-ink-3">ISL gloss</p>
        <p className="mt-1.5 flex gap-1.5">
          <span className="rounded-full bg-navy px-2 py-0.5 text-[0.6875rem] font-semibold tracking-[0.04em] text-white">PAIN</span>
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.6875rem] font-semibold tracking-[0.04em] text-navy">WHERE</span>
        </p>
      </div>
    </div>
  );
}

function SignVignette() {
  return (
    <div className="flex h-full items-end justify-center gap-4 px-6 pt-6 sm:gap-6" aria-hidden>
      <div className="relative">
        <Pal pose="rest" outfit="sage" skin="deep" hair="bun" className="h-28 sm:h-32" />
        {/* camera framing corners */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute -inset-2 size-[calc(100%+1rem)]" fill="none">
          <path d="M3 18V8a5 5 0 0 1 5-5h10M97 18V8a5 5 0 0 0-5-5H82M3 82v10a5 5 0 0 0 5 5h10M97 82v10a5 5 0 0 1-5 5H82" stroke="#64687F" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <ArrowRight className="mb-12 size-5 shrink-0 text-ink-3" />
      <div className="mb-6 w-36 rounded-2xl border border-line bg-surface p-3">
        <p className="text-[0.9375rem] leading-5 font-semibold text-navy">Hello, thank you.</p>
        <p className="mt-1.5 flex items-center gap-1 text-[0.6875rem] font-semibold text-ink-3">
          <Volume2 className="size-3" /> Spoken aloud
        </p>
      </div>
    </div>
  );
}

/** Both directions, side by side: who each is for, and what happens. */
export function Directions() {
  return (
    <section aria-labelledby="directions-title" className="bg-surface py-20 sm:py-28">
      <div className="container-wide">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Two directions, one screen</p>
          <h2 id="directions-title" className="text-section mt-3">
            Each person uses the side that suits them.
          </h2>
          <p className="mt-4 max-w-xl text-[1.0625rem] leading-7 text-ink-2">
            A hearing person speaks or types. A signer signs. Parlance carries the message across, and you can switch
            direction at any time.
          </p>
        </Reveal>

        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {DIRECTIONS.map((d, i) => {
            const Vignette = i === 0 ? SpeechVignette : SignVignette;
            return (
              <Reveal as="li" key={d.to} delay={i * 80} className="flex">
                <article className="flex w-full flex-col overflow-hidden rounded-[1.75rem] border border-line bg-paper-50">
                  <div className={cn("h-48 border-b border-line sm:h-52", d.tint)}>
                    <Vignette />
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <p className={cn("flex items-center gap-2 text-sm font-semibold", d.accent)}>
                      <d.icon className="size-4" aria-hidden />
                      {d.who}
                    </p>
                    <h3 className="mt-2 text-[1.75rem] leading-tight font-bold tracking-[-0.03em] text-navy">
                      {d.from} <span aria-hidden>→</span>
                      <span className="sr-only">to</span> {d.target}
                    </h3>
                    <p className="mt-3 text-[1rem] leading-7 text-ink-2">{d.body}</p>
                    <ol className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-medium text-navy">
                      {d.steps.map((step, n) => (
                        <li key={step} className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3 pl-1">
                            <span className={cn("inline-flex size-5 items-center justify-center rounded-full text-[0.6875rem] font-bold text-white tabular-nums", d.num)}>
                              {n + 1}
                            </span>
                            {step}
                          </span>
                          {n < d.steps.length - 1 && <ArrowRight className="size-3.5 text-ink-3" aria-hidden />}
                        </li>
                      ))}
                    </ol>
                    {d.note && <p className="mt-4 text-sm leading-6 text-ink-3">{d.note}</p>}
                    <div className="mt-auto pt-7">
                      <Link
                        to={d.to}
                        className="press inline-flex h-11 items-center gap-2 rounded-full bg-navy px-5 text-[0.9375rem] font-semibold text-white hover:bg-cobalt-500"
                      >
                        Open {d.from} <span aria-hidden>→</span>
                        <span className="sr-only">to</span> {d.target}
                        <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
