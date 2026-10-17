# TXO R portfolio — Go

Go powers the whole site through the standard library’s `html/template` engine. The frontend stays vanilla HTML, CSS, and JavaScript. No Node, npm, external Go dependencies, authentication, CMS, or database.

## Run locally

Requires Go 1.27 or newer. From the repository root:

```sh
go run ./cmd/portfolio serve
```

Open `http://127.0.0.1:8000/`. Go renders every page from the templates, serves local assets, and provides RSS, the sitemap, and proper 404 responses. Restart after editing source files. The server listens locally by default and supports graceful shutdown.

```sh
go run ./cmd/portfolio serve -addr 127.0.0.1:8080
```

`PORT` also sets the default port. Use `-root` when running against a different repository directory.

## Generate the static site

```sh
go run ./cmd/portfolio build
```

Publish the **contents of `dist/`**. No Go runtime is needed on a static host. The same templates and content power both the Go server and generated HTML. The build includes RSS, sitemap, robots.txt, 404.html, assets, `.nojekyll`, and the root `CNAME` file. It only removes stale files recorded in the previous build manifest.

The GitHub Pages workflow builds with Go and deploys `dist/`; the existing `txorav.me` domain is retained. No SPA fallback or Node build step is needed. Tests are not run by the build or workflow.

## Manual GitHub CI/CD

The original repository is [txorav/txorav.github.io](https://github.com/txorav/txorav.github.io). `.github/workflows/deploy.yml` runs **only when manually dispatched**; pushing a commit does not deploy automatically.

1. Commit and push the Go rewrite, content, and workflow to the original repository's `main` branch. Actions runs committed GitHub code, not uncommitted files on your machine.
2. In the repository's **Settings → Pages**, select **GitHub Actions** as the deployment source.
3. Open **Actions → Manual CI/CD → Run workflow** and choose `main`, or use GitHub CLI:

```sh
gh workflow run deploy.yml --repo txorav/txorav.github.io --ref main
```

CI checks Go formatting, runs `go vet`, compiles the application, generates the static site, and uploads the Pages artifact. Deployment runs only after CI succeeds and only for `main`; manually selecting another branch runs CI without changing the live site. No unit tests are invoked.

Follow runs in the [original repository's Actions page](https://github.com/txorav/txorav.github.io/actions/workflows/deploy.yml). The deployment's `github-pages` environment shows the published URL. The custom domain remains **https://txorav.me/** through the published `CNAME` file. GitHub Pages hosts the generated static files, not the Go development server.

## Structure

- `cmd/portfolio/main.go`: `build` / `serve` commands and server lifecycle.
- `internal/site/site.go`: configuration, typed content, article loading, and shared routes.
- `internal/site/render.go`: page registration, template helpers, and rendering.
- `internal/site/publish.go`: static output, RSS/XML sitemap, and asset publishing.
- `internal/site/http.go`: HTTP routes, redirects, headers, and 404 handling.
- `src/templates/layout.gohtml`: shared HTML document and footer.
- `src/templates/partials/`: shared navigation, cards, breadcrumbs, and other components.
- `src/templates/pages/`: separate templates for every page and detail view.
- `src/data/site.json`: identity, public URL, contact address, and copyright.
- `src/data/services.json`: services and workflow; workflow entries are `[title, description]` pairs.
- `src/data/projects.json`: project content; metric entries are `[label, value]` pairs.
- `src/content/posts/`: article metadata and HTML bodies.
- `src/assets/`: local styles, browser JavaScript, and artwork.
- `dist/`: generated output; edit source files rather than generated HTML.

The original single-file prototype remains unchanged as a reference, but is not part of the published site.

## Routes

| URL | Static output |
| --- | --- |
| `/` | `dist/index.html` |
| `/services/` | `dist/services/index.html` |
| `/services/graphic-design/` | `dist/services/graphic-design/index.html` |
| `/projects/` | `dist/projects/index.html` |
| `/projects/oxydoo/` | `dist/projects/oxydoo/index.html` |
| `/blog/` | `dist/blog/index.html` |
| `/blog/welcome-to-the-lab/` | `dist/blog/welcome-to-the-lab/index.html` |
| `/contact/` | `dist/contact/index.html` |
| `/rss.xml` | `dist/rss.xml` |

Every service, project, and published article gets a real route. The Go server redirects `/blog` and `/blog/index.html` to `/blog/`; unknown pages return HTTP 404. Static hosting needs directory-index support. URLs honor a subdirectory configured in the public site URL.

Mobile navigation keeps the shared bare hamburger/X icon, keyboard support, and outside-click dismissal. CSS and JavaScript URLs include a build version to avoid stale assets after deployment. Search and topic/category filtering are browser enhancements; all articles, projects, and navigation links exist in server-rendered HTML without JavaScript. Topic links support shareable URLs such as `/blog/?tag=Development`.

## Add an article

Create matching files in `src/content/posts/`. Their lowercase, hyphenated filename becomes the URL slug.

`my-article.json`:

```json
{
  "title": "My article",
  "description": "A short summary for the blog and RSS.",
  "date": "2026-10-16",
  "tags": ["Development"],
  "draft": false
}
```

`my-article.html`:

```html
<p>Your introduction.</p>
<h2>A section</h2>
<p>Write article content here.</p>
```

Use an HTML body fragment, not a complete document. Escape code samples with `&lt;` and `&gt;`. Links such as `../../projects/` resolve from article pages and are converted to absolute URLs in RSS. Article HTML is trusted author code; all metadata is automatically escaped by Go templates.

Restart the server or rebuild to publish `/blog/my-article/`. Posts are ordered newest first; drafts and future-dated entries are excluded from routes, RSS, and the sitemap. Scheduled posts require a restart/rebuild on their publication date. Keep published slugs stable to preserve links and RSS identifiers. The included welcome article is starter content you can replace.

## Configuration

Edit `src/data/site.json`. `SITE_URL` and `CONTACT_EMAIL` environment variables override its URL and email. The URL must include the public domain and any deployment subdirectory; it determines canonical links, RSS, and sitemap URLs. No contact address has been invented.

The inquiry form prepares a brief locally and supports copy/download. When an email is configured, it provides an email-app link for the visitor to review and send. It never claims a message was sent and stores no personal information.
