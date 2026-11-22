import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { AudioLines, CircleHelp, GraduationCap, Hand, History, House, MessagesSquare, Settings, Siren, WalletCards } from "lucide-react";
import { ListeningPill } from "@/features/sound-alerts/SoundAlertLayer";
import { cn } from "@/lib/cn";
import { AccessibilityMenu } from "./AccessibilityMenu";
import { Logo } from "./Logo";

/* Each direction keeps its colour everywhere: tangerine for Speech → Sign,
   green for Sign → Text. The words always carry the meaning too. */
const MODES = [
  { to: "/app/speech-to-sign", from: "Speech", target: "Sign", icon: AudioLines, pill: "bg-tangerine-400", on: "text-navy" },
  { to: "/app/sign-to-text", from: "Sign", target: "Text", icon: Hand, pill: "bg-forest-400", on: "text-white" },
];

/* Where things are. The main places show words from xl (below that the direction switcher needs the room); History, Settings and Help are icons (with tooltips) until 2xl. */
const TOOLS = [
  { to: "/app", label: "Home", icon: House, end: true, labels: "lg" },
  { to: "/app/cards", label: "Cards", icon: WalletCards, labels: "lg" },
  { to: "/app/learn", label: "Learn", icon: GraduationCap, labels: "lg" },
  { to: "/app/community", label: "Community", icon: MessagesSquare, labels: "lg" },
  { to: "/app/history", label: "History", icon: History, labels: "2xl" },
  { to: "/app/settings", label: "Settings", icon: Settings, labels: "2xl" },
  { to: "/app/help", label: "Help", icon: CircleHelp, labels: "2xl" },
] as const;

export function AppHeader() {
  const { pathname } = useLocation();
  const [floating, setFloating] = useState(false);

  // Same behaviour as the site header: position only, with hysteresis.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setFloating((was) => (was ? y > 12 : y > 40));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 h-16 pt-[env(safe-area-inset-top)] print:hidden">
      <div
        className={cn(
          "mx-auto flex items-stretch justify-between gap-4 border transition-[max-width,translate,height,padding,background-color,border-color,box-shadow,border-radius] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          floating
            ? "h-[3.25rem] max-w-[min(72rem,calc(100%-1.25rem))] translate-y-2.5 rounded-[1.625rem] border-line bg-surface/95 pr-1.5 pl-4 shadow-md backdrop-blur-sm sm:pl-5 md:h-14 md:translate-y-3 md:rounded-[1.75rem] md:pr-2"
            : "h-16 max-w-full translate-y-0 rounded-none border-transparent border-b-line bg-paper/95 px-4 shadow-none backdrop-blur-sm sm:px-6",
        )}
      >
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          {/* Between md and lg the direction switcher needs the room, even at large text sizes. */}
          <Logo to="/app" wordmarkClassName="md:max-lg:sr-only" />
          <nav aria-label="Translation direction" className="hidden md:block">
            <ul className="flex items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-line">
              {MODES.map(({ to, from, target, icon: Icon, pill, on }) => {
                const active = pathname.startsWith(to);
                return (
                  <li key={to} className="relative flex">
                    {active && (
                      <motion.span
                        aria-hidden
                        layoutId="app-mode-indicator"
                        className={cn("absolute inset-0 rounded-full", pill)}
                        transition={{ type: "spring", stiffness: 420, damping: 38 }}
                      />
                    )}
                    <NavLink
                      to={to}
                      className={cn(
                        "relative flex h-9 items-center gap-2 rounded-full px-3.5 py-1 text-[0.9375rem] font-bold whitespace-nowrap transition-colors",
                        active ? on : "text-ink-2 hover:bg-paper hover:text-navy",
                      )}
                    >
                      <Icon className="hidden size-4 lg:block" aria-hidden />
                      <span>{from}</span>
                      <span aria-hidden className={active ? "opacity-70" : "text-ink-3"}>
                        →
                      </span>
                      <span className="sr-only">to</span>
                      <span>{target}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <nav aria-label="Workspace" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {TOOLS.map(({ to, label, icon: Icon, labels, ...rest }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={"end" in rest}
                    title={label}
                    className={({ isActive }) =>
                      cn(
                        "press inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-bold",
                        isActive ? "bg-navy text-white" : "text-ink-2 hover:bg-paper-2 hover:text-navy",
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className={labels === "lg" ? "sr-only xl:not-sr-only" : "sr-only 2xl:not-sr-only"}>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <ListeningPill className="mr-1" />
          {/* Emergency is one tap from every page. */}
          <NavLink
            to="/app/cards/emergency"
            title="Emergency"
            className={({ isActive }) =>
              cn(
                "press ml-1 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold",
                isActive ? "bg-navy text-white" : "bg-danger text-white hover:brightness-110",
              )
            }
          >
            <Siren className="size-4" aria-hidden />
            <span className="sr-only lg:not-sr-only">Emergency</span>
          </NavLink>
          <NavLink
            to="/app/help"
            aria-label="Help"
            title="Help"
            className={({ isActive }) =>
              cn(
                "press inline-flex size-11 items-center justify-center rounded-full md:hidden",
                isActive ? "bg-navy text-white" : "text-ink-2 hover:bg-paper-2",
              )
            }
          >
            <CircleHelp className="size-5" aria-hidden />
          </NavLink>
          <div className="ml-2 flex items-center">
            <AccessibilityMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
