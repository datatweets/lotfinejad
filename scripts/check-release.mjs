// Release guard requested in audit F23: checks the built output, not live APIs.
import { readFile, readdir, stat } from "node:fs/promises";
import { join, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, process.argv[2] || "public");
const training = parse(await readFile(join(root, "data/training.yaml"), "utf8"));
const courses = training.catalog.groups.flatMap(group => group.courses);
const errors = [];
for (const course of courses) {
  const data = parse(await readFile(join(root, `data/courses/${course.slug}.yaml`), "utf8"));
  if (data.fa !== course.fa) errors.push(`Course title differs: ${course.slug}`);
  for (const asset of [`files/outlines/${course.slug}.pdf`, `images/og/training-${course.slug}.jpg`, `training/${course.slug}/index.html`]) {
    try { if (!(await stat(join(output, asset))).size) errors.push(`Empty asset: ${asset}`); }
    catch { errors.push(`Missing asset: ${asset}`); }
  }
}
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}
const htmlFiles = await walk(output);
const baseURL = process.env.SITE_BASE_URL || "https://lotfinejad.ir/";
const origin = new URL(baseURL).origin;
const checkedTargets = new Set();
try { if (!(await stat(join(output, "files/Mehdi_Lotfinejad_Resume.pdf"))).size) errors.push("Empty resume PDF"); }
catch { errors.push("Missing resume PDF"); }
for (const path of htmlFiles) {
  const html = await readFile(path, "utf8");
  if (/https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/i.test(html)) errors.push(`Local URL in public output: ${path}`);
  const pageURL = new URL(relative(output, path).split(sep).join("/").replace(/index\.html$/, ""), baseURL);
  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    const raw = (match[1] ?? match[2] ?? match[3]).replace(/&amp;/g, "&");
    if (!raw || raw.startsWith("#")) continue;
    let url;
    try { url = new URL(raw, pageURL); } catch { errors.push(`Invalid link in ${path}: ${raw}`); continue; }
    if (url.origin !== origin) continue;
    const target = decodeURIComponent(url.pathname);
    if (checkedTargets.has(target)) continue;
    checkedTargets.add(target);
    let file = resolve(output, `.${target}`);
    if (file !== output && !file.startsWith(output + sep)) { errors.push(`Link outside output: ${raw}`); continue; }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, "index.html");
      if (!(await stat(file)).isFile()) errors.push(`Invalid internal target: ${target}`);
    } catch { errors.push(`Broken internal target in ${path}: ${target}`); }
  }
  for (const match of html.matchAll(/<script\b[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { errors.push(`Invalid JSON-LD: ${path}`); }
  }
}
const home = parse(await readFile(join(root, "data/home.yaml"), "utf8"));
const consultation = parse(await readFile(join(root, "data/consultation.yaml"), "utf8"));
if (!home.faq[0].a.startsWith("بله.")) errors.push("Data readiness FAQ contradicts the service.");
if (!consultation.faq[0].a.startsWith("خیر.")) errors.push("Free consultation FAQ contradicts the offer.");
if (errors.length) throw new Error(errors.join("\n"));
console.log(`Release guard: ${courses.length} course pages, PDFs and cards present; ${checkedTargets.size} internal targets and JSON-LD valid; two FAQ regressions guarded.`);
