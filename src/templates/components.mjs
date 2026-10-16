import { escapeHtml as e, pathFor, formatDate } from './helpers.mjs';
import { routes } from '../data/routes.mjs';

export function tags(items, site) {
  return `<ul class="tags" aria-label="Topics">${items.map(item => `<li>${site ? `<a href="${e(pathFor(site, routes.blogTag(item)))}">${e(item)}</a>` : e(item)}</li>`).join('')}</ul>`;
}

export function breadcrumb(site, items = []) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${e(pathFor(site))}">Home</a></li>${items.map(([label, path]) => `<li>${path ? `<a href="${e(pathFor(site, path))}">${e(label)}</a>` : `<span aria-current="page">${e(label)}</span>`}</li>`).join('')}</ol></nav>`;
}

export function projectCard(site, project) {
  const href = e(pathFor(site, `projects/${project.id}/`));
  return `<article class="project-card" data-catalog-item data-filter-values="${e(JSON.stringify([project.category]))}" data-search="${e([project.title, project.description, ...project.tags].join(' '))}">
    <a class="image-frame project-cover" href="${href}" aria-label="Read about ${e(project.title)}"><img src="${e(pathFor(site, project.image))}" alt="" width="600" height="600" loading="lazy" decoding="async"></a>
    <p class="eyebrow">${e(project.category)}</p>
    <h2><a href="${href}">${e(project.title)}</a></h2>
    <p>${e(project.description)}</p>
    <a class="button button-outline" href="${href}">Learn more<span class="sr-only"> about ${e(project.title)}</span></a>
  </article>`;
}

export function postCard(site, post) {
  return `<article class="post-card panel" data-catalog-item data-filter-values="${e(JSON.stringify(post.tags))}" data-search="${e([post.title, post.description, ...post.tags].join(' '))}">
    <p class="post-meta"><time datetime="${e(post.date)}">${e(formatDate(post.date))}</time> · ${post.readingMinutes} min read</p>
    <h2><a href="${e(pathFor(site, routes.article(post.slug)))}">${e(post.title)}</a></h2>
    <p>${e(post.description)}</p>
    ${tags(post.tags, site)}
    <a class="text-link" href="${e(pathFor(site, routes.article(post.slug)))}">Read article<span class="sr-only">: ${e(post.title)}</span> →</a>
  </article>`;
}

export function catalogControls(label, values) {
  return `<div class="catalog-controls" data-catalog-controls hidden>
    <label class="search-field" for="catalog-search">Search ${e(label.toLowerCase())}<input id="catalog-search" type="search" placeholder="Search by title or topic" autocomplete="off" data-catalog-search></label>
    <div class="filter-group" role="group" aria-label="Filter ${e(label.toLowerCase())}">
      ${['All', ...new Set(values)].map(value => `<button class="filter-button" type="button" data-filter="${e(value === 'All' ? '' : value)}" aria-pressed="${value === 'All'}">${e(value)}</button>`).join('')}
    </div>
  </div>`;
}

export function contactCallout(site) {
  return `<section class="contact-callout section-border"><div class="container"><h2>Need a custom solution?</h2><a class="button button-solid" href="${e(pathFor(site, 'contact/'))}">Contact me</a></div></section>`;
}
