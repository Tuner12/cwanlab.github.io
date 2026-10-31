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
    document.querySelectorAll('.year-head + .news').forEach((list) => {
      list.previousElementSibling.hidden = !list.querySelector('.news-item:not([hidden])');
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

// Logo: like the IDL mark, a touch makes the cells burst outward from the centre
// and spring straight back; a faint ghost copy stays put underneath.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.logo-cw').forEach((svg) => {
  const [, , w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
  const dots = [...svg.querySelectorAll('circle.d')].map((el) => ({
    el, x: +el.getAttribute('cx') - w / 2, y: +el.getAttribute('cy') - h / 2, dx: 0, dy: 0,
  }));
  const RISE = 60, FALL = 320;
  let start = 0, frame = 0, last = 0;

  const step = (now) => {
    const t = now - start;
    // quick ease-out to the peak, then an ease-out-cubic return
    const k = t < RISE ? 1 - (1 - t / RISE) ** 2 : Math.max(0, 1 - (t - RISE) / FALL) ** 3;
    dots.forEach((d) => d.el.setAttribute('transform', k ? `translate(${(d.dx * k).toFixed(2)} ${(d.dy * k).toFixed(2)})` : ''));
    frame = t < RISE + FALL ? requestAnimationFrame(step) : 0;
  };

  const burst = () => {
    const now = performance.now();
    if (still || now - last < 280) return;
    last = now;
    dots.forEach((d) => {
      const s = 0.15 + Math.random() * 0.45;          // push 1.15–1.6x out from the centre
      d.dx = d.x * s + (Math.random() - 0.5) * 10;    // plus a little jitter
      d.dy = d.y * s * 1.6 + (Math.random() - 0.5) * 10;
    });
    start = now;
    if (!frame) frame = requestAnimationFrame(step);
  };

  const host = svg.closest('a') || svg;
  host.addEventListener('pointerenter', burst);
  host.addEventListener('pointermove', burst);
});
