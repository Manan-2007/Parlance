/**
 * Check, and calibrate, the practice comparison against real signing by other
 * people.
 *
 *   node scripts/calibrate-practice.mjs "<path to vox>"
 *
 * Uses VOX's INCLUDE-derived training windows (ml/data/<gloss>/MVI_*.npy: 30
 * frames x 141 floats, different signers from the ISLRTC dictionary) and
 * compares each one with every ISLRTC reference in public/signs. Reports how
 * often the right sign ranks first / in the top 5, and the distance
 * distributions the score thresholds in src/learn/motion.ts are set from.
 * Needs Node with TypeScript type stripping (22.18+).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { align, comparePractice, fillHandGaps, isPracticeError, palmDirection, sequenceFeatures } from "../src/learn/motion.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const vox = process.argv[2];
const SIGNS = join(ROOT, "public/signs");

function loadReference(gloss) {
  const raw = JSON.parse(readFileSync(join(SIGNS, `${gloss}.json`), "utf8"));
  return raw.frames.map((row) => Float32Array.from(row));
}

function readNpy(path) {
  const buf = readFileSync(path);
  const headerLength = buf.readUInt16LE(8);
  const header = buf.subarray(10, 10 + headerLength).toString("latin1");
  const shape = /'shape': \((\d+), (\d+)\)/.exec(header).slice(1).map(Number);
  if (!header.includes("'<f4'")) throw new Error(`unsupported dtype in ${path}`);
  const data = new Float32Array(buf.buffer.slice(buf.byteOffset + 10 + headerLength, buf.byteOffset + buf.length));
  return Array.from({ length: shape[0] }, (_, i) => data.subarray(i * shape[1], (i + 1) * shape[1]));
}

/** 141-float recogniser frame (x on the 16:9 contract) -> format-2 frame. */
function fromVector(vec) {
  const k = 16 / 9;
  const out = new Float32Array(169);
  const blocks = [
    { wrist: 0, world: 2 },
    { wrist: 65, world: 67 },
  ];
  for (let b = 0; b < 2; b += 1) {
    const base = b * 63;
    if (vec[base] === 0 && vec[base + 1] === 0) continue;
    const wx = vec[base] * k;
    const wy = vec[base + 1];
    const wz = vec[base + 2] * k;
    out[blocks[b].wrist] = wx;
    out[blocks[b].wrist + 1] = wy;
    for (let i = 0; i < 21; i += 1) {
      out[blocks[b].world + i * 3] = vec[base + i * 3] * k - wx;
      out[blocks[b].world + i * 3 + 1] = vec[base + i * 3 + 1] - wy;
      out[blocks[b].world + i * 3 + 2] = vec[base + i * 3 + 2] * k - wz;
    }
  }
  for (let slot = 0; slot < 5; slot += 1) {
    out[130 + slot * 3] = vec[126 + slot * 3] * k;
    out[130 + slot * 3 + 1] = vec[126 + slot * 3 + 1];
    out[130 + slot * 3 + 2] = vec[126 + slot * 3 + 2] * k;
  }
  return out;
}

const pct = (values, p) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

const manifest = JSON.parse(readFileSync(join(SIGNS, "manifest.json"), "utf8"));
const glosses = Object.keys(manifest.signs);
const refs = new Map(glosses.map((g) => [g, loadReference(g)]));
const refFeatures = new Map([...refs].map(([g, frames]) => [g, sequenceFeatures(frames)]));

/* Palm direction sanity check on signs whose palm direction is unambiguous. */
for (const gloss of ["hello", "stop", "thankyou", "please"]) {
  const seq = refFeatures.get(gloss);
  if (!seq) continue;
  const block = seq.features.filter((f) => f.hands[1]).length > seq.features.filter((f) => f.hands[0]).length ? 1 : 0;
  const n = [0, 0, 0];
  for (const f of seq.features) {
    const s = f.hands[block]?.shape;
    if (!s) continue;
    n[0] += s.normal[0];
    n[1] += s.normal[1];
    n[2] += s.normal[2];
  }
  console.log(`${gloss.padEnd(9)} main block ${block}, palm ${palmDirection(n)}  (${n.map((v) => v.toFixed(1)).join(", ")})`);
}

/* Which hand block carries one-handed signs in the library. */
let block0 = 0;
let block1 = 0;
for (const seq of refFeatures.values()) {
  if (!seq) continue;
  const l = seq.features.filter((f) => f.hands[0] && !f.hands[1]).length;
  const r = seq.features.filter((f) => f.hands[1] && !f.hands[0]).length;
  if (l > r) block0 += 1;
  else if (r > l) block1 += 1;
}
console.log(`one-hand-dominant signs: block 0 ${block0}, block 1 ${block1}`);


/* Robustness: a distorted copy of each reference (speed, position, distance,
   jitter, dropped frames) should still be matched to its own sign. Same
   signer, so this is an upper bound; it checks invariance, not variation
   between people. */
let seed = 7;
const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const gauss = () => Math.sqrt(-2 * Math.log(random() + 1e-9)) * Math.cos(2 * Math.PI * random());
function distort(frames) {
  const speed = 0.7 + random() * 0.7;
  const scale = 0.75 + random() * 0.5;
  const dx = (random() - 0.5) * 0.3;
  const dy = (random() - 0.5) * 0.15;
  const length = Math.max(4, Math.round(frames.length / speed));
  const out = [];
  for (let k = 0; k < length; k += 1) {
    const src = frames[Math.min(frames.length - 1, Math.round(k * speed))];
    const f = Float32Array.from(src);
    for (const w of [0, 65]) {
      if (f[w] === 0 && f[w + 1] === 0) continue;
      if (random() < 0.08) {
        f.fill(0, w, w + 65);
        continue;
      }
      f[w] = 0.9 + (f[w] - 0.9) * scale + dx + gauss() * 0.008;
      f[w + 1] = 0.5 + (f[w + 1] - 0.5) * scale + dy + gauss() * 0.008;
      for (let i = 2; i < 65; i += 1) f[w + i] += gauss() * 0.003;
    }
    for (let slot = 0; slot < 13; slot += 1) {
      const b = 130 + slot * 3;
      if (f[b] === 0 && f[b + 1] === 0) continue;
      f[b] = 0.9 + (f[b] - 0.9) * scale + dx + gauss() * 0.004;
      f[b + 1] = 0.5 + (f[b + 1] - 0.5) * scale + dy + gauss() * 0.004;
    }
    out.push(f);
  }
  return out;
}
{
  let r1 = 0;
  let r5 = 0;
  let n = 0;
  const own = [];
  const others = [];
  const ownScores = [];
  for (const [gloss, frames] of refs) {
    const seq = refFeatures.get(gloss);
    if (!seq || !seq.features.length || (seq.ignore[0] && seq.ignore[1])) continue;
    const user = sequenceFeatures(fillHandGaps(distort(frames)));
    if (!user || user.features.length < 4) continue;
    n += 1;
    const ranked = [];
    for (const [g, ref] of refFeatures) {
      if (!ref || !ref.features.length) continue;
      ranked.push({ g, d: align(user.features, ref.features, ref.ignore).distance });
    }
    ranked.sort((a, b) => a.d - b.d);
    const rank = ranked.findIndex((r) => r.g === gloss);
    if (rank === 0) r1 += 1;
    if (rank < 5) r5 += 1;
    for (const r of ranked) (r.g === gloss ? own : others).push(r.d);
    const result = comparePractice(distort(frames), frames);
    if (!isPracticeError(result)) ownScores.push(result.score);
  }
  console.log(`\ndistorted references: ${n}; matched to own sign 1st ${((100 * r1) / n).toFixed(1)}%, top 5 ${((100 * r5) / n).toFixed(1)}%`);
  console.log(`distance  own: p50 ${pct(own, 0.5).toFixed(3)} p90 ${pct(own, 0.9).toFixed(3)} | other signs: p10 ${pct(others, 0.1).toFixed(3)} p50 ${pct(others, 0.5).toFixed(3)}`);
  console.log(`score     own (distorted copy): p10 ${pct(ownScores, 0.1)} p50 ${pct(ownScores, 0.5)}`);
}

if (!vox || !existsSync(join(vox, "ml/data"))) {
  console.log("no VOX path given: skipping the INCLUDE validation");
  process.exit(0);
}

const data = join(vox, "ml/data");
const samples = [];
for (const gloss of readdirSync(data)) {
  if (!refs.has(gloss)) continue;
  for (const name of readdirSync(join(data, gloss))) {
    if (name.startsWith("MVI_") && name.endsWith(".npy")) samples.push({ gloss, path: join(data, gloss, name) });
  }
}
console.log(`\nINCLUDE windows: ${samples.length} across ${new Set(samples.map((s) => s.gloss)).size} glosses`);

const positives = [];
const negatives = [];
const scores = { right: [], wrong: [] };
let top1 = 0;
let top5 = 0;
let usable = 0;
const perGloss = {};
for (const sample of samples) {
  const frames = fillHandGaps(readNpy(sample.path).map(fromVector));
  const user = sequenceFeatures(frames);
  if (!user || user.features.length < 4) continue;
  usable += 1;
  const ranked = [];
  for (const [gloss, ref] of refFeatures) {
    if (!ref || !ref.features.length) continue;
    ranked.push({ gloss, distance: align(user.features, ref.features, ref.ignore).distance });
  }
  ranked.sort((a, b) => a.distance - b.distance);
  const rank = ranked.findIndex((r) => r.gloss === sample.gloss);
  if (rank === 0) top1 += 1;
  if (rank < 5) top5 += 1;
  (perGloss[sample.gloss] ??= []).push(rank + 1);
  for (const r of ranked) (r.gloss === sample.gloss ? positives : negatives).push(r.distance);
  const right = comparePractice(frames, refs.get(sample.gloss));
  if (!isPracticeError(right)) scores.right.push(right.score);
  const wrongOnes = ranked.filter((r) => r.gloss !== sample.gloss);
  const other = wrongOnes[Math.floor(random() * wrongOnes.length)];
  const wrong = comparePractice(frames, refs.get(other.gloss));
  if (!isPracticeError(wrong)) scores.wrong.push(wrong.score);
}

console.log(`usable ${usable}; right sign ranked 1st ${((100 * top1) / usable).toFixed(1)}%, top 5 ${((100 * top5) / usable).toFixed(1)}% of ${refFeatures.size} references`);
for (const [gloss, ranks] of Object.entries(perGloss)) {
  console.log(`  ${gloss.padEnd(12)} n=${String(ranks.length).padStart(3)}  median rank ${pct(ranks, 0.5)}  top1 ${ranks.filter((r) => r === 1).length}`);
}
console.log(`distance  right: p25 ${pct(positives, 0.25).toFixed(3)} p50 ${pct(positives, 0.5).toFixed(3)} p75 ${pct(positives, 0.75).toFixed(3)}`);
console.log(`distance  wrong: p10 ${pct(negatives, 0.1).toFixed(3)} p50 ${pct(negatives, 0.5).toFixed(3)} p90 ${pct(negatives, 0.9).toFixed(3)}`);
console.log(`score     right: p25 ${pct(scores.right, 0.25)} p50 ${pct(scores.right, 0.5)} p75 ${pct(scores.right, 0.75)}`);
console.log(`score     wrong: p25 ${pct(scores.wrong, 0.25)} p50 ${pct(scores.wrong, 0.5)} p75 ${pct(scores.wrong, 0.75)}`);
