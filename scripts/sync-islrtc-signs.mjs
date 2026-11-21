/**
 * Import the ISLRTC sign motion library from a local VOX checkout.
 *
 *   node scripts/sync-islrtc-signs.mjs "<path to vox>"
 *
 * Copies vox/frontend/public/signs/*.json into public/signs/ and writes
 * public/signs/sources.json, which maps each gloss to the official ISLRTC
 * dictionary videos its recording was built from (vox/ml/videos, titles from
 * vox/ml/dictionary_plan.json).
 *
 * The motion files hold MediaPipe landmarks only, extracted by VOX's
 * ml/build_motion.py from the ISLRTC Indian Sign Language dictionary
 * (youtube.com/@islrtc, Government of India). No video is copied.
 *
 * When a word has several clips, build_motion.py kept the best-scoring one but
 * did not record which, so every clip is listed, in the order it considered
 * them.
 */
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const vox = process.argv[2];
if (!vox) {
  console.error('usage: node scripts/sync-islrtc-signs.mjs "<path to vox>"');
  process.exit(1);
}

const signsDir = join(vox, "frontend/public/signs");
const videosDir = join(vox, "ml/videos");
const planPath = join(vox, "ml/dictionary_plan.json");
for (const path of [signsDir, videosDir, planPath]) {
  if (!existsSync(path)) {
    console.error(`not found: ${path}`);
    process.exit(1);
  }
}

const target = join(ROOT, "public/signs");
let copied = 0;
for (const name of readdirSync(signsDir)) {
  if (!name.endsWith(".json")) continue;
  copyFileSync(join(signsDir, name), join(target, name));
  copied += 1;
}

const manifest = JSON.parse(readFileSync(join(target, "manifest.json"), "utf8"));
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const titles = new Map();
for (const entries of Object.values(plan.glosses ?? {})) {
  for (const entry of entries) titles.set(entry.id, entry.title);
}

// Same discovery order as build_motion.py: sorted filenames, "<gloss>__<id>.<ext>".
const byGloss = {};
for (const name of readdirSync(videosDir).sort()) {
  const match = /^(.+?)__(.+)\.(mp4|webm|mov)$/i.exec(name);
  if (!match) continue;
  const [, gloss, id] = match;
  if (!manifest.signs[gloss]) continue;
  (byGloss[gloss] ??= []).push({ id, title: titles.get(id) ?? gloss });
}

const missing = Object.keys(manifest.signs).filter((gloss) => !byGloss[gloss]);
writeFileSync(
  join(target, "sources.json"),
  `${JSON.stringify(
    {
      _source:
        "ISLRTC official Indian Sign Language dictionary (Government of India), youtube.com/@islrtc. " +
        "Landmarks extracted by VOX ml/build_motion.py; videos are linked, never copied.",
      channel: "https://www.youtube.com/@islrtc",
      signs: Object.fromEntries(Object.entries(byGloss).sort(([a], [b]) => a.localeCompare(b))),
    },
    null,
    1,
  )}\n`,
);

console.log(`copied ${copied} files; sources for ${Object.keys(byGloss).length} signs`);
if (missing.length) console.warn(`no source video found for: ${missing.join(", ")}`);
