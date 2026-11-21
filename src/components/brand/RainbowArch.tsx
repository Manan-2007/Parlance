/**
 * The Parlance rainbow: concentric half-rings built from flat pill segments
 * with soft colour blends and a print grain. It grows the brand's two-arcs
 * motif (two voices facing each other) into a shared arch.
 *
 * Decorative only (aria-hidden). Segments drift gently along their rings;
 * the drift pauses off screen and is off under reduced motion.
 */
import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

/* Muted warm-paper palette (v6). Only the footer still draws full rainbow rings. */
export const RAINBOW = {
  cobalt: "#2F4880",
  forest: "#3C5A99",
  tangerine: "#E3826B",
  sun: "#E6C55C",
  bubblegum: "#E3A797",
  tomato: "#CF6150",
  lilac: "#A9B4CC",
};

type Pill = [from: number, to: number, start: string, end: string];
export interface Ring {
  base: [string, string];
  pills: Pill[];
}

/* Outer to inner. Angles in degrees: 180 is the left foot, 0 the right. */
export const RINGS: Ring[] = [
  { base: [RAINBOW.cobalt, RAINBOW.forest], pills: [[150, 108, RAINBOW.forest, RAINBOW.cobalt], [62, 24, RAINBOW.forest, RAINBOW.forest]] },
  { base: [RAINBOW.lilac, RAINBOW.cobalt], pills: [[128, 84, RAINBOW.bubblegum, RAINBOW.cobalt]] },
  { base: [RAINBOW.bubblegum, RAINBOW.tomato], pills: [[164, 128, RAINBOW.tomato, RAINBOW.bubblegum], [74, 38, RAINBOW.bubblegum, RAINBOW.tomato]] },
  { base: [RAINBOW.tomato, RAINBOW.tangerine], pills: [[104, 62, RAINBOW.sun, RAINBOW.tomato]] },
  { base: [RAINBOW.sun, RAINBOW.tangerine], pills: [[152, 112, RAINBOW.forest, RAINBOW.sun], [48, 18, RAINBOW.tangerine, RAINBOW.tomato]] },
  { base: [RAINBOW.forest, RAINBOW.sun], pills: [[96, 54, RAINBOW.bubblegum, RAINBOW.cobalt]] },
  { base: [RAINBOW.cobalt, RAINBOW.tomato], pills: [[136, 98, RAINBOW.tomato, RAINBOW.bubblegum]] },
  { base: [RAINBOW.bubblegum, RAINBOW.sun], pills: [[70, 30, RAINBOW.sun, RAINBOW.bubblegum]] },
];

const W = 400;
const CX = 200;
const CY = 200;

function point(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const;
}

/** An arc over the top, from angle `from` (left) to angle `to` (right). */
function arc(r: number, from: number, to: number) {
  const [x1, y1] = point(r, from);
  const [x2, y2] = point(r, to);
  const large = from - to > 180 ? 1 : 0;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

interface RainbowArchProps {
  /** Number of rings, 1 to 8. */
  rings?: number;
  /** Radius of the open middle, as a fraction of the arch (0 to 0.9). */
  opening?: number;
  /** Fill for the open middle (defaults to transparent). */
  innerFill?: string;
  /** Let the segments drift along their rings. */
  animate?: boolean;
  /** Start from a different ring, for variety between arches. */
  offset?: number;
  className?: string;
}

/**
 * Outside the footer the arch is calm: one mustard half-disc with a fine dot
 * texture and an optional open middle. No rings, no drift. Props are kept so
 * existing call sites keep working.
 */
export function RainbowArch({ opening = 0.2, innerFill, className }: RainbowArchProps) {
  const raw = useId();
  const id = `ra-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const R = 200;
  const inner = Math.max(0, Math.min(0.9, opening)) * R;
  return (
    <svg viewBox={`0 0 ${W} 200`} aria-hidden className={cn("block overflow-hidden", className)}>
      <defs>
        <pattern id={`${id}-dots`} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="1.2" fill="rgb(35 48 89 / 0.12)" />
        </pattern>
      </defs>
      <path d={`M0 ${CY}A${R} ${R} 0 0 1 ${W} ${CY}Z`} fill={RAINBOW.sun} />
      <path d={`M0 ${CY}A${R} ${R} 0 0 1 ${W} ${CY}Z`} fill={`url(#${id}-dots)`} />
      {inner > 0 && (
        <path d={`M${CX - inner} ${CY}A${inner} ${inner} 0 0 1 ${CX + inner} ${CY}Z`} fill={innerFill ?? "var(--color-paper)"} />
      )}
    </svg>
  );
}

/** Full rainbow rings, used only by the site footer. */
export function RainbowRings({ rings = 6, opening = 0.2, innerFill, animate = true, offset = 0, className }: RainbowArchProps) {
  const reduced = useReducedMotion();
  const raw = useId();
  const id = `ra-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const count = Math.max(1, Math.min(8, rings));
  const R = 200;
  const inner = Math.max(0, Math.min(0.9, opening)) * R;
  const width = (R - inner) / count;
  const moving = animate && !reduced;
  const specs = Array.from({ length: count }, (_, i) => RINGS[(i + offset) % RINGS.length]!);

  return (
    <svg ref={ref} viewBox={`0 0 ${W} 200`} aria-hidden className={cn("block overflow-hidden", className)}>
      <defs>
        {specs.map((ring, i) => (
          <linearGradient key={`b${i}`} id={`${id}-b${i}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={ring.base[0]} />
            <stop offset="1" stopColor={ring.base[1]} />
          </linearGradient>
        ))}
        {specs.flatMap((ring, i) =>
          ring.pills.map((pill, j) => (
            <linearGradient key={`p${i}-${j}`} id={`${id}-p${i}-${j}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0.1" stopColor={pill[2]} />
              <stop offset="0.9" stopColor={pill[3]} />
            </linearGradient>
          )),
        )}
        <pattern id={`${id}-grain`} width="60" height="60" patternUnits="userSpaceOnUse">
          <image href={GRAIN} width="60" height="60" />
        </pattern>
      </defs>

      {innerFill && inner > 0 && <path d={`M${CX - inner} ${CY}A${inner} ${inner} 0 0 1 ${CX + inner} ${CY}Z`} fill={innerFill} />}

      {specs.map((ring, i) => {
        const r = R - width / 2 - i * width;
        return (
          <g key={i}>
            <path d={arc(r, 180, 0)} fill="none" stroke={`url(#${id}-b${i})`} strokeWidth={width + 0.6} />
            {ring.pills.map((pill, j) => {
              const slide = (i + j) % 2 === 0 ? 12 : -10;
              return (
                <g
                  key={j}
                  className={moving ? "animate-arc-slide" : undefined}
                  style={
                    moving
                      ? ({
                          "--slide": `${slide}deg`,
                          transformBox: "view-box",
                          transformOrigin: `${CX}px ${CY}px`,
                          animationDuration: `${8 + ((i * 3 + j * 5) % 7)}s`,
                          animationDelay: `${-((i * 1.7 + j) % 5)}s`,
                          animationPlayState: visible ? "running" : "paused",
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <path
                    d={arc(r, pill[0], pill[1])}
                    fill="none"
                    stroke={`url(#${id}-p${i}-${j})`}
                    strokeWidth={width - 0.4}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* print grain over the rings only */}
      <path
        d={`M0 ${CY}A${R} ${R} 0 0 1 ${W} ${CY}L${CX + inner} ${CY}${inner > 0 ? `A${inner} ${inner} 0 0 0 ${CX - inner} ${CY}` : ""}Z`}
        fill={`url(#${id}-grain)`}
        opacity="0.28"
        style={{ mixBlendMode: "multiply" }}
      />
    </svg>
  );
}
