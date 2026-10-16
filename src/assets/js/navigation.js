const header = document.querySelector('.site-header');
const toggle = header?.querySelector('.nav-toggle');
const navigation = document.getElementById('site-navigation');
const mobile = window.matchMedia('(max-width: 760px)');

if (header && toggle && navigation) {
  header.dataset.navigationEnhanced = 'true';

  function setOpen(open, preserveFocus = true) {
    const expanded = !mobile.matches || open;
    if (!expanded && preserveFocus && navigation.contains(document.activeElement)) {
      toggle.focus({ preventScroll: true });
    }
    navigation.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  }

  function updateLayout() {
    const focused = document.activeElement;
    toggle.hidden = !mobile.matches;
    setOpen(!mobile.matches);
    if (!mobile.matches && focused === toggle) {
      (navigation.querySelector('[aria-current="page"]') || navigation.querySelector('a'))?.focus();
    }
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  navigation.addEventListener('click', event => {
    if (mobile.matches && event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && !navigation.hidden) {
      setOpen(false);
      toggle.focus({ preventScroll: true });
    }
  });
  document.addEventListener('click', event => {
    if (mobile.matches && !navigation.hidden && !header.contains(event.target)) setOpen(false);
  });
  header.addEventListener('focusout', event => {
    if (mobile.matches && event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false, false);
  });
  mobile.addEventListener('change', updateLayout);
  window.addEventListener('pageshow', updateLayout);
  updateLayout();
}
