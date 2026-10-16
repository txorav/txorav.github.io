for (const catalog of document.querySelectorAll('[data-catalog]')) {
  const controls = catalog.querySelector('[data-catalog-controls]');
  const input = catalog.querySelector('[data-catalog-search]');
  const buttons = [...catalog.querySelectorAll('[data-filter]')];
  const items = [...catalog.querySelectorAll('[data-catalog-item]')].map(element => ({
    element,
    search: element.dataset.search.toLocaleLowerCase(),
    values: JSON.parse(element.dataset.filterValues),
  }));
  const status = catalog.querySelector('[data-catalog-status]');
  const empty = catalog.querySelector('[data-catalog-empty]');
  const parameter = catalog.dataset.filterParam;
  const params = new URLSearchParams(window.location.search);
  let selected = params.get(parameter) || '';
  if (!buttons.some(button => button.dataset.filter === selected)) selected = '';
  input.value = params.get('q') || '';
  controls.hidden = false;

  function apply(updateUrl = true) {
    const query = input.value.trim().toLocaleLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const item of items) {
      const matches = (!selected || item.values.includes(selected)) && terms.every(term => item.search.includes(term));
      item.element.hidden = !matches;
      if (matches) visible += 1;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === selected));
    status.textContent = `${visible} of ${items.length} ${catalog.dataset.itemLabel}`;
    empty.hidden = visible !== 0 || items.length === 0;
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (query) url.searchParams.set('q', input.value.trim());
      else url.searchParams.delete('q');
      if (selected) url.searchParams.set(parameter, selected);
      else url.searchParams.delete(parameter);
      window.history.replaceState(null, '', url);
    }
  }

  input.addEventListener('input', () => apply());
  for (const button of buttons) {
    button.addEventListener('click', () => {
      selected = button.dataset.filter;
      apply();
    });
  }
  window.addEventListener('popstate', () => {
    const current = new URLSearchParams(window.location.search);
    selected = current.get(parameter) || '';
    if (!buttons.some(button => button.dataset.filter === selected)) selected = '';
    input.value = current.get('q') || '';
    apply(false);
  });
  apply(false);
}
