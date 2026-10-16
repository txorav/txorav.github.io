import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import siteConfig from '../src/data/site.mjs';
import { routes } from '../src/data/routes.mjs';
import { services } from '../src/data/services.mjs';
import { projects } from '../src/data/projects.mjs';
import { layout } from '../src/templates/layout.mjs';
import { escapeHtml as e, pathFor, absoluteFor } from '../src/templates/helpers.mjs';
import { homePage } from '../src/templates/pages/home.mjs';
import { servicesPage } from '../src/templates/pages/services.mjs';
import { projectsPage } from '../src/templates/pages/projects.mjs';
import { contactPage } from '../src/templates/pages/contact.mjs';
import { blogPage, articlePage } from '../src/templates/pages/blog.mjs';
import { loadPosts } from './posts.mjs';
import { createRss } from './rss.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const manifestPath = join(output, '.generated-files.json');
const url = new URL(process.env.SITE_URL || siteConfig.url);
if (!['http:', 'https:'].includes(url.protocol) || url.search || url.hash || url.username || url.password) {
  throw new Error('The site URL must be an HTTP(S) URL without credentials, a query, or a fragment.');
}
if (!url.pathname.endsWith('/')) url.pathname += '/';
const email = (process.env.CONTACT_EMAIL ?? siteConfig.email).trim();
if (email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) throw new Error('Configure a valid contact email address.');
const site = { ...siteConfig, url: url.href, basePath: url.pathname, email };

for (const [name, items] of [['services', services], ['projects', projects]]) {
  const ids = new Set();
  for (const item of items) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || ids.has(item.id)) throw new Error(`Invalid or duplicate ${name} id: ${item.id}`);
    ids.add(item.id);
  }
}
for (const project of projects) {
  if (project.url && !['http:', 'https:'].includes(new URL(project.url).protocol)) throw new Error(`Project ${project.id}: use a public HTTP(S) URL.`);
}

const posts = await loadPosts(join(root, 'src/content/posts'));
const pages = [
  homePage(site, services, projects, posts),
  servicesPage(site, services), ...services.map(service => servicesPage(site, services, service)),
  projectsPage(site, projects), ...projects.map(project => projectsPage(site, projects, project)),
  contactPage(site, services), blogPage(site, posts), ...posts.map(post => articlePage(site, post, posts)),
];
let previous = [];
try {
  previous = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!Array.isArray(previous) || previous.some(path => typeof path !== 'string' || path.startsWith('/') || path.includes('..') || path.includes('\\'))) {
    throw new Error('The generated file manifest is invalid.');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const generated = new Set();
async function emit(path, content) {
  const target = join(output, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
  generated.add(path);
}

for (const page of pages) {
  await emit(`${page.path || ''}index.html`, layout({ site, ...page }));
}
await emit(routes.rss, createRss(site, posts));
await emit('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${e(absoluteFor(site, page.path || ''))}</loc>${page.article ? `<lastmod>${page.article.date}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`);
await emit('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${absoluteFor(site, 'sitemap.xml')}\n`);
await emit('404.html', layout({
  site, title: 'Page not found',
  content: `<div class="page"><h1>Page not found</h1><p>This page may have moved or no longer exists.</p><a class="button button-outline" href="${e(pathFor(site))}">Back to home</a></div>`,
}));

const assets = join(root, 'src/assets');
await cp(assets, join(output, 'assets'), { recursive: true });
async function trackAssets(directory, prefix) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) await trackAssets(join(directory, entry.name), `${prefix}${entry.name}/`);
    else generated.add(`${prefix}${entry.name}`);
  }
}
await trackAssets(assets, 'assets/');
// Remove only files produced by a previous build, including unpublished articles.
for (const path of previous) {
  if (!generated.has(path)) await rm(join(output, path), { force: true });
}
await writeFile(manifestPath, `${JSON.stringify([...generated].sort(), null, 2)}\n`);
console.log(`Generated ${pages.length} pages and RSS in dist/.`);
if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) console.warn('Before publishing, set the public URL in src/data/site.mjs so RSS and canonical links use your domain.');
if (!email) console.warn('No contact address configured: contact remains a local draft/copy/download form.');
