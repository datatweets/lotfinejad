// Print the English résumé page (/print/resume-en/, data/resume_en.yaml) to
// static/files/Mehdi_Lotfinejad_Resume.pdf. Run after editing the YAML:
//
//   hugo server            # in one terminal
//   npm i -D playwright    # once
//   node scripts/build-resume.mjs [baseURL]   # default http://localhost:1313
//
// Commit the generated PDF; the GitHub Pages build only runs Hugo.
import { join } from "node:path";
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:1313").replace(/\/$/, "");
const root = new URL("..", import.meta.url).pathname;
const out = join(root, "static/files/Mehdi_Lotfinejad_Resume.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/print/resume-en/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.pdf({
  path: out,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  tagged: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: '<div style="width:100%;padding:0 14mm;font-size:7px;color:#6B7484;font-family:sans-serif;display:flex;justify-content:space-between"><span>Mohammad Mehdi Lotfinejad — Résumé</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
});
await browser.close();
console.log("✓", out);
