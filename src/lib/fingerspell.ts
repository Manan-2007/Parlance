/**
 * Indian Sign Language (ISL) fingerspelling, drawn as two stylised hands.
 *
 * Most ISL letters are two-handed: the non-dominant "base" hand holds a shape
 * and the dominant hand points at or touches it (vowels A E I O U are the
 * thumb → little-finger tips). C is one-handed. A few letters move (H, J, R, Z).
 *
 * Each hand = a handshape (per-digit [extension 0–1, rotation°]) + a placement
 * (palm-centre position in the 360×300 scene, rotation, visibility). Everything
 * becomes CSS custom properties, so letter → letter changes are CSS transitions.
 *
 * Shapes follow the ISLRTC-style two-handed chart from a single front-facing view.
 * They are illustrations, not a reference — have a Deaf ISL signer review them
 * before using the Learn page for teaching.
 */

export type Digit = [e: number, r: number];
export type DigitKey = 't' | 'i' | 'm' | 'r' | 'p';
export type Shape = Record<DigitKey, Digit>;
export type Motion = 'j' | 'z' | 'wave' | 'brush' | 'circle';
export type Pt = [number, number];

export interface Placement {
  shape: Shape;
  at: Pt; // palm centre, scene coords
  rot: number; // degrees, clockwise
  hide?: boolean;
}
export interface Scene {
  b: Placement; // base (non-dominant) hand — drawn mirrored
  d: Placement; // dominant hand
  motion?: Motion;
  mAt?: Pt;
}

/* ---------- geometry shared with Hand.astro (hand-local coords, 200×270) ---------- */
export const ORIGIN: Pt = [100, 168]; // palm centre
export const DIGITS: Record<DigitKey, { x: number; y: number; len: number }> = {
  p: { x: 134, y: 140, len: 72 },
  r: { x: 112, y: 131, len: 94 },
  m: { x: 89, y: 128, len: 104 },
  i: { x: 66, y: 132, len: 94 },
  t: { x: 58, y: 184, len: 64 },
};
export const SCENE = { w: 360, h: 300 };

/* ---------- handshapes ---------- */
const C = 0.27; // curled
const tuck: Digit = [0.46, 58];
const curled = { i: [C, 0], m: [C, 0], r: [C, 0], p: [C, 0] } as const;

export const SHAPES = {
  OPEN: { t: [0.95, -48], i: [1, -10], m: [1, -2], r: [1, 6], p: [1, 16] },
  FLAT: { t: [0.85, -26], i: [1, -2], m: [1, 0], r: [1, 2], p: [1, 4] },
  REST: { t: [0.7, -38], i: [0.9, -8], m: [0.92, -2], r: [0.9, 4], p: [0.84, 10] },
  POINT: { ...curled, i: [1, 0], t: tuck },
  FIST: { ...curled, t: [0.56, 62] },
  CURVE: { t: [0.72, -58], i: [0.64, 6], m: [0.66, 4], r: [0.64, 2], p: [0.6, 0] },
  RING: { t: [0.62, 30], i: [0.56, 10], m: [0.58, 4], r: [0.56, -2], p: [0.52, -8] },
  CROOK: { ...curled, i: [0.56, 4], t: tuck },
  V2: { ...curled, i: [1, -15], m: [1, 13], t: tuck },
  U2: { ...curled, i: [1, -2], m: [1, 2], t: tuck },
  W3: { ...curled, i: [1, -3], m: [1, 0], r: [1, 3], t: tuck },
  PINKY: { ...curled, p: [1, 4], t: tuck },
  L: { ...curled, i: [1, 0], t: [1, -80] },
} satisfies Record<string, Record<DigitKey, readonly [number, number]>>;
type ShapeName = keyof typeof SHAPES;
const S = (n: ShapeName) => SHAPES[n] as unknown as Shape;

/* ---------- geometry helpers ---------- */
const rad = (d: number) => (d * Math.PI) / 180;
const rotate = ([x, y]: Pt, deg: number): Pt => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [x * c - y * s, x * s + y * c];
};
/** Point on a digit (0 = knuckle, 1 = tip) in hand-local coords. */
function digitPoint(shape: Shape, k: DigitKey, along = 1): Pt {
  const g = DIGITS[k];
  const [e, r] = shape[k];
  const l = g.len * e * along;
  return [g.x + l * Math.sin(rad(r)), g.y - l * Math.cos(rad(r))];
}
/** Hand-local → scene. Base hand is mirrored. */
function toScene(pl: Placement, p: Pt, mirrored: boolean): Pt {
  let v: Pt = [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];
  if (mirrored) v = [-v[0], v[1]];
  const [x, y] = rotate(v, pl.rot);
  return [pl.at[0] + x, pl.at[1] + y];
}
const baseTip = (b: Placement, k: DigitKey, along = 1) => toScene(b, digitPoint(b.shape, k, along), true);
const basePalm = (b: Placement, p: Pt) => toScene(b, p, true);

/** Place the dominant hand so the given digit tip lands on `target`. */
function touch(target: Pt, rot: number, shape: Shape = S('POINT'), k: DigitKey = 'i'): Placement {
  const tip = digitPoint(shape, k);
  const [x, y] = rotate([tip[0] - ORIGIN[0], tip[1] - ORIGIN[1]], rot);
  return { shape, rot, at: [target[0] - x, target[1] - y] };
}

const base = (shape: ShapeName, at: Pt = [128, 176], rot = 0): Placement => ({ shape: S(shape), at, rot });
const dom = (shape: ShapeName, at: Pt, rot = 0): Placement => ({ shape: S(shape), at, rot });
const hidden = (shape: ShapeName = 'REST'): Placement => ({ shape: S(shape), at: [120, 230], rot: 20, hide: true });
const solo = (shape: ShapeName, motion?: Motion): Scene => ({
  b: hidden(),
  d: dom(shape, [180, 175], 0),
  motion,
  mAt: [180, 110],
});

/* ---------- letters ---------- */
// vowels: dominant index touches base fingertips, base fanned toward the right
const vowelBase = base('OPEN', [104, 196], 18);
const vowel = (k: DigitKey, rot: number): Scene => ({ b: vowelBase, d: touch(baseTip(vowelBase, k), rot) });

const flatBase = base('FLAT', [124, 176], 0);
const palmMid = basePalm(flatBase, [100, 160]);
const pointBase = base('POINT', [130, 180], 0);

export const SCENES: Record<string, Scene> = {
  A: vowel('t', -64),
  E: vowel('i', -44),
  I: vowel('m', -36),
  O: vowel('r', -30),
  U: vowel('p', -24),

  B: { b: base('CURVE', [146, 176], 8), d: dom('CURVE', [214, 176], -8) },
  C: solo('CURVE'),
  D: { b: pointBase, d: dom('CURVE', [200, 172], -4) },
  F: (() => {
    const b = base('U2', [136, 192], 14);
    return { b, d: touch(baseTip(b, 'i', 0.62), -86, S('U2'), 'm') };
  })(),
  G: { b: base('FIST', [158, 214], 84), d: dom('FIST', [176, 146], -84) },
  H: { b: flatBase, d: touch(palmMid, -92, S('FLAT'), 'm'), motion: 'brush', mAt: [236, 92] },
  J: { b: flatBase, d: touch(palmMid, -44), motion: 'j', mAt: [148, 150] },
  K: { b: pointBase, d: touch(toScene(pointBase, digitPoint(pointBase.shape, 'i', 0.7), true), -70, S('CROOK')) },
  L: { b: flatBase, d: touch(basePalm(flatBase, [140, 170]), -90) },
  M: { b: flatBase, d: touch(basePalm(flatBase, [138, 158]), -90, S('W3'), 'm') },
  N: { b: flatBase, d: touch(basePalm(flatBase, [138, 158]), -90, S('U2'), 'm') },
  P: { b: pointBase, d: touch(baseTip(pointBase, 'i'), -40, S('RING'), 'i') },
  Q: (() => {
    const b = base('POINT', [116, 206], 76);
    return { b, d: touch(baseTip(b, 'i'), 168, S('RING'), 'i') };
  })(),
  R: { b: flatBase, d: touch(palmMid, -56, S('CROOK')), motion: 'circle', mAt: [126, 150] },
  S: (() => {
    const b = base('PINKY', [132, 204], 46);
    return { b, d: touch(baseTip(b, 'p'), -86, S('PINKY'), 'p') };
  })(),
  T: (() => {
    const b = base('FLAT', [168, 104], -84);
    return { b, d: touch(basePalm(b, [100, 222]), -18) };
  })(),
  V: { b: flatBase, d: touch(basePalm(flatBase, [118, 150]), -58, S('V2'), 'm') },
  W: { b: base('OPEN', [132, 186], 64), d: dom('OPEN', [228, 186], -64) },
  X: { b: base('POINT', [150, 196], 38), d: dom('POINT', [210, 196], -38) },
  Y: (() => {
    const b = base('L', [124, 180], 0);
    return { b, d: touch(basePalm(b, [62, 132]), -44) };
  })(),
  Z: { b: flatBase, d: touch(palmMid, -40), motion: 'z', mAt: [150, 160] },

  // extras / decorative
  ' ': {
    b: { shape: S('REST'), at: [132, 182], rot: -6 },
    d: { shape: S('REST'), at: [228, 182], rot: 6 },
  },
  REST: {
    b: { shape: S('REST'), at: [132, 182], rot: -6 },
    d: { shape: S('REST'), at: [228, 182], rot: 6 },
  },
  HELLO: solo('OPEN', 'wave'),
  OPEN: solo('OPEN'),
  FLAT: solo('FLAT'),
  POINT: solo('POINT'),
  FIST: solo('FIST'),
  V2: solo('V2'),
};

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const TIPS: Record<string, string> = {
  A: 'Point to the thumb tip of your open hand.',
  B: 'Two curved hands meet, side by side.',
  C: 'One hand, curved like a C. The only one-handed letter.',
  D: 'Index up on one hand; the other curves beside it.',
  E: 'Point to the tip of the index finger.',
  F: 'Two fingers rest across two fingers.',
  G: 'One fist on top of the other.',
  H: 'Flat hand brushes across the open palm.',
  I: 'Point to the tip of the middle finger.',
  J: 'Trace a J down the open palm.',
  K: 'A hooked index meets the other index finger.',
  L: 'Lay your index finger across the palm.',
  M: 'Three fingers rest on the palm.',
  N: 'Two fingers rest on the palm.',
  O: 'Point to the tip of the ring finger.',
  P: 'Ring of thumb and index around the other fingertip.',
  Q: 'A ring hangs over the other index finger.',
  R: 'A hooked finger circles on the palm.',
  S: 'Hook your two little fingers together.',
  T: 'Index fingertip touches the edge of the other palm.',
  U: 'Point to the tip of the little finger.',
  V: 'Two fingers stand on the open palm.',
  W: 'Interlace the fingers of both hands.',
  X: 'Cross the two index fingers.',
  Y: 'Index rests in the gap between the other thumb and index.',
  Z: 'Draw a Z across the open palm.',
};

/* ---------- CSS variables ---------- */
const DK: DigitKey[] = ['t', 'i', 'm', 'r', 'p'];
const r2 = (n: number) => Math.round(n * 100) / 100;

export function sceneFor(key: string): Scene {
  return SCENES[key.toUpperCase()] ?? SCENES.REST;
}

/** Scene bounding box (rough: palm, sleeve, knuckles and visible fingertips). */
function sceneBox(sc: Scene) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const add = ([x, y]: Pt, pad = 14) => {
    x0 = Math.min(x0, x - pad);
    y0 = Math.min(y0, y - pad);
    x1 = Math.max(x1, x + pad);
    y1 = Math.max(y1, y + pad);
  };
  for (const [pl, mirrored] of [[sc.b, true], [sc.d, false]] as const) {
    if (pl.hide) continue;
    const local: Pt[] = [[50, 120], [150, 120], [52, 220], [148, 220], [60, 284], [140, 284]];
    for (const k of DK) local.push(digitPoint(pl.shape, k, 0), digitPoint(pl.shape, k, 1));
    local.forEach((p) => add(toScene(pl, p, mirrored)));
  }
  return { x0, y0, x1, y1 };
}

let _shared: number | undefined;
function sharedScale() {
  if (_shared === undefined) {
    _shared = 1;
    for (const l of [...ALPHABET, 'REST']) {
      const bb = sceneBox(SCENES[l]!);
      _shared = Math.min(_shared, (SCENE.w - 16) / (bb.x1 - bb.x0), (SCENE.h - 12) / (bb.y1 - bb.y0));
    }
  }
  return _shared;
}

export function sceneVars(key: string): Record<string, string> {
  const sc = sceneFor(key);
  const out: Record<string, string> = {};
  // fit inside the frame, centred. One shared scale for every letter so the
  // scene doesn't zoom in and out between letters (that read as jitter).
  const bb = sceneBox(sc);
  const w = bb.x1 - bb.x0;
  const h = bb.y1 - bb.y0;
  const k = Math.min(sharedScale(), (SCENE.w - 16) / w, (SCENE.h - 12) / h);
  out['--ss'] = String(r2(k));
  out['--sx'] = `${r2(SCENE.w / 2 - k * (bb.x0 + w / 2))}px`;
  out['--sy'] = `${r2(SCENE.h / 2 + 4 - k * (bb.y0 + h / 2))}px`;
  for (const [h, pl] of [['b', sc.b], ['d', sc.d]] as const) {
    for (const k of DK) {
      out[`--${h}${k}e`] = String(pl.shape[k][0]);
      out[`--${h}${k}r`] = `${pl.shape[k][1]}deg`;
    }
    out[`--${h}x`] = `${r2(pl.at[0] - ORIGIN[0])}px`;
    out[`--${h}y`] = `${r2(pl.at[1] - ORIGIN[1])}px`;
    out[`--${h}rot`] = `${r2(pl.rot)}deg`;
    out[`--${h}o`] = pl.hide ? '0' : '1';
  }
  const m = sc.mAt ?? [180, 120];
  out['--mx'] = `${m[0]}px`;
  out['--my'] = `${m[1]}px`;
  return out;
}

export function sceneStyle(key: string): string {
  return Object.entries(sceneVars(key))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}

/** Client: move a rendered hand pair to a new letter. */
export function applyPose(hand: Element | null, key: string) {
  if (!hand) return;
  const el = hand as HTMLElement;
  for (const [k, v] of Object.entries(sceneVars(key))) el.style.setProperty(k, v);
  el.dataset.motion = sceneFor(key).motion ?? '';
  el.dataset.letter = key.toUpperCase();
}

export interface SpellOptions {
  interval?: number;
  loop?: boolean;
  pause?: number;
  onLetter?: (letter: string, index: number) => void;
  onDone?: () => void;
}

/** Fingerspell a word. Returns a cancel function. */
export function spell(hand: Element | null, word: string, opts: SpellOptions = {}) {
  const { interval = 620, loop = false, pause = 1200, onLetter, onDone } = opts;
  const letters = word.toUpperCase().replace(/[^A-Z ]/g, '').split('');
  let i = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const step = () => {
    if (cancelled || !letters.length) return;
    if (i >= letters.length) {
      if (loop) {
        applyPose(hand, 'REST');
        onLetter?.('', -1);
        i = 0;
        timer = setTimeout(step, pause);
      } else onDone?.();
      return;
    }
    const l = letters[i];
    applyPose(hand, l);
    onLetter?.(l, i);
    i++;
    timer = setTimeout(step, l === ' ' ? interval * 1.4 : interval);
  };
  step();
  return () => {
    cancelled = true;
    clearTimeout(timer);
  };
}
