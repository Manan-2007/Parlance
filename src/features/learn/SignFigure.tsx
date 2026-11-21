/**
 * One frame of signing, drawn as a figure: a neutral head-and-shoulders
 * silhouette, arms from the pose, and each hand built from its 21 metric
 * landmarks placed at its wrist. The same drawing serves the ISLRTC reference
 * and the learner's own tracked hands, so the two can be compared like with
 * like. Geometry matches the landing page's HandTrace.
 */
import type { Anchor } from "@/learn/motion";
import { cn } from "@/lib/cn";

const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
const HANDS = [
  { wrist: 0, world: 2, elbow: 3, shoulder: 1, colour: "#0D21A1" },
  { wrist: 65, world: 67, elbow: 4, shoulder: 2, colour: "#B8901A" },
];
const POSE = 130;
export const FIGURE_W = 160;
export const FIGURE_H = 120;
const SHOULDER_Y = 84;
const SHOULDER_SPAN = 50;
const HAND_SCALE = 165;

type Point = [number, number];

function toView(x: number, y: number, a: Anchor): Point {
  const k = SHOULDER_SPAN / a.span;
  return [FIGURE_W / 2 + (x - a.x) * k, SHOULDER_Y + (y - a.y) * k];
}

function project(frame: Float32Array, hand: (typeof HANDS)[number], a: Anchor) {
  const wx = frame[hand.wrist] ?? 0;
  const wy = frame[hand.wrist + 1] ?? 0;
  if (wx === 0 && wy === 0) return null;
  const [cx, cy] = toView(wx, wy, a);
  const ox = frame[hand.world] ?? 0;
  const oy = frame[hand.world + 1] ?? 0;
  const points: Point[] = [];
  for (let i = 0; i < 21; i += 1) {
    const x = (frame[hand.world + i * 3] ?? 0) - ox;
    const y = (frame[hand.world + i * 3 + 1] ?? 0) - oy;
    points.push([cx + x * HAND_SCALE, cy + y * HAND_SCALE]);
  }
  const ex = frame[POSE + hand.elbow * 3] ?? 0;
  const ey = frame[POSE + hand.elbow * 3 + 1] ?? 0;
  const elbow = ex || ey ? toView(ex, ey, a) : null;
  const sx = frame[POSE + hand.shoulder * 3] ?? 0;
  const sy = frame[POSE + hand.shoulder * 3 + 1] ?? 0;
  const shoulder = sx || sy ? toView(sx, sy, a) : null;
  return { points, elbow, shoulder };
}

interface SignFigureProps {
  frame: Float32Array | null;
  anchor: Anchor | null;
  /** Hand blocks not to draw (frozen in the recording). */
  hide?: readonly boolean[];
  tone?: "reference" | "you";
  mirror?: boolean;
  className?: string;
  label?: string;
}

export function SignFigure({ frame, anchor, hide, tone = "reference", mirror = false, className, label }: SignFigureProps) {
  const hands = frame && anchor ? HANDS.map((hand, block) => (hide?.[block] ? null : project(frame, hand, anchor))) : [null, null];
  const body = tone === "you" ? "#F7E3A1" : "#DEE2F7";
  const arm = tone === "you" ? "#F4DC8A" : "#C9D0F0";
  return (
    <svg
      viewBox={`0 0 ${FIGURE_W} ${FIGURE_H}`}
      className={cn("h-full w-full", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g transform={mirror ? `translate(${FIGURE_W} 0) scale(-1 1)` : undefined}>
        <g fill={body}>
          <ellipse cx="80" cy="44" rx="13" ry="16" />
          <path d="M80 76c-17 0-27 9-29 26l-2 18h62l-2-18c-2-17-12-26-29-26z" />
        </g>
        {hands.map((drawn, block) =>
          drawn?.elbow && drawn.shoulder ? (
            <g key={`arm-${block}`} stroke={arm} strokeLinecap="round" fill="none">
              <line x1={drawn.shoulder[0]} y1={drawn.shoulder[1]} x2={drawn.elbow[0]} y2={drawn.elbow[1]} strokeWidth="7" />
              <line x1={drawn.elbow[0]} y1={drawn.elbow[1]} x2={drawn.points[0]![0]} y2={drawn.points[0]![1]} strokeWidth="5.5" />
            </g>
          ) : null,
        )}
        {hands.map((drawn, block) => {
          if (!drawn) return null;
          const colour = HANDS[block]!.colour;
          return (
            <g key={block}>
              <g stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round">
                {BONES.map(([a, b]) => (
                  <line key={`${a}-${b}`} x1={drawn.points[a]![0]} y1={drawn.points[a]![1]} x2={drawn.points[b]![0]} y2={drawn.points[b]![1]} />
                ))}
              </g>
              <g stroke={colour} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                {BONES.map(([a, b]) => (
                  <line key={`${a}-${b}`} x1={drawn.points[a]![0]} y1={drawn.points[a]![1]} x2={drawn.points[b]![0]} y2={drawn.points[b]![1]} />
                ))}
              </g>
              {drawn.points.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i === 0 ? 2 : 1.35} fill="#FFFFFF" stroke={colour} strokeWidth="0.75" />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
