import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import siteConfig from '../src/data/site.mjs';
import { routes } from '../src/data/routes.mjs';
import './build.mjs';

const root = await realpath(fileURLToPath(new URL('../dist/', import.meta.url)));
const siteUrl = new URL(process.env.SITE_URL || siteConfig.url);
const basePath = siteUrl.pathname.endsWith('/') ? siteUrl.pathname : `${siteUrl.pathname}/`;
const port = Number(process.env.PORT || 8000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.avif': 'image/avif',
};
const insideRoot = path => path === root || path.startsWith(`${root}${sep}`);

const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (status, body, type = 'text/plain; charset=utf-8') => {
    response.writeHead(status, { 'Content-Type': type });
    response.end(request.method === 'HEAD' ? undefined : body);
  };
  const redirect = location => {
    response.writeHead(308, { Location: location });
    response.end();
  };
  const notFound = async () => send(404, await readFile(join(root, '404.html')), types['.html']);

  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      send(405, 'Method not allowed.');
      return;
    }
    const url = new URL(request.url, 'http://localhost');
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      send(400, 'Invalid URL encoding.');
      return;
    }
    if (pathname.includes('\0') || pathname.includes('\\')) {
      send(400, 'Invalid path.');
      return;
    }
    if (basePath !== '/' && pathname === basePath.slice(0, -1)) {
      redirect(`${basePath}${url.search}`);
      return;
    }
    if (!pathname.startsWith(basePath)) {
      await notFound();
      return;
    }
    const relative = pathname.slice(basePath.length);
    let file = resolve(root, relative);
    if (!insideRoot(file) || relative.split('/').some(segment => segment.startsWith('.'))) {
      await notFound();
      return;
    }
    const info = await stat(file);
    if (info.isDirectory()) {
      if (!pathname.endsWith('/')) {
        redirect(`${url.pathname}/${url.search}`);
        return;
      }
      file = join(file, 'index.html');
    }
    file = await realpath(file);
    if (!insideRoot(file)) {
      await notFound();
      return;
    }
    const type = file === join(root, routes.rss)
      ? 'application/rss+xml; charset=utf-8'
      : types[extname(file).toLowerCase()] || 'application/octet-stream';
    send(200, await readFile(file), type);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) {
      await notFound();
    } else {
      console.error(error);
      if (!response.headersSent) send(500, 'Unable to serve this page.');
      else response.end();
    }
  }
});

server.on('error', error => {
  console.error(`Unable to start the local server: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Serving the site at http://localhost:${port}${basePath}`);
  console.log('Press Ctrl+C to stop. Restart after editing source files to regenerate the site.');
});
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
