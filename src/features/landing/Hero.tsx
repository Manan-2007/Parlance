import { lazy, Suspense, useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AudioLines, Camera, ShieldCheck } from "lucide-react";
import { SigningLoader } from "@/components/ui/SigningLoader";
import { useIntro } from "./intro/introState";

const HeroStage = lazy(() => import("./HeroStage"));

const SUGGESTIONS = ["Where is the pain?", "I need water.", "मुझे पानी चाहिए"];

/** The two ways in, shown as equals. */
const PATHS = [
  {
    to: "/app/speech-to-sign",
    from: "Speech",
    target: "Sign",
    who: "For the hearing person",
    note: "Speak or type, then watch it signed.",
    icon: AudioLines,
    chip: "bg-tangerine-100 text-tangerine-800",
  },
  {
    to: "/app/sign-to-text",
    from: "Sign",
    target: "Text",
    who: "For the ISL signer",
    note: "Sign to the camera, then read or hear it.",
    icon: Camera,
    chip: "bg-forest-100 text-forest-800",
  },
] as const;

/** Shown while the 3D stage loads: the same arch, quietly waiting. */
function StagePoster() {
  return (
    <div className="relative h-full w-full">
      <div aria-hidden className="absolute top-[5%] bottom-[22%] left-1/2 w-[min(78%,24rem)] -translate-x-1/2 rounded-t-full bg-tangerine-50 ring-1 ring-tangerine-100" />
      <div
        aria-hidden
        data-intro-target
        className="pointer-events-none absolute top-[12%] left-1/2 aspect-square h-[58%] -translate-x-1/2 rounded-full"
      />
      <div className="absolute inset-x-0 top-[36%] flex justify-center">
        <SigningLoader label="Loading the 3D signer" tone="quiet" />
      </div>
    </div>
  );
}

export function Hero() {
  const inputId = useId();
  const hintId = useId();
  const [draft, setDraft] = useState("");
  const [request, setRequest] = useState<{ text: string; id: number } | null>(null);
  const welcoming = useIntro((s) => s.phase !== "done");

  const sign = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setRequest({ text: value, id: Date.now() });
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sign(draft);
  };

  return (
    <section aria-labelledby="hero-title" className="intro-hold relative bg-paper-50">
      <div className="container-wide grid items-center gap-x-14 gap-y-12 pt-8 pb-16 sm:pt-12 sm:pb-20 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-14">
        {/* What it is, and the two ways in */}
        <div className="min-w-0">
          <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-3.5 pl-2.5 text-[0.8125rem] leading-5 font-semibold text-ink-2">
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-sun-400" />
            <span>
              English and Hindi <span aria-hidden>·</span>
              <span className="sr-only">and</span> Indian Sign Language
            </span>
          </p>

          <h1 id="hero-title" className="text-hero mt-6 max-w-[14ch] animate-rise-lg text-navy [animation-delay:60ms]">
            Talk across <span className="text-tangerine-800">speech</span> and{" "}
            <span className="text-forest-800">sign</span>.
          </h1>

          <p className="mt-6 max-w-[40ch] animate-rise-lg text-[1.125rem] leading-8 text-ink-2 [animation-delay:140ms] sm:text-[1.1875rem]">
            Parlance helps a hearing person and an Indian Sign Language signer understand each other on one screen.
            Words become signs from a 3D signer, and signs to the camera become text and speech.
          </p>

          <ul className="mt-9 grid animate-rise-lg gap-3 [animation-delay:220ms] sm:grid-cols-2" aria-label="Open a tool">
            {PATHS.map((path) => (
              <li key={path.to} className="flex">
                <Link
                  to={path.to}
                  className="group flex w-full items-start gap-3.5 rounded-[1.25rem] border border-line bg-surface p-4 transition-[border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-navy/30"
                >
                  <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${path.chip}`} aria-hidden>
                    <path.icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-base font-bold text-navy">
                      <span>
                        {path.from} <span aria-hidden>→</span>
                        <span className="sr-only">to</span> {path.target}
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-navy" aria-hidden />
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 font-medium text-ink-2">{path.who}</span>
                    <span className="mt-0.5 block text-sm leading-5 text-ink-3">{path.note}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-5 flex animate-rise-lg items-start gap-2 text-sm leading-6 text-ink-3 [animation-delay:280ms]">
            <ShieldCheck className="mt-1 size-4 shrink-0 text-forest-800" aria-hidden />
            Runs in your browser with no account. Camera video stays on your device.
          </p>
        </div>

        {/* The live demo: type, and the signer shows it */}
        <div className="min-w-0 animate-fade [animation-delay:200ms]">
          <div className="rounded-[2rem] border border-line bg-surface p-2.5 sm:p-3">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-paper-50 sm:aspect-[6/5] lg:aspect-auto lg:h-[min(60svh,32rem)]">
              <Suspense fallback={<StagePoster />}>
                <HeroStage request={request} hold={welcoming} />
              </Suspense>
            </div>

            <form onSubmit={onSubmit} className="px-2 pt-4 pb-2 sm:px-3">
              <label htmlFor={inputId} className="text-[0.9375rem] font-semibold text-navy">
                Try it: type a sentence in English or Hindi
              </label>
              <p id={hintId} className="sr-only">
                The 3D signer above performs it in Indian Sign Language.
              </p>
              <div className="mt-2.5 flex items-stretch rounded-full border border-line-strong bg-surface transition-[border-color,box-shadow] focus-within:border-navy focus-within:shadow-[0_0_0_4px_rgb(1_22_56/0.08)]">
                <input
                  id={inputId}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 120))}
                  placeholder="Where is the pain?"
                  autoComplete="off"
                  aria-describedby={hintId}
                  className="h-12 min-w-0 flex-1 bg-transparent pr-2 pl-5 text-[1.0625rem] text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="press m-1 inline-flex items-center gap-2 rounded-full bg-navy px-5 text-[0.9375rem] font-semibold text-white hover:bg-cobalt-500 disabled:bg-paper-2 disabled:text-ink-3"
                >
                  Sign it <ArrowRight className="size-4" aria-hidden />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
                <span className="mr-1 text-ink-3">Or try</span>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setDraft(s);
                      sign(s);
                    }}
                    className="press rounded-full border border-line bg-paper-50 px-3 py-1.5 font-medium text-navy hover:border-navy/30 hover:bg-surface"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
