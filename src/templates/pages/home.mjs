import { escapeHtml as e, pathFor } from '../helpers.mjs';
import { projectCard, postCard, contactCallout } from '../components.mjs';

export function homePage(site, services, projects, posts) {
  return {
    title: 'Developer & Scientist Portfolio', active: 'home', styles: ['home', 'blog'],
    content: `<section id="about" class="hero"><div class="container hero-grid">
      <div class="hero-copy">
        <p class="hero-intro">Hey, I am</p><h1>TXO R</h1>
        <p>Hello, my name is Mohammed. You can call me TXO R. I am a developer and scientist from Algeria.</p>
        <p>I build high-quality, beautiful products that help businesses grow, combining development, marketing, graphic and UI/UX design, and automation.</p>
        <div class="button-row"><a class="button button-solid" href="${e(pathFor(site, 'contact/'))}">Hire me</a><a class="button button-outline" href="${e(pathFor(site, 'projects/'))}">Learn more</a></div>
      </div>
      <div class="hero-portrait"><img src="${e(pathFor(site, 'assets/images/portrait.svg'))}" alt="TXO R robot portrait with glowing purple eyes and a chest badge" width="700" height="700" fetchpriority="high"></div>
    </div></section>
    <section class="home-services"><div class="container">
      <div class="section-heading"><h2>What I do</h2><p>Explore my specialties and find the right service for your next product or business challenge.</p></div>
      <div class="service-links">${services.map(service => `<a class="button button-outline" data-service="${e(service.id)}" href="${e(pathFor(site, `services/${service.id}/`))}">${e(service.name)}</a>`).join('')}</div>
    </div></section>
    <section class="home-projects section-border"><div class="container">
      <div class="section-heading"><h2>Projects</h2><a class="text-link" href="${e(pathFor(site, 'projects/'))}">Explore all projects →</a></div>
      <div class="card-grid">${projects.slice(0, 3).map(project => projectCard(site, project)).join('')}</div>
    </div></section>
    ${posts.length ? `<section class="home-blog section-border"><div class="container"><div class="section-heading"><h2>From the blog</h2><a class="text-link" href="${e(pathFor(site, 'blog/'))}">All articles →</a></div><div class="post-list">${postCard(site, posts[0])}</div></div></section>` : ''}
    ${contactCallout(site)}`,
  };
}
