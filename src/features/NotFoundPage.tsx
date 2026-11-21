import { ArrowLeft, ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { Pal } from "@/components/brand/Pal";
import { RainbowArch } from "@/components/brand/RainbowArch";
import { Reach } from "@/components/brand/Hands";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-paper">
      <Reach side="right" at="18%" tilt={8} hand="bubblegum" sleeve="#3C5A99" reach="6rem" size="12rem" className="max-md:hidden" />
      <Reach side="bottom" at="58%" tilt={-10} hand="sun" sleeve="#3C5A99" reach="7rem" size="12rem" delay={2} className="max-md:hidden" />
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="container-page flex flex-1 flex-col-reverse items-start justify-center gap-10 py-12 md:flex-row md:items-center md:justify-between">
        <div className="relative z-10 max-w-xl">
          <p className="inline-flex items-center rounded-full bg-sun-400 px-3.5 py-1 text-[0.8125rem] font-extrabold text-navy">Error 404</p>
          <h1 className="mt-5 text-[2.75rem] leading-[0.95] font-extrabold tracking-[-0.05em] sm:text-[4rem]">
            This page doesn&rsquo;t exist.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-ink-2">
            The link may be out of date. You can go back to the home page or start a translation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/" variant="secondary" size="lg" leading={<ArrowLeft aria-hidden />}>
              Back to home
            </ButtonLink>
            <ButtonLink to="/app/speech-to-sign" size="lg" trailing={<ArrowRight aria-hidden />}>
              Open the translator
            </ButtonLink>
          </div>
        </div>
        <div className="relative w-full max-w-[26rem] shrink-0 self-center md:w-[44%]" aria-hidden>
          <RainbowArch rings={6} opening={0.46} className="w-full" />
          <Pal pose="wave" outfit="navy" skin="deep" hair="bun" animate className="absolute bottom-0 left-1/2 h-[64%] -translate-x-1/2" />
        </div>
      </main>
    </div>
  );
}
