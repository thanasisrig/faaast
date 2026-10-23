// Why fast: topic filter on the blog page, and a reading-progress row of hour
// blocks on articles (16 blocks, like a 16:8 fast, filling as you read).
(() => {
  const chips = document.querySelectorAll('.wf-chip');
  const cards = document.querySelectorAll('#wfGrid .wf-card');
  const empty = document.querySelector('.wf-empty');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => { const on = c === chip; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    let shown = 0;
    cards.forEach((card) => { const show = f === 'all' || card.dataset.cat === f; card.hidden = !show; shown += show; });
    if (empty) empty.hidden = shown > 0;
  }));

  const bar = document.querySelector('.wf-progress');
  const body = document.querySelector('.wf-body');
  if (!bar || !body) return;
  const blocks = [...bar.children];
  const update = () => {
    const r = body.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height)) * blocks.length;
    blocks.forEach((b, i) => b.style.setProperty('--f', `${Math.min(1, Math.max(0, p - i)) * 100}%`));
    bar.classList.toggle('on', r.top < innerHeight * 0.5);
  };
  addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  addEventListener('resize', update);
  update();
})();
