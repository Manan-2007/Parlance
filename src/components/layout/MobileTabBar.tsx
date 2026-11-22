import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";

export interface TabItem {
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** A route path, or a same-page anchor such as "#about". */
  to: string;
  /** Spoken name when the visible label uses symbols. */
  ariaLabel?: string;
  /** Direction colour for the active state (words still carry the meaning). */
  tone?: "voice" | "hands";
  /** Active only on the exact path (for a section's home). */
  end?: boolean;
}

interface MobileTabBarProps {
  items: TabItem[];
  label: string;
  /** Section id currently in view, for same-page anchors. */
  activeAnchor?: string | null;
}

/**
 * Bottom navigation for small screens. Pages reserve its height with the
 * `pb-safe-tabbar` utility, so it never covers content or controls.
 */
export function MobileTabBar({ items, label, activeAnchor }: MobileTabBarProps) {
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-[1.75rem] print:hidden border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-flow-col auto-cols-fr">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (active: boolean) => (
            <span
              className={cn(
                "relative flex h-16 flex-col items-center justify-center gap-1 leading-4 transition-colors",
                // Six tabs on a 360px phone: slightly smaller words so none is cut off.
                items.length > 5 ? "text-[0.625rem]" : "text-[0.6875rem]",
                active ? "font-bold text-navy" : "font-medium text-ink-3",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,transform] duration-300",
                  !active
                    ? "scale-90 bg-transparent"
                    : item.tone === "voice"
                      ? "scale-100 bg-tangerine-400 text-navy"
                      : item.tone === "hands"
                        ? "scale-100 bg-forest-400 text-white"
                        : "scale-100 bg-navy text-white",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span
                className={cn("max-w-full px-0.5 tracking-[-0.02em]", items.length > 5 ? "line-clamp-2 text-center leading-[0.7rem]" : "truncate")}
                aria-hidden={item.ariaLabel ? true : undefined}
              >
                {/* With six tabs a long label may break after its arrow instead of being cut off. */}
                {items.length > 5 ? item.label.replace("→", "→\u200B") : item.label}
              </span>
              {item.ariaLabel && <span className="sr-only">{item.ariaLabel}</span>}
            </span>
          );
          return (
            <li key={item.to}>
              {item.to.startsWith("#") ? (
                <a href={item.to} aria-current={activeAnchor === item.to.slice(1) ? "location" : undefined}>
                  {content(activeAnchor === item.to.slice(1))}
                </a>
              ) : (
                <NavLink to={item.to} end={item.end}>{({ isActive }) => content(isActive)}</NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
