import { escapeHtml as e, pathFor } from '../helpers.mjs';
import { breadcrumb, tags, projectCard, catalogControls, contactCallout } from '../components.mjs';

export function projectsPage(site, projects, project) {
  if (project) {
    const href = project.url || pathFor(site, `contact/?project=${encodeURIComponent(project.title)}`);
    return {
      title: project.title, description: project.description, path: `projects/${project.id}/`, active: 'projects', styles: ['catalog'],
      content: `<div class="page">${breadcrumb(site, [['Projects', 'projects/'], [project.title]])}
        <article class="project-detail two-column">
          <div><div class="image-frame project-cover"><img src="${e(pathFor(site, project.image))}" alt="${e(project.title)} cover" width="600" height="600"></div>
            <div class="project-gallery">${['Architecture', 'Interface'].map(label => `<figure><div class="image-frame"><img src="${e(pathFor(site, 'assets/images/blueprint.svg'))}" alt="Abstract blueprint illustration" width="600" height="600" loading="lazy"></div><figcaption>${e(label)} illustration</figcaption></figure>`).join('')}</div>
          </div>
          <div><p class="eyebrow">${e(project.category)}</p><h1>${e(project.title)}</h1><p>${e(project.description)}</p>
            <section class="panel"><h2>About the project</h2><p>${e(project.body)}</p></section>
            ${tags(project.tags)}
            <dl class="metrics">${project.metrics.map(([label, value]) => `<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl>
            <div class="button-row"><a class="button button-solid" href="${e(href)}"${project.url ? ' rel="noopener noreferrer"' : ''}>${project.url ? 'View project' : 'Ask about this project'}</a><a class="button button-outline" href="${e(pathFor(site, 'projects/'))}">All projects</a></div>
          </div>
        </article>
      </div>${contactCallout(site)}`,
    };
  }
  return {
    title: 'Projects', active: 'projects', path: 'projects/', styles: ['catalog'], scripts: ['filters'],
    content: `<div class="page">${breadcrumb(site, [['Projects']])}<header class="page-heading"><p class="eyebrow">Selected work</p><h1>Projects</h1><p class="lead">Open-source tools, product design, and automation for real-world problems.</p></header>
      <section data-catalog data-filter-param="category" data-item-label="projects" aria-label="Project directory">
        ${catalogControls('Projects', projects.map(project => project.category))}
        <p class="catalog-status" data-catalog-status role="status" aria-live="polite">${projects.length} projects</p>
        <div class="card-grid">${projects.map(project => projectCard(site, project)).join('')}</div>
        <p class="notice" data-catalog-empty hidden>No projects match. Try another search or choose All.</p>
      </section>
    </div>${contactCallout(site)}`,
  };
}
