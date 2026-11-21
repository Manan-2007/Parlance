// End to end: dataset videos played as the webcam through the real Parlance app.
//
// Starts headless Google Chrome, replaces getUserMedia with a canvas that plays
// every .mp4 in <videoDir> (H.264; ISL500's HEVC files need ffmpeg first) with
// 2 s of empty frame between clips, and presses Start camera on Sign to text.
// Run the app with PARLANCE_CAPTURE_DIR set, then score with training/e2e/score.py.
//
//   npm i --no-save playwright-core@1.49.1
//   node training/e2e/browser_replay.mjs <absolute videoDir> <out.json> [trackWidth]
import { chromium } from 'playwright-core';
import { readdirSync, writeFileSync } from 'node:fs';

const [videoDir, outFile, trackWidth] = process.argv.slice(2);
const files = readdirSync(videoDir).filter((f) => f.endsWith('.mp4')).sort();
const base = '/@fs' + videoDir.replace(/\/$/, '') + '/';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
await page.addInitScript(({ base, files, trackWidth }) => {
  if (trackWidth) localStorage.setItem('parlance.trackWidth', trackWidth);
  const st = { playing: false };
  window.__e2e = { log: [], done: false, st, files };
  const canvas = document.createElement('canvas');
  canvas.width = 1280; canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true;
  const draw = () => {
    if (st.playing && video.readyState >= 2) ctx.drawImage(video, 0, 0, 1280, 720);
    else { ctx.fillStyle = '#777'; ctx.fillRect(0, 0, 1280, 720); }
  };
  setInterval(draw, 1000 / 30);
  const stream = canvas.captureStream(30);
  navigator.mediaDevices.getUserMedia = async () => stream;
  window.__e2eRun = async () => {
    for (const f of files) {
      video.src = base + f;
      await new Promise((r) => { video.oncanplay = r; });
      st.playing = true;
      const start = Date.now();
      await video.play();
      await new Promise((r) => { video.onended = r; });
      st.playing = false;
      window.__e2e.log.push({ file: f, start, end: Date.now() });
      await new Promise((r) => setTimeout(r, 2000));
    }
    window.__e2e.done = true;
  };
}, { base, files, trackWidth });

await page.goto('http://localhost:4180/app/sign-to-text');
const start = page.getByRole('button', { name: 'Start camera' }).first();
await start.waitFor();
await start.click();
await page.waitForFunction(() => document.querySelector('main')?.innerText.includes('Camera on'), null, { timeout: 30000 });
await page.waitForTimeout(4000);                    // tracker model load
const fpsBefore = await page.evaluate(() => document.body.innerText.match(/\d+\s*fps/i)?.[0]);
const t0 = Date.now();
await page.evaluate(() => { window.__e2eRun(); });
const fpsSamples = [];
while (!(await page.evaluate(() => window.__e2e.done))) {
  await page.waitForTimeout(2000);
  fpsSamples.push(await page.evaluate(() => document.body.innerText.match(/(\d+)\s*fps/i)?.[1]));
}
const log = await page.evaluate(() => window.__e2e.log);
writeFileSync(outFile, JSON.stringify({ t0, fpsBefore, fpsSamples, log }, null, 1));
console.log(JSON.stringify({ clips: log.length, fpsSamples: fpsSamples.slice(0, 20) }));
await browser.close();
