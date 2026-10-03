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
| `hugo.toml` `[params]`  | Name, headline, tagline, email, "how I work" list, `about` paragraphs |
| `data/home.yaml`        | Home page: hero text, stats, "worked with" names, services      |
| `data/training.yaml`    | Training page (`/training/`): formats, career paths, course catalogue (mirrors datatweets.com), FAQ |
| `content/training.md`   | Training page (`type: training`)                                 |
| `data/consultation.yaml` | Consultation page (`/consultation/`): offer, next steps, topics, FAQ |
| `data/services.yaml`    | Services page (`/services/`): 13 consulting services, engagement models, industries |
| `content/services.md`   | Services page (`type: services`)                                 |
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

`data/courses/<slug>.yaml` holds the Persian outline of each course (translated
from datatweets.com): title, summary, level, outcomes, prerequisites, tools,
project and every module/lesson. From these:

- `content/outlines/_content.gotmpl` generates one printable page per course at
  `/outlines/<slug>/` (template: `layouts/outlines/single.html`, A4 print styles,
  static Vazirmatn weights in `static/fonts/vazirmatn/static/`);
- the training page shows each course as a collapsible summary with its PDF;
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

## SEO and answer engines

- `layouts/partials/head.html`: titles (`Page | Name`), per-page descriptions
  (front matter `description`, else a post's `summary`), canonical, Open Graph /
  Twitter tags with the share image `static/images/og.jpg` (1200×630).
- `layouts/partials/schema.html`: one JSON-LD `@graph` per page, built from the
  same data files as the visible content — WebSite + Person everywhere,
  ProfessionalService, BreadcrumbList, BlogPosting (posts), Service list
  (`/services/`), Course list (`/training/`) and FAQPage wherever an FAQ is shown.
- `/llms.txt` (template `layouts/index.llms.txt`): a plain-text summary of
  services, courses, FAQ and contact for AI answer engines; regenerated on build.
- `/sitemap.xml`: `lastmod` from a post's own date, else git (`enableGitInfo`), per-page `priority`
  and `changefreq` in front matter (`sitemap:`); outline print pages excluded.
- `layouts/robots.txt` points to the sitemap and keeps `/outlines/` and `/print/`
  (print pages) out of the index; taxonomy pages are disabled.
- No third-party fonts: only self-hosted Vazirmatn (Google Fonts is slow or
  filtered for many Iranian visitors). The portrait is resized by Hugo from
  `assets/images/avatar.jpg` (`layouts/partials/avatar.html`).
