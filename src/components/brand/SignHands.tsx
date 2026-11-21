/**
 * Two illustrated hands that fingerspell the ISL manual alphabet.
 *
 * Every digit is two round-capped lines (ink outline + fill) whose length and
 * angle come from CSS custom properties, as do each hand's position and
 * rotation, so letter-to-letter changes are pure CSS transitions (no React
 * re-render per letter). Geometry and letter scenes live in lib/fingerspell.
 *
 * These are illustrations of ISL fingerspelling, not a reference: shapes
 * should be reviewed by a Deaf ISL signer before being used for teaching.
 */
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { DIGITS, SCENE, applyPose, sceneFor, sceneVars, spell, type SpellOptions } from "@/lib/fingerspell";
import { cn } from "@/lib/cn";

export interface SignHandsProps {
  /** Letter A–Z, or a decorative key: REST, HELLO, OPEN, FLAT, POINT, FIST, V2. */
  letter?: string;
  /** CSS width, e.g. "16rem" or "100%". */
  size?: string;
  fill?: string;
  sleeve?: string;
  ink?: string;
  /** Frame a single centred hand (for icons and the logo). */
  crop?: boolean;
  /** Accessible name. Without it the hands are decorative. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const FINGERS = (["p", "r", "m", "i"] as const).map((k) => ({ k, ...DIGITS[k] }));
const THUMB = DIGITS.t;
const PALM =
  "M50 152 C50 124 66 114 100 114 C134 114 150 124 150 152 L148 186 C146 214 128 230 100 230 C72 230 54 214 52 186 Z";

export const SignHands = forwardRef<SVGSVGElement, SignHandsProps>(function SignHands(
  { letter = "REST", size = "16rem", fill, sleeve, ink, crop = false, label, className, style },
  forwarded,
) {
  const ref = useRef<SVGSVGElement>(null);
  useImperativeHandle(forwarded, () => ref.current as SVGSVGElement);

  // Initial pose is rendered inline; later changes go through applyPose so
  // the browser transitions between them.
  const initial = useMemo(() => sceneVars(letter), []); // eslint-disable-line react-hooks/exhaustive-deps
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    applyPose(ref.current, letter);
  }, [letter]);

  const vars = {
    ...initial,
    "--hand-size": size,
    ...(fill ? { "--hand-fill": fill } : {}),
    ...(sleeve ? { "--hand-sleeve": sleeve } : {}),
    ...(ink ? { "--hand-ink": ink } : {}),
    ...style,
  } as CSSProperties;

  return (
    <svg
      ref={ref}
      className={cn("sign-hands", crop && "sign-hands--crop", className)}
      viewBox={crop ? "80 7 200 270" : `0 0 ${SCENE.w} ${SCENE.h}`}
      style={vars}
      data-letter={letter.toUpperCase()}
      data-motion={sceneFor(letter).motion ?? ""}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g className="sh-scene">
        {(["b", "d"] as const).map((h) => (
          <g key={h} className="sh-hand" data-h={h}>
            <g className="sh-inner">
              <rect className="sh-sleeve" x="58" y="226" width="84" height="60" rx="14" />
              <path className="sh-cuff" d="M62 232 H138" />
              {FINGERS.map((f) => (
                <g key={f.k} className="sh-digit" data-d={f.k} style={{ "--ox": `${f.x}px`, "--oy": `${f.y}px` } as CSSProperties}>
                  <line className="o" x1={f.x} y1={f.y} x2={f.x} y2={f.y - f.len} pathLength={1} />
                  <line className="n" x1={f.x} y1={f.y} x2={f.x} y2={f.y - f.len} pathLength={1} />
                </g>
              ))}
              <path className="sh-palm" d={PALM} />
              <path className="sh-crease" d="M78 196 C90 204 112 204 124 194" />
              <g className="sh-digit sh-thumb" data-d="t" style={{ "--ox": `${THUMB.x}px`, "--oy": `${THUMB.y}px` } as CSSProperties}>
                <line className="o" x1={THUMB.x} y1={THUMB.y} x2={THUMB.x} y2={THUMB.y - THUMB.len} pathLength={1} />
                <line className="n" x1={THUMB.x} y1={THUMB.y} x2={THUMB.x} y2={THUMB.y - THUMB.len} pathLength={1} />
              </g>
            </g>
          </g>
        ))}

        {/* motion marks for letters that move */}
        <g className="sh-marks">
          <g className="sh-motion" data-for="j">
            <path d="M0 -34 C0 6 0 18 -14 24 C-26 30 -36 20 -34 10" pathLength={1} />
            <path d="M-40 16 L-34 8 L-26 14" />
          </g>
          <g className="sh-motion" data-for="z">
            <path d="M-26 -22 H26 L-26 22 H26" pathLength={1} />
          </g>
          <g className="sh-motion" data-for="brush">
            <path d="M-34 26 C-6 8 14 -6 30 -28" pathLength={1} />
            <path d="M18 -28 L30 -28 L30 -16" />
          </g>
          <g className="sh-motion" data-for="circle">
            <path d="M0 -16 A16 16 0 1 1 -15 -5" pathLength={1} />
            <path d="M-22 -10 L-15 -5 L-10 -12" />
          </g>
          <g className="sh-motion" data-for="wave">
            <path d="M-92 -50 C-102 -34 -102 -16 -92 0" pathLength={1} />
            <path d="M92 -50 C102 -34 102 -16 92 0" pathLength={1} />
          </g>
        </g>
      </g>
    </svg>
  );
});

/** Letter tiles under a spelling hand; the current one is raised. */
export function LetterTiles({ word, active, className }: { word: string; active: number; className?: string }) {
  const letters = cleanWord(word).split("");
  return (
    <div className={cn("sh-tiles", className)} aria-hidden>
      {letters.map((c, i) =>
        c === " " ? (
          <span key={i} className="sh-tile is-space" />
        ) : (
          <span key={i} className={cn("sh-tile", i === active && "is-on", active >= 0 && i < active && "is-done")}>
            {c}
          </span>
        ),
      )}
    </div>
  );
}

export function cleanWord(word: string) {
  return word.toUpperCase().replace(/[^A-Z ]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Fingerspell `word` on a SignHands ref. Restarts whenever `word` or `run`
 * changes; returns the index of the current letter (-1 between loops).
 */
export function useFingerspell(
  ref: RefObject<SVGSVGElement | null>,
  word: string,
  opts: SpellOptions & { run?: boolean | number; rest?: string } = {},
) {
  const { run = true, interval, loop, pause, onDone, rest = "REST" } = opts;
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    if (!run) return;
    const clean = cleanWord(word);
    if (!clean) {
      applyPose(ref.current, rest);
      setIndex(-1);
      return;
    }
    const cancel = spell(ref.current, clean, {
      interval,
      loop,
      pause,
      onLetter: (_l, i) => setIndex(i),
      onDone,
    });
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, run, interval, loop, pause]);
  return index;
}
