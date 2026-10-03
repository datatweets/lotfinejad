// Screenshot every share card on /print/og/ (layouts/og/single.html) to
// static/images/og/<page-key>.jpg (1200×630). Pages without an image fall back
// to static/images/og.jpg. Run after adding pages or changing titles:
//
//   hugo server                   # terminal 1
//   npm i -D playwright           # once
//   node scripts/build-og.mjs     # terminal 2 (default base http://localhost:1313)
//
// Commit the generated images; the GitHub Pages build only runs Hugo.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:1313").replace(/\/$/, "");
const root = new URL("..", import.meta.url).pathname;
const outDir = join(root, "static/images/og");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`${base}/print/og/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const ids = await page.$$eval("section.card", (els) => els.map((e) => e.id));
for (const id of ids) {
  await page.locator(`[id="${id}"]`).screenshot({ path: join(outDir, `${id}.jpg`), type: "jpeg", quality: 82 });
}
await browser.close();
console.log(`✓ ${ids.length} share images in static/images/og/`);
