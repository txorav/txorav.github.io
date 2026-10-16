const blog = 'blog/';

export const routes = Object.freeze({
  home: '',
  about: '#about',
  services: 'services/',
  projects: 'projects/',
  contact: 'contact/',
  blog,
  rss: 'rss.xml',
  article: slug => `${blog}${encodeURIComponent(slug)}/`,
  blogTag: tag => `${blog}?tag=${encodeURIComponent(tag)}`,
});
