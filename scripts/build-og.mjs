// Screenshot every share card on /print/og/ (layouts/og/single.html) to
// static/images/og/<page-key>.jpg (1200×630). Pages without an image fall back
// to static/images/og.jpg. Run after adding pages or changing titles:
//
//   hugo server                   # terminal 1
//   npm i -D playwright           # once
//   node scripts/build-og.mjs     # terminal 2: only pages without an image yet
//   node scripts/build-og.mjs --all            # rebuild every image (design change)
//   node scripts/build-og.mjs --only key1,key2 # rebuild these (e.g. a retitled page)
//
// Commit the generated images; the GitHub Pages build only runs Hugo.
import { mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const all = args.includes("--all");
const onlyArg = args.indexOf("--only");
const only = onlyArg >= 0 ? new Set(args[onlyArg + 1].split(",")) : null;
const base = (args.find((a) => a.startsWith("http")) || "http://localhost:1313").replace(/\/$/, "");
const root = new URL("..", import.meta.url).pathname;
const outDir = join(root, "static/images/og");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`${base}/print/og/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const ids = await page.$$eval("section.card", (els) => els.map((e) => e.id));
let written = 0;
for (const id of ids) {
  const out = join(outDir, `${id}.jpg`);
  if (only ? !only.has(id) : !all && existsSync(out)) continue;
  await page.locator(`[id="${id}"]`).screenshot({ path: out, type: "jpeg", quality: 82 });
  if (id === "home") copyFileSync(out, join(root, "static/images/og.jpg"));
  written++;
}
await browser.close();
console.log(`✓ ${written} share image(s) written (${ids.length} pages) in static/images/og/`);
