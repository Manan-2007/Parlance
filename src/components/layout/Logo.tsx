import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

import { SignHands } from "@/components/brand/SignHands";

/**
 * The Parlance mark: an open hand on a cobalt tile, from the fingerspelling
 * illustrations used across the site.
 */
export function LogoMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px] pt-0.5",
        inverse ? "bg-surface" : "bg-royal",
        className,
      )}
    >
      <SignHands letter="OPEN" crop size="70%" sleeve="var(--color-gold)" />
    </span>
  );
}

export function Logo({
  inverse = false,
  className,
  to = "/",
  wordmarkClassName,
}: {
  inverse?: boolean;
  className?: string;
  to?: string;
  /** Extra classes for the "Parlance" word, e.g. to hide it where space is tight. */
  wordmarkClassName?: string;
}) {
  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-2.5 rounded-sm", className)}
      aria-label="Parlance home"
    >
      <LogoMark inverse={inverse} />
      <span className={cn("text-[1.25rem] font-extrabold tracking-[-0.035em]", inverse ? "text-white" : "text-navy", wordmarkClassName)}>
        Parlance
      </span>
    </Link>
  );
}
