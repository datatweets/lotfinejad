# lotfinejad.ir

Personal branding site & Persian-language blog, built with [Hugo](https://gohugo.io)
and deployed to GitHub Pages via GitHub Actions.

- **Live site:** https://lotfinejad.ir
- **Language:** Persian (فارسی), RTL, with correctly-isolated LTR runs for
  embedded English/code.
- **Font:** [Vazirmatn](https://github.com/rastikerdar/vazirmatn) (SIL Open
  Font License), self-hosted as a variable font at
  `static/fonts/vazirmatn/`. License text: `static/fonts/vazirmatn/LICENSE.txt`.
- **Theme:** custom, no third-party Hugo theme — templates in `layouts/`,
  styles in `assets/css/main.css`.

## Local development

```bash
hugo server -D
```

## Content structure

| Path                       | Purpose                                          |
| --------------------------- | ------------------------------------------------- |
| `content/_index.md`         | Home page                                         |
| `content/about/_index.md`   | About / bio                                       |
| `content/projects/`         | Portfolio — one Markdown file per project         |
| `content/posts/`            | Blog posts                                        |
| `content/resume.md`         | Resume page (renders `data/resume.yaml`)          |
| `data/resume.yaml`          | Structured experience / education / skills        |

All placeholder content is marked with a `TODO` HTML comment — search for
`TODO` before considering a page finished.

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
