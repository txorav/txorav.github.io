const form = document.getElementById('contact-form');

if (form) {
  const status = document.getElementById('form-status');
  const output = document.getElementById('inquiry-output');
  const draft = document.getElementById('inquiry-draft');
  const emailLink = document.getElementById('email-draft-link');
  const params = new URLSearchParams(window.location.search);
  const service = form.elements.namedItem('service');
  const requestedService = params.get('service');
  if ([...service.options].some(option => option.value === requestedService)) service.value = requestedService;
  if (params.get('project')) form.elements.namedItem('brief').value = `I would like to learn more about ${params.get('project')}.`;
  form.hidden = false;

  function prepare() {
    if (!form.reportValidity()) return null;
    const data = new FormData(form);
    const specialty = service.selectedOptions[0].textContent;
    const subject = `Project inquiry: ${specialty}`;
    const body = [
      'Hello Mohammed,', '',
      `Name / company: ${String(data.get('name')).trim()}`,
      `Reply email: ${String(data.get('email')).trim()}`,
      `Service: ${specialty}`, '',
      String(data.get('brief')).trim(),
    ].join('\n');
    output.value = body;
    draft.hidden = false;
    if (form.dataset.email) {
      emailLink.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      emailLink.hidden = false;
    }
    return body;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (prepare()) {
      status.textContent = form.dataset.email
        ? 'Draft prepared. Use “Open email app” to review and send it. Nothing has been sent by this website.'
        : 'Draft prepared. Nothing has been sent. Copy or download the brief below.';
      output.focus();
    }
  });

  form.querySelector('[data-copy]').addEventListener('click', async () => {
    const body = prepare();
    if (!body) return;
    try {
      await navigator.clipboard.writeText(body);
      status.textContent = 'Brief copied. Nothing has been sent.';
    } catch {
      output.focus();
      output.select();
      status.textContent = 'Clipboard access is unavailable. Copy the selected draft text manually.';
    }
  });

  form.querySelector('[data-download]').addEventListener('click', () => {
    const body = prepare();
    if (!body) return;
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'txor-project-brief.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Brief downloaded. Nothing has been sent.';
  });
}
