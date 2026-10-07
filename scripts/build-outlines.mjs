// Print every course outline page (/outlines/<slug>/) to a PDF in
// static/files/outlines/<slug>.pdf. Run after changing data/courses/*.yaml:
//
//   hugo server            # in one terminal (or any static server for public/)
//   npm i -D playwright    # once
//   node scripts/build-outlines.mjs [baseURL]   # default http://localhost:1313
//
// npm run build also regenerates these automatically before deployment.
import { readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:1313").replace(/\/$/, "");
const root = new URL("..", import.meta.url).pathname;
const slugs = readdirSync(join(root, "data/courses")).filter(f => f.endsWith(".yaml")).map(f => f.replace(/\.yaml$/, "")).sort();
const outDir = join(root, "static/files/outlines");
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
for (const slug of slugs) {
  await page.goto(`${base}/outlines/${slug}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: join(outDir, `${slug}.pdf`),
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true,
    outline: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: '<div style="width:100%;font-size:8px;color:#7A8394;text-align:center;font-family:sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  console.log("✓", slug);
}
await browser.close();
