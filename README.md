# lotfinejad.ir

Personal branding site & Persian-language blog, built with [Hugo](https://gohugo.io)
and deployed to GitHub Pages via GitHub Actions.

- **Live site:** https://lotfinejad.ir
- **Language:** Persian (فارسی), RTL, with correctly-isolated LTR runs for
  embedded English/code.
- **Fonts:** [Vazirmatn](https://github.com/rastikerdar/vazirmatn) (SIL Open
  Font License) for Persian text, self-hosted as a variable font at
  `static/fonts/vazirmatn/` (license: `static/fonts/vazirmatn/LICENSE.txt`).
  Source Sans 3 (Latin) and IBM Plex Mono (code/repo-names/numerals) load
  from Google Fonts.
- **Design:** a consultant-style site with a "lapis & gold" palette —
  one 1080px content column shared by every page (common page header,
  section heads, cards, closing call to action and footer), sticky text
  nav with a consultation button, light/dark toggle (persisted in
  `localStorage`, falls back to OS preference), post list with category
  filter + search, print-ready resume. Custom theme, no third-party Hugo
  theme — templates in `layouts/`, one stylesheet at
  `assets/css/main.css`, behaviour in `assets/js/app.js`.

## Local development

```bash
hugo server -D
```

## Deploying

```bash
./deploy.sh                  # build locally, commit any changes, push, wait for the live deploy
./deploy.sh "my message"     # same, with your own commit message
./deploy.sh --no-watch       # push and exit immediately, don't wait for GitHub Actions
```

It runs a local Hugo build first and refuses to push if that fails, so a
broken build never reaches GitHub Pages. Nothing to push (no local changes,
already in sync with `origin/main`) is a normal, silent no-op.

## Content structure

Most identity/profile content lives in **config and data files**, not
Markdown, since it's reused across several pages (home, about, resume,
consultation, footer). Site copy is written in formal third-person/impersonal
Persian — no first person:

| Path                    | Purpose                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `hugo.toml` `[params]`  | Name, headline, tagline, email, `about` paragraphs |
| `data/principles.yaml`  | «اصول کاری» on the About page (title + description per principle) |
| `data/home.yaml`        | Home page: hero text, stats, "worked with" names, services      |
| `data/training.yaml`    | Training page (`/training/`): formats, career paths, course catalogue, FAQ |
| `data/courses/<slug>.yaml` | One course: summary, level, outcomes, prerequisites, tools, modules/lessons. Duration is derived in `layouts/partials/course-duration.html` (≤36 lessons → 2 days, 37–49 → 3, 50+ → 4; 8 h/day); an optional `hours:` overrides it |
| `content/training/_index.md` | Training page (`layouts/training/list.html`)                |
| `content/training/_content.gotmpl` | Generates one page per course at `/training/<slug>/` (`layouts/training/single.html`) |
| `data/consultation.yaml` | Consultation page (`/consultation/`): offer, next steps, topics, FAQ |
| `content/services/_content.gotmpl` | Generates a page per service with a `slug` + `page` block in `data/services.yaml`, at `/services/<slug>/` (`layouts/services/single.html`) |
| `data/services.yaml`    | Services page (`/services/`): 13 consulting services, engagement models, industries |
| `content/services/_index.md` | Services page (`layouts/services/list.html`)                 |
| `content/consultation.md` | Consultation page (`type: consultation`)                       |
| `content/contact.md`      | Contact page (`type: contact`): the smart request form          |
| `data/contact.yaml`       | Smart form: intents (fields copy, subject, button, success text, next steps), referral sources |
| `layouts/partials/smart-form.html` | Smart request form used on `/contact/` and `/consultation/` |
| `layouts/partials/smart-steps.html` | Sidebar "after you send" steps, switch with the form's topic |
| `data/focus.yaml`       | The three "حوزه‌های تمرکز" focus-area cards (about page)        |
| `data/resume.yaml`      | Resume: summary, stats, achievements, experience, skills, education, certifications, publications, languages |
| `static/files/Mehdi_Lotfinejad_Resume.pdf` | Downloadable PDF resume linked from the resume page — keep in sync with `data/resume.yaml` |
| `data/links.yaml`       | Social/external links (GitHub, LinkedIn, X, Medium, …)          |
| `content/_index.md`     | Home page (front matter only — body isn't used)                 |
| `content/about.md`      | About page (`type: about`)                                       |
| `content/resume.md`     | Resume page (`type: resume`)                                     |
| `content/posts/`        | Blog posts — real Markdown content                                |

`hugo.toml`'s `email` param is still the placeholder `you@lotfinejad.ir` —
search for `TODO` across the repo before considering a page finished.

### Post front matter

```yaml
title: "..."
date: 2026-09-11        # real Gregorian date — used for sorting/RSS
jdate: [1405, 6, 20]     # Jalali [year, month, day] — used for display
category: "بازار کار"    # one label, shown as a badge; also drives the
                         # posts-list filter chips
tags: ["...", "..."]
readMinutes: 5           # manually set, not auto-computed
summary: "..."           # excerpt shown in lists/cards
chart:                   # optional — only needed if the post uses {{< chart >}}
  title: "..."
  sub: "..."
  rows: [["مهارت‌های ابری", 85.7], ["Python", 76.2]]
```

Dates are authored directly as Jalali `[y, m, d]` — `jdate` is a display
value, not a Gregorian→Jalali conversion, so it won't auto-update; write
the real Jalali date on the post.

### Shortcodes for article bodies

- `{{</* pullquote */>}}...{{</* /pullquote */>}}` — a pulled-quote callout.
- `{{</* steps */>}}{{</* step title="..." */>}}description{{</* /step */>}}...{{</* /steps */>}}` —
  a numbered step list (title + description per step).
- `{{</* chart */>}}` — renders the bar chart from that post's `chart` front
  matter (see above). No arguments — reads `.Page.Params.chart`.
- Plain Markdown bullet lists (`- item`) and `## heading`s are styled
  automatically inside article bodies — no shortcode needed. The article's
  opening paragraph is auto-styled as a "lede" (larger, no shortcode
  needed either — it's just whatever paragraph comes first).

### Writing Persian text with embedded English/code

Wrap short Latin runs (brand names, tool names) in the `en` shortcode so they
render as an isolated LTR span instead of disrupting the surrounding RTL flow:

```markdown
من با {{</* en */>}}Python{{</* en */>}} کار می‌کنم.
```

Plain text only: use `{{</* en */>}}...{{</* /en */>}}`. If the content
inside contains **Markdown** (a link, bold text, etc.), use `%` delimiters
instead so Hugo parses it as Markdown before wrapping it:

```markdown
{{</* en %}}[GitHub](https://github.com/you){{% /en */>}}
```

(`<` passes content through raw; `%` re-renders it as Markdown. Using `<`
around a Markdown link prints the literal `[text](url)` instead of a link.)

Fenced code blocks need no special handling — all `pre`/`code` elements are
forced LTR and monospace globally via `assets/css/main.css`.

## Deployment

Pushing to `main` triggers `.github/workflows/hugo.yml`, which builds the
site with Hugo and publishes it via GitHub's native "Deploy from GitHub
Actions" Pages source (no `gh-pages` branch).

The custom domain (`lotfinejad.ir`) is configured both as `static/CNAME` and
in the repository's **Settings → Pages → Custom domain**. DNS must point at
GitHub Pages (see the setup notes given at scaffold time, or GitHub's
[custom domain docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)).

## Forms

One smart form (`layouts/partials/smart-form.html`, copy in `data/contact.yaml`)
serves four topics: general message, consultation, project, course request.
Choosing a topic swaps the topic-specific fields, which fields are required,
the email subject, the button, the success text and the sidebar steps. Hidden
parts are disabled, so they are neither validated nor sent.

The topic is picked automatically, in this order:

1. the link: `?type=message|consulting|project|course` (`training`/`other`
   also accepted), `?course=<Persian course title>` (→ course, preselected),
   `?service=<service title>` (→ consultation, service preselected);
2. the referring page: `/training/` or `/outlines/` → course, `/services/` →
   consultation;
3. a saved draft (fields autosave in the visitor's browser until sent);
4. the page default: `/contact/` → message, `/consultation/` → consultation.

`/consultation/` is fixed (`"fixed" true`): it always opens on consultation
unless the link names a topic; a saved draft there restores only the fields.

Every submission also carries «منبع درخواست» (from `?ref=`, e.g. `ref=pdf` in
the course PDFs, or the referring page/site, plus `utm_source`) and the page it
was sent from. The subject line reads e.g. «درخواست برگزاری دوره — یادگیری ماشین — <org>».

Submissions post to [FormSubmit](https://formsubmit.co) (`formEndpoint` in
`hugo.toml`) from `assets/js/app.js`; no backend needed.
**One-time setup:** after deploying, submit the form once yourself; FormSubmit
emails an activation link to `lotfinejad@gmail.com`. Click it, and every later
submission arrives in that inbox. Until then (or if the service is unreachable)
the form shows a prefilled "send by email" fallback, so no enquiry is lost.

## Course outlines (training page)

`data/courses/<slug>.yaml` holds the Persian outline of each course: title,
summary, level, outcomes, prerequisites, tools, project and every
module/lesson. Some courses adapt material from datatweets.com; others are
developed from the trainer's professional experience. From these:

- `content/outlines/_content.gotmpl` generates one printable page per course at
  `/outlines/<slug>/` (template: `layouts/outlines/single.html`, A4 print styles,
  static Vazirmatn weights in `static/fonts/vazirmatn/static/`);
- `content/training/_content.gotmpl` generates an indexable course page per
  course at `/training/<slug>/` (full syllabus, outcomes, prerequisites, tools,
  related courses, Course schema with offers and course instances);
- the training page shows each course as a collapsible summary with its PDF
  and a link to its course page;
- `static/files/outlines/<slug>.pdf` are printed from the outline pages.

After editing a course YAML, regenerate the PDFs and commit them:

```bash
hugo server                       # terminal 1
npm i -D playwright               # once
node scripts/build-outlines.mjs   # terminal 2 (default base http://localhost:1313)
```

## Résumé

- `/resume/` (Persian) is built from `data/resume.yaml`. Its print styles
  (`@media print` in `assets/css/main.css`) lay it out as a compact A4 document,
  so the page's «چاپ نسخه‌ی فارسی» button gives a clean Persian printout.
- The English PDF `static/files/Mehdi_Lotfinejad_Resume.pdf` is printed from
  `/print/resume-en/` (`data/resume_en.yaml`, `layouts/resume-en/single.html`,
  Inter in `static/fonts/inter/`). It is a two-page, single-column, ATS-friendly
  layout. After editing the YAML (keep it to two pages):

```bash
hugo server                      # terminal 1
node scripts/build-resume.mjs    # terminal 2
```

## Notes (یادداشت‌ها)

`content/posts/` holds the notes. Most are full Persian translations of the
author's English articles on [DATATWEETS Insights](https://datatweets.com/insights/):
each keeps the original date (`date`, plus `jdate` in the Persian calendar)
and links back via `original:` (shown at the end of the note). Job-ad
evidence cards use the `jobad` shortcode so English company/role names keep
their order inside RTL text:

```
{{</* jobad company="Kering" role="AI Engineer — Data & AI" place="پاریس" url="https://…" */>}}
**خواسته‌ها:** …

**چه چیزی را نشان می‌دهد:** …
{{</* /jobad */>}}
```

## Share images

Every page except the home page has its own 1200×630 share image
(`static/images/og/<page-key>.jpg`, key = path with `/` → `-`, e.g.
`training-sql`). They are printed from `/print/og/` (`layouts/og/single.html`)
and picked up automatically by `partials/og-image.html` (og:image and JSON-LD);
pages without one fall back to `static/images/og.jpg`. After adding pages or
changing titles:

```bash
hugo server                  # terminal 1
node scripts/build-og.mjs    # terminal 2
```

## Analytics

Cookie-free [Umami](https://umami.is) analytics, off until
`params.analytics.umamiWebsiteId` is set in `hugo.toml`; it loads only in
production builds and only on lotfinejad.ir. Events: `form-submit` and
`form-fallback` (with topic and source), `pdf-outline` (course), `pdf-resume`,
and `cta-click` (where: nav, drawer, closing, course-page, service-page).

## Daily analytics email

`.github/workflows/daily-report.yml` runs `scripts/daily-report.mjs` every
morning (~07:15 Tehran) and emails a Persian summary of yesterday from Umami:
visitors, visits, page views, bounce rate, visit length (each vs the day
before), events (forms, PDF downloads, CTA clicks), top pages, referrers and
countries. It needs repository secrets (Settings → Secrets and variables →
Actions):

| Secret | Value |
|---|---|
| `UMAMI_SHARE_ID` | free plan: Umami → Websites → lotfinejad.ir → Edit → Share URL → enable; the code at the end of the URL (`…/share/<code>`) |
| `UMAMI_API_KEY` | instead of the share code, on paid plans (Settings → API keys) |
| `SMTP_USERNAME` | the Gmail address that sends the report |
| `SMTP_PASSWORD` | a Gmail App Password (Google Account → Security → App passwords) |
| `REPORT_TO` | optional recipient; defaults to `SMTP_USERNAME` |

Without them the job skips quietly. If Umami Cloud moves its share API, set
`UMAMI_API_BASE` in the workflow (default tries `cloud.umami.is/api`,
`cloud.umami.is/analytics/api`, `api.umami.is/v1`). Test it from Actions → Daily analytics
report → Run workflow. Local preview with sample data:
`node scripts/daily-report.mjs --mock mock.json --out report.html`.

## SEO and answer engines

- `layouts/partials/head.html`: titles (`Page | Name`), per-page descriptions
  (front matter `description`, else a post's `summary`), canonical, Open Graph /
  Twitter tags with the share image `static/images/og.jpg` (1200×630).
- `layouts/partials/schema.html`: one JSON-LD `@graph` per page, built from the
  same data files as the visible content — WebSite + Person everywhere,
  ProfessionalService, BreadcrumbList, BlogPosting (posts), Service list
  (`/services/`), Course list (`/training/`), Course (each `/training/<slug>/`,
  with `courseWorkload` from the duration rule, which Google needs for Course
  rich results), ContactPage (`/contact/`) and FAQPage wherever an
  FAQ is shown.
- Titles: front matter `seoTitle` overrides the `<title>`/og:title while the
  menu and H1 keep `title`. The 404 page is `noindex`.
- RSS (`layouts/_default/rss.xml`): Persian channel text, notes only.
- `/llms.txt` (template `layouts/index.llms.txt`): a plain-text summary of
  services, courses, FAQ and contact for AI answer engines; regenerated on build.
- `/sitemap.xml`: `lastmod` from a post's own date, else git (`enableGitInfo`), per-page `priority`
  and `changefreq` in front matter (`sitemap:`); outline print pages excluded.
- `layouts/robots.txt` points to the sitemap and keeps `/outlines/` and `/print/`
  (print pages) out of the index; taxonomy pages are disabled.
- No third-party fonts: only self-hosted Vazirmatn (Google Fonts is slow or
  filtered for many Iranian visitors). The portrait is resized by Hugo from
  `assets/images/avatar.jpg` (`layouts/partials/avatar.html`).
