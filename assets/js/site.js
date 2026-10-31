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

// Logo: modelled on the idl.uw.edu mark. Touching a letter cell pushes every cell
// away from the cursor (nearer cells fly further), then they ease straight back.
// A faint ghost copy stays in place underneath.
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.logo-cw').forEach((svg) => {
  const dots = [...svg.querySelectorAll('circle.d')].map((el) => ({
    el, x: +el.getAttribute('cx'), y: +el.getAttribute('cy'), dx: 0, dy: 0,
  }));
  const RISE = 45, FALL = 280;          // ms, measured on the IDL logo
  const HIT = 6;                        // how close (in grid units) counts as touching a cell
  let start = -1e9, frame = 0, onCell = false;

  const local = (e) => new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
  const nearest = (p) => Math.min(...dots.map((d) => Math.hypot(d.x - p.x, d.y - p.y)));

  const step = (now) => {
    const t = now - start;
    const k = t < RISE ? 1 - (1 - t / RISE) ** 2          // ease out to the peak
      : Math.max(0, 1 - (t - RISE) / FALL) ** 2;          // quadratic ease-out home
    dots.forEach((d) => d.el.setAttribute('transform', k > 0.001 ? `translate(${(d.dx * k).toFixed(2)} ${(d.dy * k).toFixed(2)})` : ''));
    frame = t < RISE + FALL ? requestAnimationFrame(step) : 0;
  };

  const burst = (p) => {
    const now = performance.now();
    if (still || now - start < RISE + FALL) return;
    dots.forEach((d) => {
      let vx = d.x - p.x, vy = d.y - p.y;
      const dist = Math.hypot(vx, vy);
      if (dist < 1) { const a = Math.random() * Math.PI * 2; vx = Math.cos(a); vy = Math.sin(a); }
      else { vx /= dist; vy /= dist; }
      const push = 37 / (1 + dist / 30) * (0.8 + Math.random() * 0.4);
      d.dx = vx * push + (Math.random() - 0.5) * 3;
      d.dy = vy * push + (Math.random() - 0.5) * 3;
    });
    start = now;
    if (!frame) frame = requestAnimationFrame(step);
  };

  const host = svg.closest('a') || svg;
  host.addEventListener('pointermove', (e) => {
    const p = local(e);
    const hit = nearest(p) < HIT;
    if (hit && !onCell) burst(p);       // like IDL: fires on entering a cell
    onCell = hit;
  });
  host.addEventListener('pointerleave', () => { onCell = false; });
  host.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') burst(local(e)); });
});
