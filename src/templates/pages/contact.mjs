import { escapeHtml as e, pathFor } from '../helpers.mjs';
import { breadcrumb } from '../components.mjs';

export function contactPage(site, services) {
  return {
    title: 'Contact', active: 'contact', path: 'contact/', styles: ['contact'], scripts: ['contact'],
    content: `<div class="page">${breadcrumb(site, [['Contact']])}<header class="page-heading"><p class="eyebrow">Work with TXO R</p><h1>Let’s build something useful.</h1><p class="lead">Tell me what you want to make, the problem it solves, and the outcome you need.</p></header>
      <div class="contact-layout"><section><h2>Start a conversation</h2><p>I work across development, design, marketing, integrations, and automation.</p>
        ${site.email ? `<p>Email: <a href="mailto:${e(site.email)}">${e(site.email)}</a></p>` : '<p class="notice">A contact address has not been configured yet. You can still prepare, copy, or download your project brief below.</p>'}
        <p class="form-note">This is a static website. The form prepares an inquiry locally; it does not send messages or store your personal information. ${site.email ? 'Sending is handled by your email app.' : ''}</p>
        <p><a class="text-link" href="${e(pathFor(site, 'services/'))}">Explore services →</a></p>
      </section><div>
        <form id="contact-form" class="contact-form panel" data-email="${e(site.email)}" hidden>
          <label for="contact-name">Name or company<input id="contact-name" name="name" autocomplete="name" maxlength="120" required></label>
          <label for="contact-email">Your email<input id="contact-email" name="email" type="email" autocomplete="email" maxlength="254" required></label>
          <label for="contact-service">Service<select id="contact-service" name="service"><option value="custom">Custom solution</option>${services.map(service => `<option value="${e(service.id)}">${e(service.name)}</option>`).join('')}</select></label>
          <label for="contact-brief">Project brief<textarea id="contact-brief" name="brief" rows="6" maxlength="5000" placeholder="Goals, requirements, budget, and timeline…" required></textarea></label>
          <div class="button-row"><button class="button button-solid" type="submit">${site.email ? 'Prepare email' : 'Create draft'}</button><button class="button button-outline" type="button" data-copy>Copy brief</button><button class="button button-outline" type="button" data-download>Download brief</button></div>
        </form>
        <noscript><p class="notice">Enable JavaScript to prepare a project brief${site.email ? ', or use the email link to contact me directly' : ''}.</p></noscript>
        <p id="form-status" class="form-status" role="status" aria-live="polite"></p>
        <section id="inquiry-draft" class="inquiry-draft" hidden><h2>Your inquiry draft</h2><label for="inquiry-output">You can copy this text<textarea id="inquiry-output" rows="12" readonly></textarea></label><a id="email-draft-link" class="button button-solid" hidden>Open email app</a></section>
      </div></div>
    </div>`,
  };
}
