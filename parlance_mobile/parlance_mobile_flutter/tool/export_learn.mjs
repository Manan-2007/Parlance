// Exports the website's Learn curriculum for the app: assets/learn/curriculum.json.
// Run from the repo root:  node parlance_mobile/parlance_mobile_flutter/tool/export_learn.mjs
// Adds each sign's English name (public/signs/manifest.json) and whether the
// server's recogniser knows it (so a lesson can check the learner's signing).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const dir = mkdtempSync(join(tmpdir(), 'learn-'));
writeFileSync(join(dir, 'entry.ts'), `export { UNITS, GRAMMAR_RULES } from '${join(root, 'src/learn/curriculum.ts')}';\nexport { avatarTokenFor } from '${join(root, 'src/learn/lessonPlan.ts')}';\n`);
const out = join(dir, 'curriculum.mjs');
execFileSync('npx', ['esbuild', join(dir, 'entry.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--log-level=warning', `--alias:@=${join(root, 'src')}`], { cwd: root, stdio: 'inherit' });
const { UNITS, GRAMMAR_RULES, avatarTokenFor } = await import(out);

const manifest = JSON.parse(readFileSync(join(root, 'public/signs/manifest.json'), 'utf8')).signs;
const key = (label) => label.toLowerCase().replaceAll('_', '');
const recognition = join(root, 'parlance_mobile/parlance_mobile_server/assets/recognition');
const known = new Set([
  ...JSON.parse(readFileSync(join(recognition, 'transformer.json'), 'utf8')).labels,
  ...JSON.parse(readFileSync(join(recognition, 'forest.json'), 'utf8')).labels,
].filter((l) => l !== '__NONE__').map(key));

const glosses = new Set(UNITS.flatMap((u) => [...u.lessons.flatMap((l) => l.signs), ...u.phrases.flatMap((p) => p.glosses)]));
// avatar: the 3D signer has an animation for it (otherwise it would fingerspell).
const signs = Object.fromEntries([...glosses].sort().map((g) => [g, { english: manifest[g]?.english ?? g, checkable: known.has(key(g)), avatar: avatarTokenFor(g) !== null }]));

const file = join(root, 'parlance_mobile/parlance_mobile_flutter/assets/learn/curriculum.json');
writeFileSync(file, JSON.stringify({ source: 'src/learn/curriculum.ts', units: UNITS, grammar: GRAMMAR_RULES, signs }));
const checkable = Object.values(signs).filter((s) => s.checkable).length;
const animated = Object.values(signs).filter((s) => s.avatar).length;
console.log(`${animated} signs animated on the 3D avatar`);
console.log(`${UNITS.length} units, ${UNITS.reduce((n, u) => n + u.lessons.length, 0)} lessons, ${glosses.size} signs (${checkable} the recogniser can check)`);
