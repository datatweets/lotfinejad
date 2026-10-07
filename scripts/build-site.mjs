// Rebuild derived PDFs and share cards from a production-URL Hugo snapshot,
// then rebuild the final site so that metadata points to the new assets.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const draftDir = join(root, ".build/artifact-source");
const baseURL = process.env.SITE_BASE_URL || "https://lotfinejad.ir/";
const destination = process.env.SITE_DESTINATION || "public";
if (new URL(baseURL).protocol !== "https:") throw new Error("The production build requires an HTTPS base URL.");

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit", env: { ...process.env, HUGO_ENVIRONMENT: "production" } });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? resolvePromise() : reject(new Error(`${command} failed (${code})`)));
  });
}
await mkdir(draftDir, { recursive: true });
await run("hugo", ["--gc", "--baseURL", baseURL, "--destination", draftDir, "--cleanDestinationDir"]);
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp", ".pdf": "application/pdf" };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let file = resolve(draftDir, `.${path}`);
    if (file !== draftDir && !file.startsWith(draftDir + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const bytes = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
    res.end(bytes);
  } catch { res.writeHead(404).end("Not found"); }
});
await new Promise(resolvePromise => server.listen(0, "127.0.0.1", resolvePromise));
const localURL = `http://127.0.0.1:${server.address().port}`;
try {
  await run(process.execPath, ["scripts/build-outlines.mjs", localURL]);
  await run(process.execPath, ["scripts/build-resume.mjs", localURL]);
  await run(process.execPath, ["scripts/build-og.mjs", localURL, "--all"]);
} finally {
  await new Promise(resolvePromise => server.close(resolvePromise));
}
await run("hugo", ["--gc", "--minify", "--baseURL", baseURL, "--destination", destination, "--cleanDestinationDir"]);
await run(process.execPath, ["scripts/check-release.mjs", destination]);
await writeFile(join(root, ".build/last-build.json"), JSON.stringify({ status: "built", baseURL, destination, generatedAt: new Date().toISOString() }, null, 2));
