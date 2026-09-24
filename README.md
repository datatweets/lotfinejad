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
contact, footer). Site copy is written in formal third-person/impersonal
Persian — no first person:

| Path                    | Purpose                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `hugo.toml` `[params]`  | Name, headline, tagline, email, "how I work" list, `about` paragraphs |
| `data/home.yaml`        | Home page: hero text, stats, "worked with" names, services      |
| `data/focus.yaml`       | The three "حوزه‌های تمرکز" focus-area cards (about page)        |
| `data/resume.yaml`      | Resume: summary, stats, achievements, experience, skills, education, certifications, publications, languages |
| `static/files/Mehdi_Lotfinejad_Resume.pdf` | Downloadable PDF resume linked from the resume page — keep in sync with `data/resume.yaml` |
| `data/links.yaml`       | Social/external links (GitHub, LinkedIn, X, Medium, …)          |
| `data/projects.yaml`    | Project cards (linking out to GitHub repos)                     |
| `content/_index.md`     | Home page (front matter only — body isn't used)                 |
| `content/about.md`      | About page (`type: about`)                                       |
| `content/projects.md`   | Projects page (`type: projects`)                                 |
| `content/resume.md`     | Resume page (`type: resume`)                                     |
| `content/contact.md`    | Contact page (`type: contact`)                                   |
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
