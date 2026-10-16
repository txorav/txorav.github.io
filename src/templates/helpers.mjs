export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

export function pathFor(site, path = '') {
  return site.basePath + path.replace(/^\/+/, '');
}

export function absoluteFor(site, path = '') {
  return new URL(path.replace(/^\/+/, ''), site.url).href;
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
