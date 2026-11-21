/**
 * Flat illustrated people: a round head, a bowl of hair, a big bust of
 * colour. Drawn from simple SVG shapes in the Parlance palette and purely
 * decorative (aria-hidden).
 *
 * The poses are deliberately not signs. "rest" has the arms down, "wave" is a
 * casual open-hand hello wave, and "hold" holds a phone. Never describe or
 * label any of them as an ISL sign.
 */
import { useId } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { HandShape, type HandColor } from "./Hands";

export type PalPose = "rest" | "wave" | "hold";

const SKIN = { light: "#F6D2B8", medium: "#D9A27A", deep: "#8D5A3B" } as const;
const OUTFIT = {
  cobalt: "#3C5A99",
  forest: "#3C5A99",
  tangerine: "#E3826B",
  lilac: "#A9B4CC",
  sun: "#E6C55C",
  bubblegum: "#E3A797",
  navy: "#233059",
  /* Muted tones for calm surfaces. */
  slate: "#3D4A6B",
  clay: "#C0714D",
  sage: "#6680B3",
} as const;
const HAIR_COLOR = { navy: "#233059", brown: "#4A2C1A", ink: "#233059" } as const;

interface PalProps {
  pose?: PalPose;
  outfit?: keyof typeof OUTFIT;
  skin?: keyof typeof SKIN;
  hair?: "short" | "bun" | "curly";
  hairColor?: keyof typeof HAIR_COLOR;
  /** Gentle idle motion (a bob, and the wave). Off under reduced motion. */
  animate?: boolean;
  className?: string;
}

function Hair({ style, fill }: { style: NonNullable<PalProps["hair"]>; fill: string }) {
  if (style === "curly") {
    return (
      <g fill={fill}>
        {[
          [35, 50, 10],
          [40, 36, 11],
          [52, 28, 11.5],
          [67, 27, 11.5],
          [80, 35, 11],
          [85, 49, 10],
        ].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    );
  }
  return (
    <g fill={fill}>
      {/* A bowl cut with a straight fringe. */}
      <path d="M31 60C29 36 42 24 60 24s31 12 29 36c-1-6-3-10-6-13H37c-3 3-5 7-6 13Z" />
      {style === "bun" && <circle cx="60" cy="19" r="10" />}
    </g>
  );
}

export function Pal({
  pose = "rest",
  outfit = "cobalt",
  skin = "light",
  hair = "short",
  hairColor = "navy",
  animate = false,
  className,
}: PalProps) {
  const reduced = useReducedMotion();
  const moving = animate && !reduced;
  const clipId = `pal-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const body = OUTFIT[outfit];
  const tone = SKIN[skin];
  const handColor: HandColor = skin;

  return (
    <svg viewBox="0 0 120 140" aria-hidden className={cn("shrink-0 overflow-visible", className)}>
      <g className={moving ? "animate-bob" : undefined}>
        {/* body: one big bust of colour */}
        <path d="M14 140c0-36 19-56 46-56s46 20 46 56Z" fill={body} />
        <path d="M50 86c2 7 18 7 20 0Z" fill={tone} />

        {/* head */}
        <circle cx="33" cy="60" r="5" fill={tone} />
        <circle cx="87" cy="60" r="5" fill={tone} />
        <circle cx="60" cy="57" r="27" fill={tone} />
        <Hair style={hair} fill={HAIR_COLOR[hairColor]} />
        <circle cx="51" cy="61" r="2.9" fill="#233059" />
        <circle cx="69" cy="61" r="2.9" fill="#233059" />
        <path d="M55 70q5 4 10 0" fill="none" stroke="#233059" strokeWidth="2.4" strokeLinecap="round" />

        {pose === "wave" && (
          /* A casual hello wave of an open hand, from the shoulder. */
          <g
            className={moving ? "animate-hand-wave" : undefined}
            style={{ transformBox: "view-box", transformOrigin: "92px 104px" }}
          >
            <path d="M90 108 106 80" stroke={body} strokeWidth="15" strokeLinecap="round" />
            <g transform="translate(107 78) scale(0.36)">
              <HandShape color={handColor} />
            </g>
          </g>
        )}

        {pose === "hold" && (
          <g>
            <defs>
              <clipPath id={clipId}>
                <rect x="47" y="93" width="26" height="40" rx="5" />
              </clipPath>
            </defs>
            <rect x="45" y="91" width="30" height="44" rx="6.5" fill="#233059" />
            <g clipPath={`url(#${clipId})`}>
              <rect x="47" y="93" width="26" height="40" fill="#FFFFFF" />
              <rect x="50.5" y="99" width="16" height="7.5" rx="3.75" fill="#E6C55C" />
              <rect x="54" y="110" width="15.5" height="7.5" rx="3.75" fill="#8EA0C6" />
              <rect x="50.5" y="121" width="11" height="7.5" rx="3.75" fill="#E3826B" />
            </g>
            <circle cx="45.5" cy="115" r="7" fill={tone} />
            <circle cx="74.5" cy="115" r="7" fill={tone} />
          </g>
        )}
      </g>
    </svg>
  );
}
