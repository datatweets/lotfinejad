// Daily analytics email (Persian, RTL) from Umami Cloud.
// Run by .github/workflows/daily-report.yml every morning (Tehran time), or by
// hand from the Actions tab ("Run workflow").
//
// Env (GitHub secrets):
//   UMAMI_API_KEY   Umami Cloud → Settings → API keys
//   SMTP_USERNAME   e.g. the Gmail address that sends the report
//   SMTP_PASSWORD   a Gmail App Password (not the account password)
//   REPORT_TO       optional; defaults to SMTP_USERNAME
//   UMAMI_WEBSITE_ID, SITE_DOMAIN  set in the workflow
//
// Local test without network or email:
//   node scripts/daily-report.mjs --mock path/to/mock.json --out report.html
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const API = "https://api.umami.is/v1";
const TZ = "Asia/Tehran";
const env = process.env;
const site = env.SITE_DOMAIN || "lotfinejad.ir";
const websiteId = env.UMAMI_WEBSITE_ID;
const mockFile = opt("--mock");

if (!mockFile && (!env.UMAMI_API_KEY || !websiteId)) {
  console.log("UMAMI_API_KEY or UMAMI_WEBSITE_ID not set; skipping the report.");
  process.exit(0);
}

// ---------- period: yesterday in Tehran, compared with the day before ----------
function tehranMidnight(daysAgo) {
  // Tehran is UTC+03:30 all year (no DST since 2022).
  const now = new Date();
  const local = new Date(now.getTime() + 3.5 * 3600e3);
  const midnightLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysAgo);
  return midnightLocal - 3.5 * 3600e3;
}
const day = { startAt: tehranMidnight(1), endAt: tehranMidnight(0) - 1 };
const prev = { startAt: tehranMidnight(2), endAt: tehranMidnight(1) - 1 };

// ---------- API ----------
async function get(path, params) {
  const url = new URL(`${API}/websites/${websiteId}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { "x-umami-api-key": env.UMAMI_API_KEY, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
// Umami versions differ: stats values are either numbers or {value, prev};
// the page metric is "url" in older and "path" in newer versions.
const num = (v) => (v && typeof v === "object" ? Number(v.value ?? 0) : Number(v ?? 0));
async function metric(types, range, limit = 10) {
  for (const type of types) {
    try { return await get("/metrics", { ...range, type, limit }); } catch (e) { if (type === types.at(-1)) throw e; }
  }
  return [];
}

async function collect() {
  if (mockFile) return JSON.parse(readFileSync(mockFile, "utf8"));
  const [stats, before, pages, referrers, events, countries] = await Promise.all([
    get("/stats", day), get("/stats", prev),
    metric(["path", "url"], day), metric(["referrer"], day),
    metric(["event"], day, 20), metric(["country"], day, 5),
  ]);
  return { stats, before, pages, referrers, events, countries };
}

// ---------- formatting ----------
const fa = (n) => Number(n).toLocaleString("fa-IR");
const faDate = (ms) => new Intl.DateTimeFormat("fa-IR", { timeZone: TZ, weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date(ms));
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function duration(sec) {
  sec = Math.round(sec);
  if (sec < 60) return `${fa(sec)} ثانیه`;
  const m = Math.floor(sec / 60), s = String(sec % 60).padStart(2, "0");
  return `<span dir="ltr">${fa(m)}:${s.replace(/\d/g, (d) => fa(d))}</span> دقیقه`;
}
function change(cur, old, lowerIsBetter = false) {
  if (!old) return cur ? '<span style="color:#1B7A5A">جدید</span>' : "";
  const pct = Math.round(((cur - old) / old) * 100);
  if (!pct) return '<span style="color:#6B7484">بدون تغییر</span>';
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  return `<span style="color:${good ? "#1B7A5A" : "#B42318"}">${pct > 0 ? "▲" : "▼"} ${fa(Math.abs(pct))}٪</span>`;
}
const EVENT_LABELS = {
  "form-submit": "ارسال فرم",
  "form-fallback": "ارسال ناموفق فرم (هدایت به ایمیل)",
  "pdf-outline": "دانلود سرفصل دوره",
  "pdf-resume": "دانلود رزومه",
  "cta-click": "کلیک روی دکمه‌ی درخواست",
};

function table(title, rows, label) {
  if (!rows || !rows.length) return `<h2 style="${H2}">${title}</h2><p style="color:#6B7484;margin:0 0 8px">موردی ثبت نشده است.</p>`;
  return `<h2 style="${H2}">${title}</h2><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${rows
    .map((r) => `<tr><td style="padding:7px 0;border-bottom:1px solid #E1E5EB">${label(r)}</td><td style="padding:7px 0;border-bottom:1px solid #E1E5EB;text-align:left;font-weight:700;color:#1E3F73;white-space:nowrap">${fa(r.y)}</td></tr>`)
    .join("")}</table>`;
}
function country(code) {
  try { return code ? new Intl.DisplayNames(["fa"], { type: "region" }).of(code) : "نامشخص"; } catch { return code || "نامشخص"; }
}
const H2 = "font-size:16px;color:#1E3F73;margin:26px 0 8px";

function render(d) {
  const s = d.stats, b = d.before;
  const visitors = num(s.visitors), visits = num(s.visits), views = num(s.pageviews);
  const bounces = num(s.bounces), totaltime = num(s.totaltime);
  const pVisitors = num(b.visitors), pVisits = num(b.visits), pViews = num(b.pageviews);
  const bounceRate = visits ? Math.round((Math.min(bounces, visits) / visits) * 100) : 0;
  const pBounce = pVisits ? Math.round((Math.min(num(b.bounces), pVisits) / pVisits) * 100) : 0;
  const avgVisit = visits ? totaltime / visits : 0;
  const pAvg = pVisits ? num(b.totaltime) / pVisits : 0;

  const card = (label, value, delta) => `<td style="width:33%;padding:12px;background:#F5F6F8;border-radius:10px;vertical-align:top">
      <div style="font-size:12px;color:#6B7484">${label}</div>
      <div style="font-size:22px;font-weight:800;color:#1E3F73;margin-top:2px">${value}</div>
      <div style="font-size:12px;margin-top:2px">${delta}</div></td>`;

  const forms = (d.events || []).filter((e) => e.x === "form-submit").reduce((a, e) => a + e.y, 0);
  const highlight = forms
    ? `<p style="margin:16px 0 0;padding:12px 14px;background:#F6EEDC;border-radius:10px;font-weight:700">${fa(forms)} درخواست از طریق فرم سایت ثبت شد. جزئیات در ایمیل‌های FormSubmit است.</p>`
    : "";

  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>گزارش روزانه‌ی ${esc(site)}</title></head>
<body style="margin:0;background:#EEF0F3;font-family:Tahoma,Vazirmatn,sans-serif;color:#141B26">
<div style="max-width:600px;margin:0 auto;padding:20px 12px" dir="rtl">
 <div style="background:#1E3F73;color:#fff;border-radius:14px 14px 0 0;padding:18px 20px">
  <div style="font-size:13px;color:#D8AA58">گزارش روزانه‌ی بازدید</div>
  <div style="font-size:20px;font-weight:800;margin-top:4px">${esc(site)}</div>
  <div style="font-size:13px;color:#DCE5F4;margin-top:4px">${faDate(day.startAt)}</div>
 </div>
 <div style="background:#fff;border-radius:0 0 14px 14px;padding:18px 20px">
  <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:6px"><tr>
   ${card("بازدیدکننده", fa(visitors), change(visitors, pVisitors))}
   ${card("بازدید", fa(visits), change(visits, pVisits))}
   ${card("صفحه‌ی دیده‌شده", fa(views), change(views, pViews))}
  </tr><tr>
   ${card("نرخ پرش", `${fa(bounceRate)}٪`, change(bounceRate, pBounce, true))}
   ${card("میانگین مدت بازدید", duration(avgVisit), change(avgVisit, pAvg))}
   ${card("صفحه در هر بازدید", visits ? fa((views / visits).toFixed(1)) : "۰", "")}
  </tr></table>
  <p style="font-size:12px;color:#6B7484;margin:6px 6px 0">درصدها در مقایسه با روز قبل است.</p>
  ${highlight}
  ${table("رویدادها", d.events, (r) => esc(EVENT_LABELS[r.x] || r.x))}
  ${table("پربازدیدترین صفحه‌ها", d.pages, (r) => `<span dir="ltr" style="unicode-bidi:isolate">${esc(decodeURIComponent(r.x || "/"))}</span>`)}
  ${table("منابع ورود", d.referrers, (r) => (r.x ? `<span dir="ltr">${esc(r.x)}</span>` : "مستقیم"))}
  ${table("کشورها", d.countries, (r) => esc(country(r.x)))}
  <p style="margin:24px 0 0;font-size:12px;color:#6B7484">گزارش کامل: <a href="https://cloud.umami.is" style="color:#1E3F73">cloud.umami.is</a></p>
 </div>
</div></body></html>`;
}

// ---------- run ----------
const data = await collect();
const html = render(data);
const subject = `گزارش روزانه‌ی ${site}: ${fa(num(data.stats.visitors))} بازدیدکننده، ${fa(num(data.stats.pageviews))} صفحه`;

const out = opt("--out");
if (out || mockFile) {
  writeFileSync(out || "daily-report.html", html);
  console.log(`Wrote ${out || "daily-report.html"} — ${subject}`);
  process.exit(0);
}
if (!env.SMTP_USERNAME || !env.SMTP_PASSWORD) {
  console.log("SMTP_USERNAME/SMTP_PASSWORD not set; report built but not sent.");
  process.exit(0);
}
const { default: nodemailer } = await import("nodemailer");
const transport = nodemailer.createTransport({
  host: env.SMTP_HOST || "smtp.gmail.com", port: Number(env.SMTP_PORT || 465), secure: true,
  auth: { user: env.SMTP_USERNAME, pass: env.SMTP_PASSWORD },
});
await transport.sendMail({
  from: `"گزارش ${site}" <${env.SMTP_USERNAME}>`,
  to: env.REPORT_TO || env.SMTP_USERNAME,
  subject, html,
});
console.log(`Sent: ${subject}`);
