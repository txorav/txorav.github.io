import { escapeHtml as e, pathFor } from '../helpers.mjs';
import { breadcrumb, contactCallout } from '../components.mjs';
import { workflow } from '../../data/services.mjs';

function serviceCard(site, service) {
  return `<article class="service-card panel"><div class="image-frame service-visual"><img src="${e(pathFor(site, 'assets/images/blueprint.svg'))}" alt="" width="600" height="600" loading="lazy" decoding="async"></div><h2>${e(service.name)}</h2><p>${e(service.summary)}</p><a class="button button-outline" href="${e(pathFor(site, `services/${service.id}/`))}">Explore service<span class="sr-only">: ${e(service.name)}</span></a></article>`;
}

function workflowSection() {
  return `<section class="workflow"><h2 class="section-heading">How I work</h2><div class="workflow-grid">${workflow.map(([title, summary], index) => `<article class="panel"><p class="eyebrow">Step ${String(index + 1).padStart(2, '0')}</p><h3>${e(title)}</h3><p>${e(summary)}</p></article>`).join('')}</div></section>`;
}

export function servicesPage(site, services, service) {
  const path = service ? `services/${service.id}/` : 'services/';
  const crumbs = service ? [['Services', 'services/'], [service.name]] : [['Services']];
  return {
    title: service ? service.name : 'Services & Solutions',
    description: service ? service.summary : 'Explore TXO R services: design, marketing, automation, integrations, and software development.',
    active: 'services', path, styles: ['catalog'],
    content: `<div class="page">${breadcrumb(site, crumbs)}
      ${service ? `<nav class="filter-group service-switcher" aria-label="Specialties">${services.map(item => `<a class="button button-outline" href="${e(pathFor(site, `services/${item.id}/`))}"${item.id === service.id ? ' aria-current="page"' : ''}>${e(item.name)}</a>`).join('')}</nav>
      <section class="service-detail panel"><div class="service-detail-copy">
        <p class="eyebrow">TXO R specialty</p><h1>${e(service.name)}</h1><p>${e(service.summary)}</p>
        <h2>What you get</h2><ul class="deliverables">${service.deliverables.map(item => `<li>${e(item)}</li>`).join('')}</ul>
        <p class="eyebrow">Starting tier</p><p>${e(service.price)}</p>
        <div class="button-row"><a class="button button-solid" href="${e(pathFor(site, `contact/?service=${encodeURIComponent(service.id)}`))}">Discuss this service</a><a class="button button-outline" href="${e(pathFor(site, 'projects/'))}">See projects</a></div>
      </div><div class="image-frame"><img src="${e(pathFor(site, 'assets/images/blueprint.svg'))}" alt="Abstract engineering blueprint" width="600" height="600"></div></section>` : `<header class="page-heading"><p class="eyebrow">Design, build, and grow</p><h1>Services & solutions</h1><p class="lead">From a visual identity to a complete software product, find the expertise your business needs.</p></header><div class="card-grid">${services.map(item => serviceCard(site, item)).join('')}</div>`}
      ${workflowSection()}
      ${service ? `<p><a class="text-link" href="${e(pathFor(site, 'services/'))}">← Explore all services</a></p>` : ''}
    </div>${contactCallout(site)}`,
  };
}
