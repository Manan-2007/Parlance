import { AudioLines, GraduationCap, Hand, Workflow } from "lucide-react";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { LANDING_SECTIONS, SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SkipLink } from "@/components/layout/SkipLink";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useHashScroll } from "@/hooks/useHashScroll";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { About } from "./About";
import { HandsHero, HowItWorksCards, PhraseMarquee, PhrasePosters, SpellYourName, TwoWays } from "./HandsLanding";
import { LearnSection } from "./LearnSection";
import { WhyItMatters } from "./WhyItMatters";

const SECTION_IDS = LANDING_SECTIONS.map((s) => s.id);

const TABS = [
  { to: "/app/speech-to-sign", label: "Speech → Sign", ariaLabel: "Speech to sign", icon: AudioLines, tone: "voice" as const },
  { to: "/app/sign-to-text", label: "Sign → Text", ariaLabel: "Sign to text", icon: Hand, tone: "hands" as const },
  { to: "/app/learn", label: "Learn", icon: GraduationCap },
  { to: "#how-it-works", label: "How it works", icon: Workflow },
];

/* The first-visit welcome now lives in app/RouteTransition (a wave, then "HI"). */
export function LandingPage() {
  useDocumentTitle(null);
  const active = useScrollSpy(SECTION_IDS);
  useHashScroll();

  return (
    <div className="min-h-dvh overflow-x-clip bg-paper">
      <SkipLink />
      <SiteHeader active={active} />
      <main id="main" tabIndex={-1} className="outline-none">
        <HandsHero />
        <PhraseMarquee />
        <HowItWorksCards />
        <SpellYourName />
        <PhrasePosters />
        <TwoWays />
        <LearnSection />
        <WhyItMatters />
        <About />
      </main>
      <SiteFooter />
      <MobileTabBar items={TABS} label="Quick navigation" activeAnchor={active} />
    </div>
  );
}
