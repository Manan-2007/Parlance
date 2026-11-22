import { Outlet, useLocation } from "react-router-dom";
import { AudioLines, GraduationCap, Hand, House, MessagesSquare, WalletCards } from "lucide-react";
import { SoundAlertLayer } from "@/features/sound-alerts/SoundAlertLayer";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SkipLink } from "@/components/layout/SkipLink";
import { useHashScroll } from "@/hooks/useHashScroll";

/* Phones: the six places people go most. History, Settings and Help are on Home. */
const tabs = [
  { to: "/app", label: "Home", icon: House, end: true },
  { to: "/app/speech-to-sign", label: "Speech→Sign", ariaLabel: "Speech to sign", icon: AudioLines, tone: "voice" as const },
  { to: "/app/sign-to-text", label: "Sign→Text", ariaLabel: "Sign to text", icon: Hand, tone: "hands" as const },
  { to: "/app/cards", label: "Cards", icon: WalletCards },
  { to: "/app/learn", label: "Learn", icon: GraduationCap },
  { to: "/app/community", label: "Community", icon: MessagesSquare },
];

/** Workspace frame: compact header, page content, and bottom tabs on phones. */
export function AppShell() {
  const location = useLocation();
  useHashScroll();
  return (
    <div className="min-h-dvh bg-paper">
      <SkipLink />
      <AppHeader />
      <main id="main" tabIndex={-1} className="pb-safe-tabbar outline-none">
        <div key={location.pathname} className="animate-fade">
          <Outlet />
        </div>
      </main>
      <MobileTabBar items={tabs} label="Workspace" />
      <SoundAlertLayer />
    </div>
  );
}
