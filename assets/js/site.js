// Mobile nav
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
}

// Chip filters + search (News, Publications)
document.querySelectorAll('.filters').forEach((bar) => {
  const items = [...document.querySelectorAll(bar.dataset.filterTarget)];
  const chips = [...bar.querySelectorAll('.chip')];
  const search = bar.querySelector('.search');
  let tag = 'all';

  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    let shown = 0;
    items.forEach((el) => {
      const ok = (tag === 'all' || el.dataset.tag === tag) &&
        (!q || el.textContent.toLowerCase().includes(q));
      el.hidden = !ok;
      if (ok) shown++;
    });
    // Hide empty publication groups / news years
    document.querySelectorAll('.pub-group').forEach((g) => {
      g.hidden = !g.querySelector('.pub:not([hidden])');
    });
    document.querySelectorAll('h2.year').forEach((h) => {
      const list = h.nextElementSibling;
      h.hidden = list && !list.querySelector('.news-item:not([hidden])');
    });
    const empty = document.querySelector('.empty');
    if (empty) empty.hidden = shown > 0;
  };

  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-pressed', x === c));
    tag = c.dataset.filter;
    apply();
  }));
  search?.addEventListener('input', apply);
});

// Lab Life: highlight current section in the table of contents
const tocLinks = [...document.querySelectorAll('.toc a')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const targets = tocLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-80px 0px -70% 0px' });
  targets.forEach((t) => io.observe(t));
}
