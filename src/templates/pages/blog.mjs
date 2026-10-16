import { escapeHtml as e, pathFor, formatDate } from '../helpers.mjs';
import { breadcrumb, tags, postCard, catalogControls } from '../components.mjs';
import { routes } from '../../data/routes.mjs';

export function blogPage(site, posts) {
  return {
    title: 'Blog', description: 'Notes on software engineering, design, and automation from TXO R.',
    active: 'blog', path: routes.blog, styles: ['blog', 'catalog'], scripts: ['filters'],
    content: `<div class="page">${breadcrumb(site, [['Blog']])}<div class="blog-heading"><header class="page-heading"><p class="eyebrow">From the lab</p><h1>Blog</h1><p class="lead">Notes on software, design, automation, and the ideas behind the work.</p></header><a class="button button-outline" href="${e(pathFor(site, routes.rss))}">Subscribe via RSS</a></div>
      <section data-catalog data-filter-param="tag" data-item-label="articles" aria-label="Blog articles">
        ${catalogControls('Articles', posts.flatMap(post => post.tags))}
        <p class="catalog-status" data-catalog-status role="status" aria-live="polite">${posts.length} articles</p>
        <div class="post-list">${posts.map(post => postCard(site, post)).join('')}</div>
        ${posts.length ? '' : '<p>No articles published yet. Check back soon.</p>'}
        <p class="notice" data-catalog-empty hidden>No articles match. Try another search or choose All.</p>
      </section>
    </div>`,
  };
}

export function articlePage(site, post, posts) {
  const index = posts.findIndex(item => item.slug === post.slug);
  const newer = posts[index - 1];
  const older = posts[index + 1];
  return {
    title: post.title, description: post.description, path: routes.article(post.slug), active: 'blog', styles: ['blog'], article: post,
    content: `<article class="page article">${breadcrumb(site, [['Blog', routes.blog], [post.title]])}
      <header class="article-header"><p class="eyebrow">From the lab</p><h1>${e(post.title)}</h1><p class="lead">${e(post.description)}</p><p class="post-meta">By ${e(site.author)} · <time datetime="${e(post.date)}">${e(formatDate(post.date))}</time> · ${post.readingMinutes} min read</p>${tags(post.tags, site)}</header>
      <div class="prose">${post.content}</div>
      <footer class="article-footer"><a class="text-link" href="${e(pathFor(site, routes.blog))}">← All articles</a><p>Get new articles in your feed reader: <a href="${e(pathFor(site, routes.rss))}">subscribe via RSS</a>.</p>
        <nav class="article-navigation" aria-label="More articles">${newer ? `<a href="${e(pathFor(site, routes.article(newer.slug)))}">Newer: ${e(newer.title)}</a>` : ''}${older ? `<a href="${e(pathFor(site, routes.article(older.slug)))}">Older: ${e(older.title)}</a>` : ''}</nav>
      </footer>
    </article>`,
  };
}
