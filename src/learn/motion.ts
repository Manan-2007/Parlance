/**
 * Compare a learner's signing with an ISLRTC reference recording.
 *
 * Both sides are expressed in the motion library's format-2 frame (169 floats,
 * see ../engine/avatar/signMotion.ts): image-space wrists and pose in square
 * units, metric hand shape from MediaPipe world landmarks. The live tracker
 * produces exactly that layout (`liveFrame`), so the learner and the reference
 * are measured the same way.
 *
 * What is compared, per hand and per frame:
 *   - where the wrist is, in shoulder widths from the shoulder midpoint
 *     (so distance from the camera and body size drop out);
 *   - how bent each finger is (joint angles: independent of hand size and of
 *     how the hand is turned);
 *   - which way the palm faces;
 *   - whether the hand is in the signing space at all.
 * Dynamic time warping lines the two sequences up, so signing faster or slower
 * than the reference is not an error in itself.
 *
 * What is NOT compared: facial expression, mouth, head movement, eye gaze.
 * They carry grammar in ISL, and the UI says so next to every score.
 *
 * Pure functions, no DOM: runs in the browser and under `node --test`.
 */
import {
  FRAME_FLOATS,
  LEFT_WORLD,
  LEFT_WRIST,
  POSE_BLOCK,
  POSE_L_SHOULDER,
  POSE_R_SHOULDER,
  RIGHT_WORLD,
  RIGHT_WRIST,
} from "../engine/avatar/signMotion.ts";

/** The recogniser's x is rescaled onto 16:9; the motion library's is square. */
const REFERENCE_ASPECT = 16 / 9;

/**
 * A wrist more than this many shoulder widths below the shoulder line is
 * hanging at the signer's side, not signing. Same figure ml/build_motion.py
 * uses to trim the library (RESTING_DEPTH).
 */
export const RESTING_DEPTH = 1.05;

const BLOCKS = [
  { wrist: LEFT_WRIST, world: LEFT_WORLD },
  { wrist: RIGHT_WRIST, world: RIGHT_WORLD },
] as const;

/** MediaPipe hand landmark chains: wrist → MCP → PIP → DIP → tip. */
const FINGERS = [
  [0, 1, 2, 3, 4],
  [0, 5, 6, 7, 8],
  [0, 9, 10, 11, 12],
  [0, 13, 14, 15, 16],
  [0, 17, 18, 19, 20],
] as const;

export const FINGER_NAMES = ["thumb", "index finger", "middle finger", "ring finger", "little finger"] as const;

/** Total bend (radians) treated as a fully closed finger; the thumb bends less. */
const FULL_CURL = [2.2, 4.0, 4.0, 4.0, 4.0];

type Vec3 = [number, number, number];

export interface Anchor {
  x: number;
  y: number;
  span: number;
}

export interface HandShape {
  /** 0 = straight, 1 = fully bent, per finger (thumb first). */
  curl: number[];
  /** Angle between index and middle finger, radians. */
  spread: number;
  /** Unit normal out of the palm (camera axes: x right, y down, z away). */
  normal: Vec3;
}

export interface HandFeatures {
  /** Wrist, shoulder widths from the shoulder midpoint (y grows downward). */
  x: number;
  y: number;
  shape: HandShape | null;
}

export interface FrameFeatures {
  /** [image-left block, image-right block]; null when absent or resting. */
  hands: (HandFeatures | null)[];
}

/* ------------------------------------------------------------- frames -- */

/**
 * The live tracker's output as a format-2 frame.
 * `vector`: the recogniser's 141 floats (x on the 16:9 contract);
 * `world`: 126 floats of hand world landmarks; `pose`: the 39-float avatar pose.
 */
export function liveFrame(vector: Float32Array, world: Float32Array, pose: Float32Array, aspect = REFERENCE_ASPECT): Float32Array {
  const out = new Float32Array(FRAME_FLOATS);
  for (let block = 0; block < 2; block += 1) {
    const vx = vector[block * 63] ?? 0;
    const vy = vector[block * 63 + 1] ?? 0;
    if (vx === 0 && vy === 0) continue;
    const { wrist, world: worldOffset } = BLOCKS[block]!;
    out[wrist] = vx * aspect || 1e-5;
    out[wrist + 1] = vy || 1e-5;
    for (let i = 0; i < 63; i += 1) out[worldOffset + i] = world[block * 63 + i] ?? 0;
  }
  for (let i = 0; i < 39 && i < pose.length; i += 1) out[POSE_BLOCK + i] = pose[i]!;
  return out;
}

/** Swap the hands and flip left/right, for learners who sign left-handed. */
export function mirrorFrame(frame: Float32Array): Float32Array {
  const out = new Float32Array(FRAME_FLOATS);
  const anchorX = shoulderMidX(frame);
  const flipX = (x: number) => (x === 0 ? 0 : 2 * anchorX - x || 1e-5);
  for (let block = 0; block < 2; block += 1) {
    const from = BLOCKS[block]!;
    const to = BLOCKS[1 - block]!;
    const wx = frame[from.wrist]!;
    const wy = frame[from.wrist + 1]!;
    if (wx === 0 && wy === 0) continue;
    out[to.wrist] = flipX(wx);
    out[to.wrist + 1] = wy;
    for (let i = 0; i < 21; i += 1) {
      out[to.world + i * 3] = -frame[from.world + i * 3]!;
      out[to.world + i * 3 + 1] = frame[from.world + i * 3 + 1]!;
      out[to.world + i * 3 + 2] = frame[from.world + i * 3 + 2]!;
    }
  }
  // Pose slots come in left/right pairs after the nose: (1,2) (3,4) (5,6) (7,8) (9,10) (11,12).
  const swap = (slot: number) => (slot === 0 ? 0 : slot % 2 === 1 ? slot + 1 : slot - 1);
  for (let slot = 0; slot < 13; slot += 1) {
    const src = POSE_BLOCK + slot * 3;
    const dst = POSE_BLOCK + swap(slot) * 3;
    out[dst] = flipX(frame[src]!);
    out[dst + 1] = frame[src + 1]!;
    out[dst + 2] = frame[src + 2]!;
  }
  return out;
}

function shoulderMidX(frame: Float32Array): number {
  const l = frame[POSE_BLOCK + POSE_L_SHOULDER * 3]!;
  const r = frame[POSE_BLOCK + POSE_R_SHOULDER * 3]!;
  if (l && r) return (l + r) / 2;
  return l || r || 0.89;
}

/**
 * Hand blocks that never move in a recording. The library fills hand dropouts
 * by holding the nearest detection (ml/build_motion.py fill_gaps), so a hand
 * seen in one frame only is held, frozen, for the whole clip — 37 of the 239
 * ISLRTC references have one. A frozen hand says nothing about the sign, so it
 * is ignored rather than compared.
 */
export function frozenBlocks(frames: readonly Float32Array[]): [boolean, boolean] {
  return BLOCKS.map(({ wrist }) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let present = 0;
    for (const frame of frames) {
      const x = frame[wrist]!;
      const y = frame[wrist + 1]!;
      if (x === 0 && y === 0) continue;
      present += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    return present >= 6 && maxX - minX < 1e-6 && maxY - minY < 1e-6;
  }) as [boolean, boolean];
}

/**
 * Interpolate across short hand dropouts in a live recording (fast movement
 * blurs, and MediaPipe loses the hand for a frame or two). Same rule the
 * library was built with: gaps up to `maxGap` frames, interior only.
 */
export function fillHandGaps(frames: readonly Float32Array[], maxGap = 6): Float32Array[] {
  const out = frames.map((frame) => Float32Array.from(frame));
  for (const { wrist, world } of BLOCKS) {
    const present = out.map((f) => f[wrist] !== 0 || f[wrist + 1] !== 0);
    let i = present.indexOf(true);
    const last = present.lastIndexOf(true);
    while (i >= 0 && i < last) {
      if (present[i]) {
        i += 1;
        continue;
      }
      const start = i;
      while (i <= last && !present[i]) i += 1;
      const end = i;
      if (end - start > maxGap) continue;
      const before = out[start - 1]!;
      const after = out[end]!;
      for (let k = start; k < end; k += 1) {
        const t = (k - start + 1) / (end - start + 1);
        const target = out[k]!;
        for (const index of [wrist, wrist + 1]) target[index] = before[index]! * (1 - t) + after[index]! * t;
        for (let j = 0; j < 63; j += 1) target[world + j] = before[world + j]! * (1 - t) + after[world + j]! * t;
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------ anchor -- */

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/** The signer's body frame: median shoulder midpoint and shoulder width. */
export function anchorOf(frames: readonly Float32Array[]): Anchor | null {
  const xs: number[] = [];
  const ys: number[] = [];
  const spans: number[] = [];
  for (const frame of frames) {
    const lx = frame[POSE_BLOCK + POSE_L_SHOULDER * 3]!;
    const ly = frame[POSE_BLOCK + POSE_L_SHOULDER * 3 + 1]!;
    const rx = frame[POSE_BLOCK + POSE_R_SHOULDER * 3]!;
    const ry = frame[POSE_BLOCK + POSE_R_SHOULDER * 3 + 1]!;
    if (!(lx || ly) || !(rx || ry)) continue;
    const span = Math.hypot(lx - rx, ly - ry);
    if (span < 1e-4) continue;
    xs.push((lx + rx) / 2);
    ys.push((ly + ry) / 2);
    spans.push(span);
  }
  if (!spans.length) return null;
  return { x: median(xs), y: median(ys), span: median(spans) };
}

/**
 * How many hands are up in the signing space in one frame, using that frame's
 * own shoulders. Drives "start recording when the hands come up, stop when
 * they go down". `depth` is in shoulder widths below the shoulder line.
 */
export function raisedHands(frame: Float32Array, depth = 0.95): number {
  const lx = frame[POSE_BLOCK + POSE_L_SHOULDER * 3]!;
  const ly = frame[POSE_BLOCK + POSE_L_SHOULDER * 3 + 1]!;
  const rx = frame[POSE_BLOCK + POSE_R_SHOULDER * 3]!;
  const ry = frame[POSE_BLOCK + POSE_R_SHOULDER * 3 + 1]!;
  if (!(lx || ly) || !(rx || ry)) return 0;
  const span = Math.hypot(lx - rx, ly - ry);
  const limit = (ly + ry) / 2 + depth * span;
  let raised = 0;
  for (const { wrist } of BLOCKS) {
    const x = frame[wrist]!;
    const y = frame[wrist + 1]!;
    if ((x !== 0 || y !== 0) && y < limit) raised += 1;
  }
  return raised;
}

/* ---------------------------------------------------------- features -- */

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
const angle = (a: Vec3, b: Vec3): number => {
  const la = norm(a);
  const lb = norm(b);
  if (la < 1e-9 || lb < 1e-9) return 0;
  const cos = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (la * lb);
  return Math.acos(Math.max(-1, Math.min(1, cos)));
};
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Hand shape from 21 3D points in any consistent unit; null if degenerate. */
export function shapeOf(points: readonly Vec3[], block: number): HandShape | null {
  if (points.length < 21) return null;
  const palm = norm(sub(points[9]!, points[0]!));
  if (!Number.isFinite(palm) || palm < 1e-6) return null;
  const curl = FINGERS.map((chain, finger) => {
    let bend = 0;
    for (let j = 1; j < chain.length - 1; j += 1) {
      const a = sub(points[chain[j]!]!, points[chain[j - 1]!]!);
      const b = sub(points[chain[j + 1]!]!, points[chain[j]!]!);
      bend += angle(a, b);
    }
    return Math.min(1, bend / FULL_CURL[finger]!);
  });
  const spread = angle(sub(points[8]!, points[5]!), sub(points[12]!, points[9]!));
  // Index MCP × little MCP gives opposite directions for the two hands, so
  // one block is negated: the normal then points out of the palm for both.
  const raw = cross(sub(points[5]!, points[0]!), sub(points[17]!, points[0]!));
  const length = norm(raw);
  if (length < 1e-12) return null;
  const sign = block === 0 ? 1 : -1;
  const normal: Vec3 = [(raw[0] / length) * sign, (raw[1] / length) * sign, (raw[2] / length) * sign];
  return { curl, spread, normal };
}

function worldPoints(frame: Float32Array, offset: number): Vec3[] | null {
  const points: Vec3[] = [];
  let energy = 0;
  for (let i = 0; i < 21; i += 1) {
    const x = frame[offset + i * 3]!;
    const y = frame[offset + i * 3 + 1]!;
    const z = frame[offset + i * 3 + 2]!;
    energy += Math.abs(x) + Math.abs(y) + Math.abs(z);
    points.push([x, y, z]);
  }
  return energy > 1e-6 ? points : null;
}

export function frameFeatures(frame: Float32Array, anchor: Anchor): FrameFeatures {
  const hands = BLOCKS.map(({ wrist, world }, block) => {
    const wx = frame[wrist]!;
    const wy = frame[wrist + 1]!;
    if (wx === 0 && wy === 0) return null;
    const x = (wx - anchor.x) / anchor.span;
    const y = (wy - anchor.y) / anchor.span;
    if (y > RESTING_DEPTH) return null;
    const points = worldPoints(frame, world);
    return { x, y, shape: points ? shapeOf(points, block) : null };
  });
  return { hands };
}

/**
 * A hand that stays low and nearly still for the whole recording is the
 * signer's idle hand, even when it hangs a little above RESTING_DEPTH (the
 * ISLRTC "hello" signer's sits at 1.01). It is dropped when the other hand is
 * clearly the one signing; a sign with both hands low keeps both.
 */
function dropIdleHand(features: FrameFeatures[]): void {
  const stats = [0, 1].map((block) => {
    const ys: number[] = [];
    const xs: number[] = [];
    for (const f of features) {
      const h = f.hands[block];
      if (h) {
        xs.push(h.x);
        ys.push(h.y);
      }
    }
    if (!ys.length) return null;
    const range = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const low = median(ys);
    return { range, low, activity: range + Math.max(0, 0.8 - low) };
  });
  const [a, b] = stats;
  if (!a || !b) return;
  for (const [idle, other, block] of [
    [a, b, 0],
    [b, a, 1],
  ] as const) {
    if (idle.low > 0.7 && idle.range < 0.3 && other.activity > idle.activity + 0.2) {
      for (const f of features) f.hands[block] = null;
      return;
    }
  }
}

export interface Sequence {
  features: FrameFeatures[];
  anchor: Anchor;
  /** Hand blocks with no usable information (frozen in the recording). */
  ignore: [boolean, boolean];
  /** Index of features[0] in the input frames (leading idle frames are cut). */
  offset: number;
}

/** Features for a whole recording, trimmed to the frames with a hand raised. */
export function sequenceFeatures(frames: readonly Float32Array[]): Sequence | null {
  const anchor = anchorOf(frames);
  if (!anchor) return null;
  const ignore = frozenBlocks(frames);
  const all = frames.map((frame) => frameFeatures(frame, anchor));
  for (const f of all) for (let block = 0; block < 2; block += 1) if (ignore[block]) f.hands[block] = null;
  dropIdleHand(all);
  const active = all.map((f) => f.hands.some(Boolean));
  const first = active.indexOf(true);
  const last = active.lastIndexOf(true);
  if (first < 0) return { features: [], anchor, ignore, offset: 0 };
  const offset = Math.max(0, first - 1);
  return { features: all.slice(offset, Math.min(all.length, last + 2)), anchor, ignore, offset };
}

/* ---------------------------------------------------------- distance -- */

export interface FrameCost {
  total: number;
  position: number;
  shape: number;
  orientation: number;
  presence: number;
}

const WEIGHTS = { position: 1.0, shape: 1.4, orientation: 0.5, presence: 1.1 };
const NO_IGNORE = [false, false] as const;

export function frameCost(user: FrameFeatures, ref: FrameFeatures, ignore: readonly boolean[] = NO_IGNORE): FrameCost {
  let position = 0;
  let shape = 0;
  let orientation = 0;
  let presence = 0;
  let hands = 0;
  let shaped = 0;
  for (let block = 0; block < 2; block += 1) {
    if (ignore[block]) continue;
    const u = user.hands[block] ?? null;
    const r = ref.hands[block] ?? null;
    if (!u && !r) continue;
    hands += 1;
    if (!u || !r) {
      presence += 1;
      continue;
    }
    position += Math.min(1.5, Math.hypot(u.x - r.x, u.y - r.y));
    if (u.shape && r.shape) {
      let diff = 0;
      for (let f = 0; f < 5; f += 1) diff += Math.abs(u.shape.curl[f]! - r.shape.curl[f]!);
      shape += diff / 5 + Math.min(0.5, Math.abs(u.shape.spread - r.shape.spread)) * 0.3;
      orientation += angle(u.shape.normal, r.shape.normal) / Math.PI;
      shaped += 1;
    }
  }
  if (!hands) return { total: 0, position: 0, shape: 0, orientation: 0, presence: 0 };
  const paired = hands - presence;
  const pos = paired ? position / paired : 0;
  const shp = shaped ? shape / shaped : 0;
  const ori = shaped ? orientation / shaped : 0;
  const pre = presence / hands;
  const total =
    (paired / hands) * (WEIGHTS.position * pos + WEIGHTS.shape * shp + WEIGHTS.orientation * ori) +
    WEIGHTS.presence * pre;
  return { total, position: pos, shape: shp, orientation: ori, presence: pre };
}

export interface Alignment {
  /** Mean frame cost along the warping path. */
  distance: number;
  /** Pairs of [user frame, reference frame]. */
  path: [number, number][];
  /** Mean of each cost component along the path. */
  components: Omit<FrameCost, "total">;
}

/** Penalty for a step that holds one sequence still, so warping stays plausible. */
const STEP_PENALTY = 0.04;

export function align(user: readonly FrameFeatures[], ref: readonly FrameFeatures[], ignore: readonly boolean[] = NO_IGNORE): Alignment {
  const n = user.length;
  const m = ref.length;
  if (!n || !m) return { distance: Infinity, path: [], components: { position: 0, shape: 0, orientation: 0, presence: 0 } };
  const costs: FrameCost[] = new Array(n * m);
  for (let i = 0; i < n; i += 1) for (let j = 0; j < m; j += 1) costs[i * m + j] = frameCost(user[i]!, ref[j]!, ignore);
  const acc = new Float64Array(n * m).fill(Infinity);
  const steps = new Float64Array(n * m);
  const from = new Int8Array(n * m);
  acc[0] = costs[0]!.total;
  steps[0] = 1;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < m; j += 1) {
      if (i === 0 && j === 0) continue;
      const here = costs[i * m + j]!.total;
      let best = Infinity;
      let move = 0;
      let len = 0;
      if (i > 0 && j > 0 && acc[(i - 1) * m + j - 1]! < best) {
        best = acc[(i - 1) * m + j - 1]!;
        move = 0;
        len = steps[(i - 1) * m + j - 1]!;
      }
      if (i > 0 && acc[(i - 1) * m + j]! + STEP_PENALTY < best) {
        best = acc[(i - 1) * m + j]! + STEP_PENALTY;
        move = 1;
        len = steps[(i - 1) * m + j]!;
      }
      if (j > 0 && acc[i * m + j - 1]! + STEP_PENALTY < best) {
        best = acc[i * m + j - 1]! + STEP_PENALTY;
        move = 2;
        len = steps[i * m + j - 1]!;
      }
      acc[i * m + j] = best + here;
      steps[i * m + j] = len + 1;
      from[i * m + j] = move;
    }
  }
  const path: [number, number][] = [];
  let i = n - 1;
  let j = m - 1;
  for (;;) {
    path.push([i, j]);
    if (i === 0 && j === 0) break;
    const move = from[i * m + j];
    if (move === 0) {
      i -= 1;
      j -= 1;
    } else if (move === 1) i -= 1;
    else j -= 1;
  }
  path.reverse();
  const components = { position: 0, shape: 0, orientation: 0, presence: 0 };
  for (const [a, b] of path) {
    const c = costs[a * m + b]!;
    components.position += c.position;
    components.shape += c.shape;
    components.orientation += c.orientation;
    components.presence += c.presence;
  }
  for (const key of Object.keys(components) as (keyof typeof components)[]) components[key] /= path.length;
  return { distance: acc[n * m - 1]! / steps[n * m - 1]!, path, components };
}

/* ------------------------------------------------------------ scoring -- */

/**
 * Distance → score, set from scripts/calibrate-practice.mjs (2026-11-20):
 *   - a distorted copy of a reference (speed, position, camera distance,
 *     jitter, dropped frames): median distance 0.27, p90 0.34 → scores 100;
 *     matched to its own sign first among all 239 in 98.7% of cases;
 *   - INCLUDE recordings by other signers of the same word (hello, thank you):
 *     about 0.6-0.8, i.e. scores of roughly 60-80;
 *   - a different sign: p10 0.94, median 1.15 → scores of 35 and below.
 * INCLUDE often uses regional variants and compounds, so it is a rough check
 * of the scale, not an accuracy figure.
 */
export const GOOD_DISTANCE = 0.55;
export const BAD_DISTANCE = 1.05;

export function scoreOf(distance: number, good = GOOD_DISTANCE, bad = BAD_DISTANCE): number {
  if (!Number.isFinite(distance)) return 0;
  const t = (bad - distance) / (bad - good);
  return Math.round(100 * Math.max(0, Math.min(1, 0.15 + 0.85 * t)));
}

/* ----------------------------------------------------------- feedback -- */

export type TipKind =
  | "both-hands"
  | "one-hand"
  | "other-hand"
  | "higher"
  | "lower"
  | "inward"
  | "outward"
  | "finger"
  | "spread"
  | "palm"
  | "bigger"
  | "smaller"
  | "faster"
  | "slower";

export interface Tip {
  kind: TipKind;
  /** Plain-language advice, second person. */
  text: string;
  /** 0-1, how far off this aspect was; tips are sorted by it. */
  severity: number;
}

export type Dimension = "hands" | "position" | "shape" | "movement";

export interface PracticeResult {
  score: number;
  distance: number;
  /** 0-100 per aspect. */
  dimensions: Record<Dimension, number>;
  tips: Tip[];
  path: [number, number][];
  userSeconds: number;
  referenceSeconds: number;
  /**
   * The frames that were compared, trimmed to the signing, for a side-by-side
   * replay along `path`. `user` is as recorded (not mirrored for left-handers).
   */
  frames: { user: Float32Array[]; reference: Float32Array[] };
}

export type PracticeError = "no-body" | "no-hands" | "too-short";

/** Where on the body a height (shoulder widths, y down) falls, in words. */
export function bodyZone(y: number): string {
  if (y < -0.85) return "forehead height";
  if (y < -0.4) return "face height";
  if (y < 0.1) return "chin and neck height";
  if (y < 0.65) return "chest height";
  return "stomach height";
}

/** Which way a palm normal points, in words a learner can act on. */
export function palmDirection(n: Vec3): string {
  const [x, y, z] = n;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const az = Math.abs(z);
  if (az >= ax && az >= ay) return z < 0 ? "forward, toward the person you are signing to" : "toward you";
  if (ay >= ax) return y > 0 ? "down" : "up";
  return "to the side";
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const toScore = (value: number, good: number, bad: number) => Math.round(100 * clamp01((bad - value) / (bad - good)));

function dominantBlock(features: readonly FrameFeatures[]): number {
  let left = 0;
  let right = 0;
  for (const f of features) {
    if (f.hands[0]) left += 1;
    if (f.hands[1]) right += 1;
  }
  return right > left ? 1 : 0;
}

function extent(features: readonly FrameFeatures[], block: number): number {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const f of features) {
    const h = f.hands[block];
    if (!h) continue;
    minX = Math.min(minX, h.x);
    maxX = Math.max(maxX, h.x);
    minY = Math.min(minY, h.y);
    maxY = Math.max(maxY, h.y);
  }
  return Number.isFinite(minX) ? Math.hypot(maxX - minX, maxY - minY) : 0;
}

const share = (features: readonly FrameFeatures[], test: (f: FrameFeatures) => boolean) =>
  features.length ? features.filter(test).length / features.length : 0;

/**
 * Score one attempt against one reference and explain the biggest gaps.
 * `fps` is the capture rate of both sequences (the library is 15 fps).
 */
export function comparePractice(
  userFrames: readonly Float32Array[],
  referenceFrames: readonly Float32Array[],
  options: { fps?: number; leftHanded?: boolean } = {},
): PracticeResult | PracticeError {
  const fps = options.fps ?? 15;
  const filled = fillHandGaps(userFrames);
  const frames = options.leftHanded ? filled.map(mirrorFrame) : filled;
  const user = sequenceFeatures(frames);
  if (!user) return "no-body";
  if (!user.features.length) return "no-hands";
  const activeFrames = user.features.filter((f) => f.hands.some(Boolean)).length;
  if (activeFrames < 4) return "too-short";
  const ref = sequenceFeatures(referenceFrames);
  if (!ref || !ref.features.length) return "no-hands";

  const u = user.features;
  const r = ref.features;
  const ignore = ref.ignore;
  for (const f of u) for (let block = 0; block < 2; block += 1) if (ignore[block]) f.hands[block] = null;
  const alignment = align(u, r, ignore);
  const tips: Tip[] = [];
  /** The recording lost one hand: how many hands the sign uses is unknown. */
  const handsKnown = !ignore[0] && !ignore[1];

  /* hands used */
  const refTwo = share(r, (f) => Boolean(f.hands[0] && f.hands[1]));
  const userTwo = share(u, (f) => Boolean(f.hands[0] && f.hands[1]));
  const refMain = dominantBlock(r);
  const userMain = dominantBlock(u);
  if (!handsKnown) {
    // Say nothing about how many hands to use.
  } else if (refTwo > 0.45 && userTwo < 0.2) {
    tips.push({ kind: "both-hands", text: "This sign uses both hands. Bring your other hand up into the signing space too.", severity: 0.95 });
  } else if (refTwo < 0.15 && userTwo > 0.5) {
    tips.push({ kind: "one-hand", text: "This is a one-handed sign. Keep your other hand relaxed and down.", severity: 0.7 });
  } else if (refTwo < 0.3 && refMain !== userMain) {
    tips.push({
      kind: "other-hand",
      text: options.leftHanded
        ? "Sign with your left hand as the main hand, or switch off left-handed mode."
        : "Use your right hand as the main hand, or switch on left-handed mode if you are left-handed.",
      severity: 0.8,
    });
  }

  /* location, shape and palm of the main hand, along the alignment */
  const main = refMain;
  let dy = 0;
  let dOut = 0;
  let located = 0;
  const curlDiff = [0, 0, 0, 0, 0];
  let spreadDiff = 0;
  let shaped = 0;
  let palmAngle = 0;
  const refNormal: Vec3 = [0, 0, 0];
  let refY = 0;
  for (const [i, j] of alignment.path) {
    const uh = u[i]!.hands[main];
    const rh = r[j]!.hands[main];
    if (!uh || !rh) continue;
    dy += uh.y - rh.y;
    dOut += Math.abs(uh.x) - Math.abs(rh.x);
    refY += rh.y;
    located += 1;
    if (uh.shape && rh.shape) {
      for (let f = 0; f < 5; f += 1) curlDiff[f]! += uh.shape.curl[f]! - rh.shape.curl[f]!;
      spreadDiff += uh.shape.spread - rh.shape.spread;
      palmAngle += angle(uh.shape.normal, rh.shape.normal);
      refNormal[0] += rh.shape.normal[0];
      refNormal[1] += rh.shape.normal[1];
      refNormal[2] += rh.shape.normal[2];
      shaped += 1;
    }
  }
  if (located) {
    dy /= located;
    dOut /= located;
    refY /= located;
    if (dy > 0.3) tips.push({ kind: "higher", text: `Raise your hand. The ISLRTC signer makes this sign at ${bodyZone(refY)}.`, severity: clamp01(dy / 0.8) });
    else if (dy < -0.3) tips.push({ kind: "lower", text: `Bring your hand lower. The ISLRTC signer makes this sign at ${bodyZone(refY)}.`, severity: clamp01(-dy / 0.8) });
    if (dOut > 0.35) tips.push({ kind: "inward", text: "Bring your hand closer to the middle of your body.", severity: clamp01(dOut / 0.9) * 0.8 });
    else if (dOut < -0.35) tips.push({ kind: "outward", text: "Move your hand further out to the side.", severity: clamp01(-dOut / 0.9) * 0.8 });
  }
  if (shaped) {
    const means = curlDiff.map((d) => d / shaped);
    const worst = means
      .map((d, finger) => ({ d, finger }))
      .filter(({ d }) => Math.abs(d) > 0.2)
      .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      .slice(0, 2);
    for (const { d, finger } of worst) {
      const name = FINGER_NAMES[finger]!;
      tips.push({
        kind: "finger",
        text: d > 0 ? `Straighten your ${name}.` : `Bend your ${name} more.`,
        severity: clamp01(Math.abs(d) / 0.6),
      });
    }
    const spread = spreadDiff / shaped;
    if (Math.abs(spread) > 0.35) {
      tips.push({
        kind: "spread",
        text: spread > 0 ? "Keep your index and middle fingers closer together." : "Spread your index and middle fingers apart.",
        severity: clamp01(Math.abs(spread) / 0.9) * 0.7,
      });
    }
    const palm = palmAngle / shaped;
    if (palm > 1.1) {
      tips.push({
        kind: "palm",
        text: `Turn your hand: in the ISLRTC sign the palm faces ${palmDirection(refNormal)}.`,
        severity: clamp01((palm - 0.8) / 1.4),
      });
    }
  }

  /* movement size and pace */
  const refExtent = extent(r, main);
  const userExtent = extent(u, options.leftHanded ? main : userMain);
  let movement = 100;
  if (refExtent > 0.25) {
    const ratio = userExtent / refExtent;
    if (ratio < 0.45) tips.push({ kind: "bigger", text: "Make the movement bigger, closer to the reference.", severity: clamp01((0.6 - ratio) / 0.6) * 0.75 });
    else if (ratio > 2.2 && userExtent > 0.4) tips.push({ kind: "smaller", text: "Keep the movement smaller and more controlled.", severity: clamp01((ratio - 1.8) / 2) * 0.6 });
    movement = Math.round(100 * clamp01(1 - Math.abs(Math.log(Math.max(ratio, 0.05))) / Math.log(3)));
  }
  const userSeconds = u.length / fps;
  const referenceSeconds = r.length / fps;
  const pace = userSeconds / Math.max(0.2, referenceSeconds);
  if (pace > 2.2) tips.push({ kind: "faster", text: `You can sign a little quicker: the reference takes about ${referenceSeconds.toFixed(1)} s.`, severity: 0.3 });
  else if (pace < 0.45) tips.push({ kind: "slower", text: "Slow down and give each part of the sign time.", severity: 0.35 });

  tips.sort((a, b) => b.severity - a.severity);
  const c = alignment.components;
  return {
    score: scoreOf(alignment.distance),
    distance: alignment.distance,
    dimensions: {
      hands: toScore(c.presence, 0.05, 0.5),
      position: toScore(c.position, 0.15, 0.7),
      shape: toScore(c.shape * 0.75 + c.orientation * 0.25, 0.1, 0.4),
      movement,
    },
    tips: tips.slice(0, 3),
    path: alignment.path,
    userSeconds,
    referenceSeconds,
    frames: {
      user: filled.slice(user.offset, user.offset + u.length),
      reference: referenceFrames.slice(ref.offset, ref.offset + r.length),
    },
  };
}

export function isPracticeError(value: PracticeResult | PracticeError): value is PracticeError {
  return typeof value === "string";
}
