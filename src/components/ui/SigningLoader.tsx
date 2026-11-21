/**
 * The Parlance loading indicator: two hands fingerspelling the ISL vowels
 * (A E I O U: the pointing hand touches each fingertip in turn), with three
 * dots and the status in words.
 *
 * Under reduced motion the hands rest and only the words change. The
 * `decorative` variant is a single small waving hand for use as an icon.
 */
import { useRef } from "react";
import { SignHands, useFingerspell } from "@/components/brand/SignHands";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

interface SigningLoaderProps {
  /** What is happening, in words, e.g. "Preparing signs". */
  label: string;
  size?: "sm" | "md" | "lg";
  layout?: "stack" | "inline";
  /**
   * Announce the label as a polite live status. Turn off when a surrounding
   * element already reports the same status, so it isn't read twice.
   */
  live?: boolean;
  /** Keep the words for screen readers only. */
  hideLabel?: boolean;
  /** For dark surfaces. */
  inverse?: boolean;
  /**
   * Draw only the waving hand, with no words, for use as an icon inside an
   * element that already states the status in text.
   */
  decorative?: boolean;
  /** "quiet" uses soft neutral and tinted rings, for calm surfaces. */
  tone?: "bright" | "quiet";
  className?: string;
}

const SIZES = {
  sm: { hands: "3.75rem", dot: "size-1", text: "text-[0.8125rem]" },
  md: { hands: "7rem", dot: "size-1.5", text: "text-sm" },
  lg: { hands: "11rem", dot: "size-2", text: "text-base" },
};

export function SigningLoader({
  label,
  size = "md",
  layout = "stack",
  live = true,
  hideLabel = false,
  inverse = false,
  decorative = false,
  className,
}: SigningLoaderProps) {
  const reduced = useReducedMotion();
  const s = SIZES[size];
  const ref = useRef<SVGSVGElement>(null);
  useFingerspell(ref, "AEIOU", { run: !decorative && !reduced, interval: 520, loop: true, pause: 400 });

  if (decorative) {
    return (
      <span className={cn("inline-block", className)} aria-hidden>
        <span className={cn("block size-full origin-bottom", !reduced && "animate-hand-wave")}>
          <SignHands letter="OPEN" crop size="100%" sleeve={inverse ? "#FFFAF2" : "var(--color-royal)"} />
        </span>
      </span>
    );
  }

  return (
    <div
      role={live ? "status" : undefined}
      className={cn("inline-flex items-center", layout === "stack" ? "flex-col gap-2 text-center" : "flex-row gap-2.5", className)}
    >
      <SignHands ref={ref} letter="REST" size={s.hands} className="shrink-0" />
      <span className={cn("inline-flex items-center gap-2 font-bold", s.text, inverse ? "text-white" : "text-navy", hideLabel && "sr-only")}>
        {label}
        <span aria-hidden className="inline-flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className={cn(s.dot, "rounded-full", inverse ? "bg-gold" : "bg-royal", reduced ? "opacity-60" : "animate-dot-bounce")}
              style={reduced ? undefined : { animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}
