import { escapeHtml as e, pathFor, absoluteFor } from './helpers.mjs';
import { routes } from '../data/routes.mjs';

export function layout({ site, title, description = site.description, path = '', active = '', content, styles = [], scripts = [], article }) {
  const navigation = [
    ['home', 'About Me', routes.about], ['services', 'Services', routes.services],
    ['projects', 'Projects', routes.projects], ['blog', 'Blog', routes.blog], ['contact', 'Contact Me', routes.contact],
  ];
  const canonical = absoluteFor(site, path);
  const structuredData = article ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: article.title, description: article.description,
    datePublished: article.date,
    author: { '@type': 'Person', name: site.author },
    mainEntityOfPage: canonical,
  }).replace(/</g, '\\u003c') : '';
  return `<!doctype html>
<html lang="${e(site.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#1a1a1a">
  <title>${e(title)} — ${e(site.name)}</title>
  <meta name="description" content="${e(description)}">
  <link rel="canonical" href="${e(canonical)}">
  <meta property="og:type" content="${article ? 'article' : 'website'}">
  <meta property="og:site_name" content="${e(site.name)}">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(description)}">
  <meta property="og:url" content="${e(canonical)}">
  <link rel="icon" type="image/svg+xml" href="${e(pathFor(site, 'assets/images/favicon.svg'))}">
  <link rel="alternate" type="application/rss+xml" title="${e(site.name)} Blog" href="${e(pathFor(site, routes.rss))}">
  ${['base', 'layout', 'components', ...styles].map(style => `<link rel="stylesheet" href="${e(pathFor(site, `assets/css/${style}.css`))}">`).join('\n  ')}
  <script type="module" src="${e(pathFor(site, 'assets/js/navigation.js'))}"></script>
  ${scripts.map(script => `<script type="module" src="${e(pathFor(site, `assets/js/${script}.js`))}"></script>`).join('\n  ')}
  ${structuredData ? `<script type="application/ld+json">${structuredData}</script>` : ''}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><div class="container header-inner">
    <a class="brand" href="${e(pathFor(site, routes.home))}" aria-label="${e(site.name)} home">${e(site.name)}</a>
    <button class="nav-toggle" type="button" aria-label="Open navigation" aria-controls="site-navigation" aria-expanded="false" hidden>
      <span class="nav-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span>
    </button>
    <nav id="site-navigation" class="site-navigation" aria-label="Main navigation">
      ${navigation.map(([key, label, href]) => `<a href="${e(pathFor(site, href))}"${key === active ? ' aria-current="page"' : ''}>${e(label)}</a>`).join('\n      ')}
      <a class="button button-solid hire-link" href="${e(pathFor(site, routes.contact))}">Hire me</a>
    </nav>
  </div></header>
  <main id="main" tabindex="-1">${content}</main>
  <footer class="site-footer"><div class="container footer-inner"><p>${e(site.license)}</p><nav class="footer-navigation" aria-label="Footer navigation"><a href="${e(pathFor(site, routes.blog))}">Blog</a><a href="${e(pathFor(site, routes.rss))}">RSS feed</a></nav></div></footer>
</body>
</html>\n`;
}
