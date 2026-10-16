import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadPosts(directory) {
  const entries = (await readdir(directory)).filter(file => file.endsWith('.json')).sort();
  const posts = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const file of entries) {
    const slug = file.slice(0, -5);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid article filename: ${file}`);
    const meta = JSON.parse(await readFile(join(directory, file), 'utf8'));
    for (const key of ['title', 'description', 'date']) {
      if (typeof meta[key] !== 'string' || !meta[key].trim()) throw new Error(`${file}: ${key} must be a nonempty string.`);
    }
    const timestamp = new Date(`${meta.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || Number.isNaN(timestamp.getTime()) || timestamp.toISOString().slice(0, 10) !== meta.date) {
      throw new Error(`${file}: date must be a valid YYYY-MM-DD date.`);
    }
    if (meta.draft !== undefined && typeof meta.draft !== 'boolean') throw new Error(`${file}: draft must be true or false.`);
    if (meta.tags !== undefined && (!Array.isArray(meta.tags) || meta.tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag === 'All'))) {
      throw new Error(`${file}: tags must be nonempty strings; "All" is reserved for the filter.`);
    }
    const content = await readFile(join(directory, `${slug}.html`), 'utf8');
    if (!content.trim()) throw new Error(`${slug}.html: article content is empty.`);
    if (meta.draft || meta.date > today) continue;
    const words = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    posts.push({
      slug, title: meta.title.trim(), description: meta.description.trim(), date: meta.date,
      tags: [...new Set((meta.tags || []).map(tag => tag.trim()))], content,
      readingMinutes: Math.max(1, Math.ceil(words / 200)),
    });
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
