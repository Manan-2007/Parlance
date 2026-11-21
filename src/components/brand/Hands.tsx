/**
 * Flat hands and arms, drawn from clean SVG shapes in the Parlance palette.
 * Decorative only (aria-hidden).
 *
 * The hand is a relaxed open hand. Its motions (a hello wave, a bounce, a
 * slow sway of the arm) are abstract. None is an ISL sign, and none should
 * ever be captioned or described as one.
 */
import type { CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

export const HAND_COLORS = {
  sun: { fill: "#E6C55C", shade: "#C9A640" },
  bubblegum: { fill: "#E3A797", shade: "#CF8A7C" },
  cobalt: { fill: "#3C5A99", shade: "#33508A" },
  tangerine: { fill: "#E3826B", shade: "#CF6150" },
  lilac: { fill: "#A9B4CC", shade: "#8E99B8" },
  white: { fill: "#FFFFFF", shade: "#E0D6C3" },
  light: { fill: "#F6D2B8", shade: "#E3B697" },
  medium: { fill: "#D9A27A", shade: "#C48A62" },
  deep: { fill: "#8D5A3B", shade: "#76492E" },
} as const;

export type HandColor = keyof typeof HAND_COLORS;

/**
 * An open hand, wrist at (0, 0), fingers pointing up (towards -y).
 * About 60 units wide and 86 tall. Use inside an <svg>.
 */
export function HandShape({ color = "sun" }: { color?: HandColor }) {
  const { fill, shade } = HAND_COLORS[color];
  return (
    <g>
      <g fill={fill}>
        <rect x="-22" y="-78" width="10.5" height="46" rx="5.25" transform="rotate(-9 -16.75 -34)" />
        <rect x="-10.5" y="-85" width="10.5" height="52" rx="5.25" transform="rotate(-2 -5.25 -34)" />
        <rect x="1" y="-81" width="10.5" height="48" rx="5.25" transform="rotate(5 6.25 -34)" />
        <rect x="12" y="-69" width="10" height="36" rx="5" transform="rotate(12 17 -34)" />
        <rect x="-35" y="-36" width="11.5" height="32" rx="5.75" transform="rotate(-38 -26 -8)" />
        <rect x="-22" y="-44" width="44" height="46" rx="17" />
      </g>
      <path d="M-11 -14q11 6 22 0" fill="none" stroke={shade} strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

interface ArmProps {
  /** The hand's colour. */
  hand?: HandColor;
  /** Sleeve and cuff colours. */
  sleeve?: string;
  cuff?: string;
  /** Length of the visible forearm, in hand units (the hand is ~86 tall). */
  length?: number;
}

/** A sleeved forearm with a hand, wrist at (0, 0), pointing up. */
export function ArmShape({ hand = "sun", sleeve = "#3C5A99", cuff = "#FFFFFF", length = 220 }: ArmProps) {
  return (
    <g>
      <rect x="-21" y="4" width="42" height={length} rx="10" fill={sleeve} />
      <rect x="-24" y="2" width="48" height="16" rx="7" fill={cuff} />
      <HandShape color={hand} />
    </g>
  );
}

type Side = "left" | "right" | "top" | "bottom";

const ROTATION: Record<Side, number> = { bottom: 0, top: 180, left: 90, right: -90 };

interface ReachProps extends ArmProps {
  /** Which edge of the container the arm comes in from. */
  side: Side;
  /** Position along that edge, e.g. "30%". */
  at: string;
  /** Extra tilt, in degrees. */
  tilt?: number;
  /** How far the hand reaches into the container, as a CSS length. */
  reach?: string;
  /** Rendered height of the arm graphic. */
  size?: string;
  /** Sway amount in degrees (0 for still). */
  sway?: number;
  delay?: number;
  className?: string;
}

/**
 * An arm reaching in from one edge of a positioned, overflow-hidden
 * container, swaying slowly. Pure decoration.
 */
export function Reach({
  side,
  at,
  tilt = 0,
  reach = "7rem",
  size = "13rem",
  sway = 6,
  delay = 0,
  className,
  ...arm
}: ReachProps) {
  const reduced = useReducedMotion();
  const along = side === "left" || side === "right" ? { top: at } : { left: at };
  const edge: CSSProperties =
    side === "bottom" ? { bottom: 0 } : side === "top" ? { top: 0 } : side === "left" ? { left: 0 } : { right: 0 };
  const rotation = ROTATION[side] + tilt;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute", className)}
      style={{ ...edge, ...along, width: 0, height: 0 }}
    >
      {/* The pivot sits on the edge; the arm points into the container. */}
      <div style={{ position: "absolute", left: 0, top: 0, transform: `rotate(${rotation}deg)` }}>
        <div
          className={!reduced && sway ? "animate-arm-sway" : undefined}
          style={
            {
              "--sway": `${sway}deg`,
              transformOrigin: "0 0",
              animationDelay: `${-delay}s`,
              animationDuration: `${5 + (delay % 3)}s`,
            } as CSSProperties
          }
        >
          <svg
            viewBox="-40 -100 80 330"
            style={{ position: "absolute", height: size, left: 0, top: `calc(-1 * ${reach})`, transform: "translateX(-50%)" }}
            className="overflow-visible"
          >
            <ArmShape {...arm} />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface WavingHandProps {
  color?: HandColor;
  cuff?: string;
  /** "wave" rocks at the wrist; "bounce" hops; "still" holds. */
  motion?: "wave" | "bounce" | "still";
  className?: string;
  style?: CSSProperties;
}

/** A single flat hand with a short cuff, as an inline graphic. */
export function WavingHand({ color = "sun", cuff = "#3C5A99", motion = "wave", className, style }: WavingHandProps) {
  const reduced = useReducedMotion();
  const anim = reduced || motion === "still" ? undefined : motion === "wave" ? "animate-hand-wave" : "animate-hand-bounce";
  return (
    <svg viewBox="-44 -92 88 116" aria-hidden className={cn("shrink-0 overflow-visible", className)} style={style}>
      <g className={anim} style={{ transformBox: "view-box", transformOrigin: "0px 14px" }}>
        <rect x="-21" y="4" width="42" height="22" rx="8" fill={cuff} />
        <HandShape color={color} />
      </g>
    </svg>
  );
}
