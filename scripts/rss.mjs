import { escapeHtml as e, absoluteFor } from '../src/templates/helpers.mjs';
import { routes } from '../src/data/routes.mjs';

function feedContent(site, post) {
  const base = absoluteFor(site, routes.article(post.slug));
  return post.content.replace(/\b(href|src)\s*=\s*(["'])(.*?)\2/gi, (match, attribute, quote, value) => {
    if (/^[a-z][a-z\d+.-]*:/i.test(value)) return match;
    const absolute = new URL(value.replace(/&amp;/g, '&'), base).href;
    return `${attribute}=${quote}${e(absolute)}${quote}`;
  });
}

function cdata(value) {
  return `<![CDATA[${value.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

export function createRss(site, posts) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${e(site.name)} Blog</title>
    <link>${e(absoluteFor(site, routes.blog))}</link>
    <description>Notes on software, design, and automation from ${e(site.name)}.</description>
    <language>${e(site.language)}</language>
    <copyright>${e(site.license)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${e(absoluteFor(site, routes.rss))}" rel="self" type="application/rss+xml"/>
    ${posts.map(post => {
      const url = e(absoluteFor(site, routes.article(post.slug)));
      return `<item>
      <title>${e(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${e(post.description)}</description>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      ${post.tags.map(tag => `<category>${e(tag)}</category>`).join('\n      ')}
      <content:encoded>${cdata(feedContent(site, post))}</content:encoded>
    </item>`;
    }).join('\n    ')}
  </channel>
</rss>\n`;
}
