# TXO R portfolio

A static, vanilla HTML/CSS/JavaScript website. No npm, frameworks, authentication, CMS, database, runtime API, or third-party CDN is required. The original single-file page is kept unchanged as a reference.

## Generate the site

With Node.js 18.17 or newer:

```sh
node scripts/build.mjs
```

This dependency-free JavaScript script writes ready-to-host HTML, CSS, JavaScript, RSS, a sitemap, and a 404 page into `dist/`. It does not run tests. Node is only needed when generating the site, not on the hosting server.

To view it locally with working directory routes, use the included dependency-free server:

```sh
node scripts/serve.mjs
```

It generates the site on startup and serves `dist/` at `http://localhost:8000/`. Restart it after editing source files. Set `PORT` to choose another port. The server is local-only and is not needed on a static hosting service.

Alternatively, serve `dist/` with any static server (for example, `python3 -m http.server 8000 --directory dist`). Use HTTP rather than double-clicking HTML files: the browser scripts use native JavaScript modules.

## Structure

- `src/data/site.mjs`: identity, public URL, contact email, and copyright text.
- `src/data/routes.mjs`: shared navigation, blog, article, topic-filter, and RSS paths.
- `src/data/services.mjs`: service descriptions, deliverables, pricing, and workflow.
- `src/data/projects.mjs`: projects, case studies, tags, metrics, and optional demo/source URLs.
- `src/templates/layout.mjs`: shared document head, navigation, and footer.
- `src/templates/components.mjs`: shared cards, breadcrumbs, tags, and calls to action.
- `src/templates/pages/`: separate home, services, projects, contact, and blog templates.
- `src/assets/css/`: design tokens/base rules, layout, components, and page styles.
- `src/assets/js/`: navigation, optional search/filtering, and local contact drafting.
- `src/assets/images/`: local artwork; replace these files with your own images as needed.
- `src/content/posts/`: article metadata and HTML content.
- `scripts/`: generation and RSS code; no dependencies to install.
- `dist/`: generated output. Change source files, not generated HTML.

All core content and navigation are delivered as HTML. JavaScript only enhances mobile navigation, filters, and the inquiry draft. Page links work with browser history, direct URLs, and refreshes; there is no client-side router.

## Routes and navigation

| Route | Generated page |
| --- | --- |
| `/` | `dist/index.html` |
| `/services/` | `dist/services/index.html` |
| `/projects/` | `dist/projects/index.html` |
| `/blog/` | `dist/blog/index.html` |
| `/blog/welcome-to-the-lab/` | `dist/blog/welcome-to-the-lab/index.html` |
| `/contact/` | `dist/contact/index.html` |
| `/rss.xml` | `dist/rss.xml` |

Each service, project, and published article has its own directory route. The local server redirects URLs such as `/blog` to `/blog/`, supports direct visits and refreshes, and returns the generated 404 page for unknown paths. Static hosting only needs directory-index support; no SPA rewrites are required. All routes honor a configured site subdirectory.

Blog topic links use shareable URLs such as `/blog/?tag=Development`. Search and topic filtering enhance the static article list; every article remains accessible without JavaScript. Blog and RSS links are shared across every page's header/footer.

Mobile navigation uses a round hamburger button that changes to a close icon. Its dropdown closes on navigation, Escape, an outside click, or tabbing out. Desktop navigation is restored when resizing, and links remain visible when JavaScript is disabled.

## Add an article

Create a pair of files in `src/content/posts/`. The shared filename becomes the URL slug. Use lowercase letters, numbers, and hyphens.

For example, `my-new-article.json`:

```json
{
  "title": "My new article",
  "description": "A short summary for the blog and RSS feed.",
  "date": "2026-10-15",
  "tags": ["Development"],
  "draft": false
}
```

Then `my-new-article.html`:

```html
<p>Your introduction.</p>
<h2>A section heading</h2>
<p>Your article content.</p>
<pre><code>const message = 'Hello';</code></pre>
```

Write just the article body, not an entire HTML document. HTML is trusted author-written code, not visitor input. Escape angle brackets in code samples as `&lt;` and `&gt;`. Links to the site root from an article can use `../../`; for example, `../../projects/`. The generator makes relative article links absolute in RSS.

Run `node scripts/build.mjs` again. The article appears at `/blog/my-new-article/`, on the blog index, and in `/rss.xml`, newest first. Drafts and future-dated posts are excluded from pages, the sitemap, and RSS. Future posts require a new build on or after their publication date. Removed or unpublished articles are removed from the next generated output. Keep slugs stable after publishing so RSS item identifiers stay stable.

The included welcome article is starter content; edit or replace it.

## Before publishing

1. Set `url` in `src/data/site.mjs` to your actual public HTTPS URL, including a trailing slash. Subdirectory hosting is supported; include that subdirectory in the URL.
2. Set `email` to your real contact address. No address was present in the original source, so none is invented here.
3. Replace the illustrative covers/artwork and edit the content to suit your actual work. Project `image` values are paths relative to the site root. Project `url` values may be public HTTP(S) demo or source URLs; empty values link to an inquiry instead.
4. Generate the site and upload **the contents of `dist/`** to a static host. Configure `404.html` as the host’s error page if supported.

You can also supply `SITE_URL` and `CONTACT_EMAIL` as environment variables when generating. The default URL is only for local development; do not publish an RSS feed with localhost links.

## Contact behavior

There is deliberately no backend. The contact form validates and prepares a brief locally, lets visitors copy/download it, and provides an email-app link when a contact address is configured. It never claims a message was sent. Without JavaScript, the direct email link remains usable if configured. Nothing is saved in local storage, and there are no analytics or external fonts.

## RSS

The feed is `rss.xml` at the deployment root, linked from every page’s head and footer and from the blog. It includes titles, summaries, publication dates, categories, stable article URLs, and full article content. It is generated from the same source as the blog so there is no second article list to maintain.
