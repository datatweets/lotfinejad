// Local review only. The form endpoint is simulated and never sends email.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const previewURL = "http://127.0.0.1:1323/";
mkdirSync(new URL("../.build", import.meta.url), { recursive: true });
writeFileSync(new URL("../.build/preview.toml", import.meta.url), '[params]\npreview = true\nformEndpoint = "http://127.0.0.1:1324/lead"\n');
const formServer = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", previewURL.replace(/\/$/, ""));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  if (req.method !== "POST" || req.url !== "/lead") { res.writeHead(404).end(); return; }
  let bytes = 0;
  req.on("data", data => { bytes += data.length; if (bytes > 32_000) req.destroy(); });
  req.on("end", () => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, message: "Local preview only; no email sent" }));
  });
});
formServer.listen(1324, "127.0.0.1", () => {
  const child = spawn("hugo", ["server", "--bind", "127.0.0.1", "--port", "1323", "--baseURL", previewURL, "--environment", "development", "--config", "hugo.toml,.build/preview.toml", "--destination", ".build/local"], { cwd: root, stdio: "inherit" });
  child.on("exit", code => { formServer.close(); process.exitCode = code || 0; });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { child.kill(signal); formServer.close(); });
});
