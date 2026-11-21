/**
 * The avatar's motion format, loader and player.
 *
 * Mirrors the layout written by ml/build_motion.py. One file per sign, fetched
 * the first time that sign is needed and cached for the session — the whole
 * library is several megabytes, but a sentence only ever needs a handful of
 * words, so nothing is paid for up front.
 *
 * Frame layout, format 2, 169 floats:
 *
 *     [  0 :  2 ]  left  wrist, image space (x, y); 0,0 means absent
 *     [  2 : 65 ]  left  hand, 21 world landmarks (x, y, z) in metres
 *     [ 65 : 67 ]  right wrist, image space
 *     [ 67 :130 ]  right hand, 21 world landmarks
 *     [130 :169 ]  pose, image space (x, y, z) for 13 points — see POSE_* below
 *
 * Image-space values place a hand in the signing space around the body; the
 * world landmarks carry its actual 3D shape. Both are needed — see the header of
 * ml/build_motion.py, and skeleton.ts for what is done with them.
 *
 * Format 1 stored only five pose points and no pose depth. Files in that layout
 * are upgraded on load (see `upgradeFrame`) so a half-finished library rebuild
 * degrades instead of breaking, but everything shipped is format 2.
 */

export const POSE_POINTS = 13;
export const POSE_STRIDE = 3;
export const POSE_BLOCK = 130;
export const FRAME_FLOATS = POSE_BLOCK + POSE_POINTS * POSE_STRIDE; // 169

export const LEFT_WRIST = 0;
export const LEFT_WORLD = 2;
export const RIGHT_WRIST = 65;
export const RIGHT_WORLD = 67;

/** Pose slots. The order is fixed by POSE_INDICES in ml/build_motion.py. */
export const POSE_NOSE = 0;
export const POSE_L_SHOULDER = 1;
export const POSE_R_SHOULDER = 2;
export const POSE_L_ELBOW = 3;
export const POSE_R_ELBOW = 4;
export const POSE_L_WRIST = 5;
export const POSE_R_WRIST = 6;
export const POSE_L_HIP = 7;
export const POSE_R_HIP = 8;
export const POSE_L_EAR = 9;
export const POSE_R_EAR = 10;
export const POSE_L_EYE = 11;
export const POSE_R_EYE = 12;

/** Legacy layout, kept only so an old file loads rather than exploding. */
const V1_FLOATS = 140;
const V1_POSE_BLOCK = 130;
const V1_POSE_POINTS = 5;

export interface SignMotion {
  gloss: string;
  english: string;
  pos: string;
  fps: number;
  /** Conditioned, typed frames. Never the raw arrays from the JSON. */
  frames: Float32Array[];
}

export interface ManifestEntry {
  english: string;
  pos: string;
  frames: number;
  seconds: number;
  twoHanded: boolean;
  /** Fraction of the sign with at least one hand tracked. */
  coverage?: number;
  quality: number;
}

export interface SignManifest {
  format?: number;
  fps: number;
  signs: Record<string, ManifestEntry>;
}

/* ----------------------------------------------------------------- loading -- */

const cache = new Map<string, SignMotion>();
const inFlight = new Map<string, Promise<SignMotion | null>>();

let manifestPromise: Promise<SignManifest> | null = null;

export function loadManifest(): Promise<SignManifest> {
  manifestPromise ??= fetch(`${import.meta.env?.BASE_URL ?? "/"}signs/manifest.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`manifest ${response.status}`);
      return response.json() as Promise<SignManifest>;
    })
    .catch(() => ({ fps: 15, signs: {} }));
  return manifestPromise;
}

interface RawMotion {
  gloss: string;
  english: string;
  pos: string;
  fps: number;
  format?: number;
  frames: number[][];
}

export function loadSign(gloss: string): Promise<SignMotion | null> {
  const cached = cache.get(gloss);
  if (cached) return Promise.resolve(cached);

  let pending = inFlight.get(gloss);
  if (!pending) {
    pending = fetch(`${import.meta.env?.BASE_URL ?? "/"}signs/${encodeURIComponent(gloss)}.json`)
      .then(async (response) => {
        if (!response.ok) return null;
        const raw = (await response.json()) as RawMotion;
        if (!Array.isArray(raw.frames) || raw.frames.length === 0) return null;
        const motion: SignMotion = {
          gloss: raw.gloss,
          english: raw.english,
          pos: raw.pos,
          fps: raw.fps || 15,
          frames: raw.frames.map(upgradeFrame),
        };
        cache.set(gloss, motion);
        return motion;
      })
      .catch(() => null)
      .finally(() => inFlight.delete(gloss));
    inFlight.set(gloss, pending);
  }
  return pending;
}

/** Warm the cache without waiting — used the moment a phrase is glossed. */
/**
 * One JSON row to a typed frame, promoting format 1 on the way.
 *
 * A format-1 file has five pose points with no depth. They map onto the first
 * five slots of the new block; the eight it does not have stay zero, which is
 * the "absent" convention every consumer already handles. The result is a
 * figure with a working torso and arms whose depth is inferred rather than
 * measured — degraded, not broken.
 */
function upgradeFrame(row: number[]): Float32Array {
  const out = new Float32Array(FRAME_FLOATS);
  if (row.length >= FRAME_FLOATS) {
    out.set(row.length === FRAME_FLOATS ? row : row.slice(0, FRAME_FLOATS));
    return out;
  }
  if (row.length !== V1_FLOATS) {
    out.set(row.slice(0, Math.min(row.length, FRAME_FLOATS)));
    return out;
  }
  for (let i = 0; i < V1_POSE_BLOCK; i += 1) out[i] = row[i];
  for (let slot = 0; slot < V1_POSE_POINTS; slot += 1) {
    out[POSE_BLOCK + slot * POSE_STRIDE] = row[V1_POSE_BLOCK + slot * 2];
    out[POSE_BLOCK + slot * POSE_STRIDE + 1] = row[V1_POSE_BLOCK + slot * 2 + 1];
  }
  return out;
}

/* ----------------------------------------------------------- interpolation -- */

/**
 * Read a sign at an arbitrary (fractional) frame position.
 *
 * Blending two frames component-wise is only valid where both frames have the
 * same parts present: interpolating between "hand here" and "no hand" would
 * produce a hand at half strength in the wrong place. So presence is taken from
 * the nearer frame, and a part present in only one of the two is used as-is.
 */
export function sampleFrame(
  motion: SignMotion,
  position: number,
  out: Float32Array,
): Float32Array {
  const frames = motion.frames;
  const clamped = Math.max(0, Math.min(frames.length - 1, position));
  const low = Math.floor(clamped);
  const high = Math.min(frames.length - 1, low + 1);
  const t = clamped - low;
  return mixFrames(frames[low], frames[high], t, out);
}

/**
 * Blend two whole frames. Used both for sub-frame sampling inside a sign and for
 * the transition between two signs, which is why it lives on its own.
 */
export function mixFrames(
  a: Float32Array,
  b: Float32Array,
  t: number,
  out: Float32Array,
): Float32Array {
  blendHand(out, a, b, t, LEFT_WRIST, LEFT_WORLD);
  blendHand(out, a, b, t, RIGHT_WRIST, RIGHT_WORLD);
  for (let slot = 0; slot < POSE_POINTS; slot += 1) {
    const base = POSE_BLOCK + slot * POSE_STRIDE;
    const inA = a[base] !== 0 || a[base + 1] !== 0;
    const inB = b[base] !== 0 || b[base + 1] !== 0;
    if (inA && inB) {
      for (let axis = 0; axis < POSE_STRIDE; axis += 1) {
        out[base + axis] = a[base + axis] * (1 - t) + b[base + axis] * t;
      }
    } else {
      const source = inA && !inB ? a : !inA && inB ? b : t < 0.5 ? a : b;
      for (let axis = 0; axis < POSE_STRIDE; axis += 1) {
        out[base + axis] = source[base + axis];
      }
    }
  }
  return out;
}

function blendHand(
  out: Float32Array,
  a: Float32Array,
  b: Float32Array,
  t: number,
  wrist: number,
  world: number,
): void {
  const inA = a[wrist] !== 0 || a[wrist + 1] !== 0;
  const inB = b[wrist] !== 0 || b[wrist + 1] !== 0;
  const copy = (source: Float32Array) => {
    out[wrist] = source[wrist];
    out[wrist + 1] = source[wrist + 1];
    for (let i = 0; i < 63; i += 1) out[world + i] = source[world + i];
  };
  const clear = () => {
    out[wrist] = 0;
    out[wrist + 1] = 0;
    for (let i = 0; i < 63; i += 1) out[world + i] = 0;
  };

  if (!inA && !inB) return clear();
  // A hand present on only one side is used as-is for the whole blend rather
  // than fading toward the origin. The rig fades its opacity-equivalent — the
  // held-shape strength in skeleton.ts — so the hand leaves smoothly without
  // ever being drawn somewhere it never was.
  if (inA && !inB) return copy(a);
  if (!inA && inB) return copy(b);

  out[wrist] = a[wrist] * (1 - t) + b[wrist] * t;
  out[wrist + 1] = a[wrist + 1] * (1 - t) + b[wrist + 1] * t;
  for (let i = 0; i < 63; i += 1) {
    out[world + i] = a[world + i] * (1 - t) + b[world + i] * t;
  }
}

/* ------------------------------------------------------------------ player -- */
