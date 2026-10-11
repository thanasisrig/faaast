// Faaast website: draws the app's screens in HTML and drives them from the scroll.
(() => {
  // Set this once the App Store listing is live; every [data-store] link points to it.
  const APP_STORE_URL = '';

  const GOAL = 16;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (v, a, b, c, d) => lerp(c, d, clamp((v - a) / (b - a)));
  const pad = (n) => String(n).padStart(2, '0');

  const hms = (sec) => {
    sec = Math.max(0, Math.floor(sec));
    return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map(pad);
  };
  const hm = (min) => {
    min = Math.max(0, Math.floor(min));
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  const STAGES = [
    { n: 'Fed', e: '🍽️', to: 4 },
    { n: 'Early fasting', e: '📉', to: 12 },
    { n: 'Fat burning', e: '🔥', to: 18 },
    { n: 'Ketones rising', e: '📈', to: 24 },
    { n: 'Ketosis', e: '⚡️', to: Infinity },
  ];
  const stageAt = (h) => STAGES.find((s) => h < s.to);

  if (APP_STORE_URL) $$('[data-store]').forEach((a) => { a.href = APP_STORE_URL; });

  // ---------- Templates ----------
  const ICON = {
    fast: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6.5V12l3.5 2.2" stroke="#F5F5F5" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
    tracking: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="11" width="3" height="9" rx="1"/><rect x="10.5" y="5" width="3" height="15" rx="1"/><rect x="17" y="8" width="3" height="12" rx="1"/></svg>',
    me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke-linecap="round"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke-linecap="round"/></svg>',
  };
  const PENCIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>';
  const statusBar = `<div class="sb"><span>9:41</span><svg viewBox="0 0 74 13" fill="currentColor"><rect x="0" y="8" width="3.4" height="5" rx="1"/><rect x="5" y="5.5" width="3.4" height="7.5" rx="1"/><rect x="10" y="3" width="3.4" height="10" rx="1"/><rect x="15" y="0" width="3.4" height="13" rx="1"/><path d="M31 3.2c2.5 0 4.8 1 6.5 2.6l1.2-1.2A10.8 10.8 0 0 0 31 1.4a10.8 10.8 0 0 0-7.7 3.2l1.2 1.2A9 9 0 0 1 31 3.2zm0 3.5c1.5 0 2.9.6 4 1.6l1.2-1.2a7.5 7.5 0 0 0-10.4 0L27 8.3c1.1-1 2.5-1.6 4-1.6zm0 3.4c-.7 0-1.3.3-1.8.7L31 12.6l1.8-1.8c-.5-.4-1.1-.7-1.8-.7z"/><rect x="45" y="1" width="25" height="11.5" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="47" y="3" width="19" height="7.5" rx="2"/><rect x="71" y="4.5" width="1.6" height="4.5" rx=".8" opacity=".4"/></svg></div>`;
  const tabbar = (on) => `<div class="tabbar">${[['fast', 'Fast'], ['tracking', 'Tracking'], ['me', 'Me'], ['settings', 'Settings']].map(([k, l]) => `<div class="tab${k === on ? ' on' : ''}">${ICON[k]}${l}</div>`).join('')}</div>`;

  const blocksTimer = () => `
    <div class="a-label" data-label>ELAPSED</div>
    <div class="a-time" data-time>00:00:00</div>
    <div class="blocks" data-blocks>${'<div class="blk"></div>'.repeat(GOAL)}</div>
    <div class="blocks" data-flames style="margin-top:7px;display:none">${'<div class="blk flame">🔥</div>'.repeat(8)}</div>
    <div class="a-cap" data-cap></div>`;

  const homeScreen = (timerInner) => `
    <div class="app">
      ${statusBar}
      <div class="a-day" data-day></div><div class="a-date" data-date></div>
      <div class="a-timer">${timerInner}</div>
      <div class="chips">
        <span class="chip chip-stage" data-stage></span>
        <span class="chip">💧 <span data-water>0</span> <span class="plus">+</span></span>
        <span class="chip">⚡️ <span data-elec>0</span> <span class="plus">+</span></span>
      </div>
      <div class="a-card a-card-run">
        <div class="row"><div><small>STARTED</small><div class="v" data-start></div></div>${PENCIL}</div>
        <div class="row"><div><small>ENDS</small><div class="v" data-end></div></div>${PENCIL}</div>
      </div>
      <div class="a-card a-card-idle">
        <div class="row"><div><small>FAST TYPE</small><div class="v">16:8<span>16 hours fasting</span></div></div><span style="color:var(--muted);font-size:22px">›</span></div>
        <div class="row"><div><small>START NOW, EAT AGAIN AT</small><div class="v" data-ifend></div></div></div>
      </div>
      <div class="a-btn" data-btn>End fast</div>
      ${tabbar('fast')}
      <div class="toast" data-toast><span class="ok">✓</span><div><b>Fast saved · 19h 36m</b><span>Goal reached. It’s on your calendar.</span></div></div>
    </div>`;

  const gaugeSVG = () => {
    const cx = 160, cy = 160, r = 128;
    const pt = (deg, rad) => [cx + rad * Math.cos((deg * Math.PI) / 180), cy - rad * Math.sin((deg * Math.PI) / 180)];
    const [sx, sy] = pt(210, r), [ex, ey] = pt(-30, r);
    const arc = `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
    let ticks = '';
    for (let i = 0; i <= GOAL; i++) {
      const deg = 210 - (240 * i) / GOAL, major = i % 4 === 0;
      const [x1, y1] = pt(deg, major ? 98 : 104), [x2, y2] = pt(deg, 110);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${major ? '#111' : '#C8C8C8'}" stroke-width="${major ? 3 : 2}" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="0 0 320 240"><path d="${arc}" fill="none" stroke="#E0E0E0" stroke-width="16" stroke-linecap="round"/><path data-garc d="${arc}" pathLength="100" fill="none" stroke="#111" stroke-width="16" stroke-linecap="round" stroke-dasharray="0 100"/>${ticks}</svg>`;
  };

  const stylesTimer = () => `
    <div class="ts on" data-ts="0">${blocksTimer()}</div>
    <div class="ts" data-ts="1">
      <div class="flip">
        <div class="flip-c"><div class="flip-d" data-fh>00</div><small>HRS</small></div><span class="flip-colon">:</span>
        <div class="flip-c"><div class="flip-d" data-fm>00</div><small>MIN</small></div><span class="flip-colon">:</span>
        <div class="flip-c"><div class="flip-d" data-fs>00</div><small>SEC</small></div>
      </div>
      <div class="bar"><i data-bar></i></div>
      <div class="a-cap" data-left></div>
    </div>
    <div class="ts" data-ts="2"><div class="gauge">${gaugeSVG()}<div class="g-time" data-gtime></div><div class="g-sub" data-gsub></div></div></div>
    <div class="ts" data-ts="3"><div class="disc">
      <div class="d-layer"><b data-dt></b><small data-ds></small></div>
      <div class="d-layer d-ink" data-dink><b data-dt></b><small data-ds></small></div>
    </div></div>
    <div class="ts" data-ts="4"><div class="board"><div class="bt"><span class="ghost">88:88:88</span><span class="fg" data-bt></span></div><div class="bs" data-bs></div></div></div>`;

  // A month of fasts for the Tracking screen. 0 = a missed day.
  const SEPT = [17, 16, 18, 17, 16, 20, 17, 18, 16, 17, 19, 17, 16, 18, 17, 16, 17, 20, 18, 17, 16, 17, 18, 16, 17, 18, 0, 0, 16, 17];
  const SEPT_OFFSET = 1; // 1 September 2026 is a Tuesday
  const trackingScreen = () => {
    let cells = '';
    for (let i = 0; i < SEPT_OFFSET; i++) cells += '<div></div>';
    SEPT.forEach((h, i) => { cells += `<div class="t-d" data-d="${i}">${i + 1}<small>${h ? h + 'h' : ''}</small></div>`; });
    return `
    <div class="app">
      ${statusBar}
      <div class="t-pill">Past months</div>
      <div class="t-title">Tracking</div>
      <div class="t-month"><i>‹</i><b>September 2026</b><i>›</i></div>
      <div class="t-stats" data-tstats></div>
      <div class="t-cal">
        <div class="t-wd"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
        <div class="t-grid">${cells}</div>
      </div>
      <div class="t-card">
        <small>YOU USUALLY START</small>
        <b>7:30 PM</b><span>give or take 5m</span>
        <div class="t-line"><i></i></div>
        <div class="t-axis"><span>12 PM</span><span>4 PM</span><span>8 PM</span><span>12 AM</span></div>
      </div>
      ${tabbar('tracking')}
    </div>`;
  };

  // ---------- Mount ----------
  const screens = {};
  $$('[data-app]').forEach((scr) => {
    const kind = scr.dataset.app;
    scr.innerHTML = kind === 'tracking' ? trackingScreen() : kind === 'styles' ? homeScreen(stylesTimer()) : homeScreen(blocksTimer());
    screens[kind] = scr.firstElementChild;
  });

  // Scale each 393-wide screen to its phone.
  const ro = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      const app = e.target.querySelector('.app');
      if (app) app.style.setProperty('--k', e.contentRect.width / 393);
    });
  });
  $$('[data-app]').forEach((s) => ro.observe(s));

  // ---------- Rendering ----------
  const timeFmt = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dayWord = (d, ref) => {
    const a = new Date(d), b = new Date(ref);
    a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0);
    const diff = Math.round((a - b) / 864e5);
    return diff === 0 ? 'Today' : diff === -1 ? 'Yesterday' : diff === 1 ? 'Tomorrow' : a.toLocaleDateString('en-GB', { weekday: 'short' });
  };

  function renderBlocks(root, hours, idle) {
    const [H, M, S] = hms(hours * 3600);
    const set = (sel, v, prop = 'textContent') => { const el = $(sel, root); if (el && el[prop] !== v) el[prop] = v; };
    set('[data-time]', idle ? '00:00:00' : `${H}:${M}:${S}`);
    set('[data-label]', idle ? 'READY WHEN YOU ARE' : hours >= GOAL ? 'GOAL REACHED' : 'ELAPSED');
    $$('[data-blocks] .blk', root).forEach((b, i) => b.style.setProperty('--f', `${idle ? 0 : clamp(hours - i) * 100}%`));
    const flames = $('[data-flames]', root);
    if (flames) {
      const extra = idle ? 0 : Math.max(0, hours - GOAL);
      flames.style.display = extra > 0 ? 'grid' : 'none';
      $$('.flame', flames).forEach((f, i) => f.classList.toggle('on', extra > i));
    }
    let cap;
    if (idle) cap = '<b>16:8</b> · 16 hours to go';
    else if (hours < GOAL) cap = `<b>${Math.floor(hours)}</b> of ${GOAL} hours · <b>${hm((GOAL - hours) * 60)}</b> to goal`;
    else cap = `🔥 <b>${hm((hours - GOAL) * 60)}</b> past your goal`;
    set('[data-cap]', cap, 'innerHTML');
  }

  function renderHome(app, s) {
    app.classList.toggle('idle', s.idle);
    renderBlocks(app, s.hours, s.idle);
    const st = stageAt(s.hours);
    const chip = $('[data-stage]', app);
    const txt = `${st.e} ${st.n} <span class="gt">›</span>`;
    if (chip.innerHTML !== txt) {
      chip.innerHTML = txt;
      if (!reduceMotion) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
    }
    $('[data-water]', app).textContent = s.idle ? 0 : Math.min(8, Math.floor(s.hours / 2.6));
    $('[data-elec]', app).textContent = s.idle ? 0 : Math.min(3, Math.floor(s.hours / 7));
    $('[data-start]', app).innerHTML = `${s.startDay}<span>${s.startTime}</span>`;
    $('[data-end]', app).innerHTML = `${s.endDay}<span>${s.endTime}</span>`;
    $('[data-ifend]', app).innerHTML = s.ifEnd;
    $('[data-btn]', app).textContent = s.idle ? 'Start fast' : 'End fast';
    $('[data-btn]', app).classList.toggle('press', !!s.press);
    $('[data-toast]', app).classList.toggle('on', !!s.toast);
  }

  function setDate(app, d) {
    $('[data-day]', app).textContent = d.toLocaleDateString('en-GB', { weekday: 'long' });
    $('[data-date]', app).textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }

  // ---------- Live clock (hero, timer styles, widget) ----------
  const now0 = Date.now();
  const liveStart = now0 - (13 * 3600 + 25 * 60 + 2) * 1000;
  const liveEnd = liveStart + GOAL * 3600e3;
  [screens.hero, screens.story, screens.styles].forEach((a) => a && setDate(a, new Date()));

  const miniBlocks = $('[data-live="mini"]');
  if (miniBlocks) miniBlocks.innerHTML = '<i></i>'.repeat(GOAL);
  let lastFlip = {};

  function tick() {
    const now = Date.now();
    const hours = (now - liveStart) / 3600e3;
    const base = {
      startDay: dayWord(liveStart, now), startTime: timeFmt(new Date(liveStart)),
      endDay: dayWord(liveEnd, now), endTime: timeFmt(new Date(liveEnd)),
      ifEnd: '',
    };
    if (screens.hero) renderHome(screens.hero, { ...base, hours, idle: false });

    if (screens.styles) {
      const app = screens.styles;
      renderHome(app, { ...base, hours, idle: false });
      const [H, M, S] = hms(hours * 3600);
      const leftMin = (GOAL - hours) * 60;
      const frac = clamp(hours / GOAL);
      [['fh', H], ['fm', M], ['fs', S]].forEach(([k, v]) => {
        const el = $(`[data-${k}]`, app);
        if (lastFlip[k] !== v) {
          el.textContent = v; lastFlip[k] = v;
          if (!reduceMotion) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
        }
      });
      $('[data-bar]', app).style.width = `${frac * 100}%`;
      $('[data-left]', app).innerHTML = `<b>${hm(leftMin)}</b> to goal`;
      $('[data-garc]', app).setAttribute('stroke-dasharray', `${frac * 100} 100`);
      $('[data-gtime]', app).textContent = `${H}:${M}:${S}`;
      $('[data-gsub]', app).textContent = `${hm(leftMin).toUpperCase()} TO GOAL`;
      $$('[data-dt]', app).forEach((e) => { e.textContent = `${H}:${M}:${S}`; });
      $$('[data-ds]', app).forEach((e) => { e.textContent = `${Math.round(frac * 100)}% OF 16H`; });
      $('[data-dink]', app).style.setProperty('--top', `${(1 - frac) * 100}%`);
      $('[data-bt]', app).textContent = `${H}:${M}:${S}`;
      $('[data-bs]', app).textContent = `${hm(leftMin).toUpperCase()} TO GOAL`;
    }

    // Home Screen widget
    const [H, M, S] = hms(hours * 3600);
    const [lh, lm, ls] = hms((GOAL - hours) * 3600);
    const w1 = $('[data-live="hms"]'), w2 = $('[data-live="left"]');
    if (w1) w1.textContent = `${H}:${M}:${S}`;
    if (w2) w2.textContent = `${+lh}:${lm}:${ls}`;
    if (miniBlocks) [...miniBlocks.children].forEach((b, i) => b.style.setProperty('--f', `${clamp(hours - i) * 100}%`));
  }
  tick();
  setInterval(tick, 1000);

  // ---------- Scroll ----------
  const pinProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  };
  const through = (el) => {
    const r = el.getBoundingClientRect();
    return clamp((innerHeight - r.top) / (innerHeight + r.height));
  };

  const heroStage = $('#heroStage');
  const heroMain = $('[data-hero="main"]'), heroL = $('[data-hero="left"]'), heroR = $('[data-hero="right"]');
  const stmtSec = $('#statements'), stmts = $$('.stmt');
  const story = $('#how'), steps = $$('.step'), storyBar = $('.story-bar span');
  const stylesSec = $('#styles'), styleItems = $$('.style-list li'), tsLayers = screens.styles ? $$('.ts', screens.styles) : [];
  const calWrap = $('#calPhoneWrap'), tDays = screens.tracking ? $$('.t-d', screens.tracking) : [];
  const darkCard = $('#darkCard'), wipe = $('.wipe');
  const cta = $('#download'), ctaBlocks = $('#ctaBlocks');

  // The story's fast: started yesterday at 7:30 PM.
  const storyStart = new Date(); storyStart.setDate(storyStart.getDate() - 1); storyStart.setHours(19, 30, 0, 0);
  const storyEnd = new Date(storyStart.getTime() + GOAL * 3600e3);

  let lastCal = -1, lastStyle = -1, lastStep = -1;

  function onScroll() {
    // Hero: the phone tilts up to face you, the side phones fan out.
    if (heroStage && !reduceMotion) {
      const p = clamp(scrollY / (innerHeight * 0.8));
      heroMain.style.transform = `translateY(${lerp(0, -30, p)}px) rotateX(${lerp(24, 0, p)}deg) scale(${lerp(0.94, 1, p)})`;
      heroL.style.transform = `translateX(${lerp(55, 0, p)}%) translateY(${lerp(40, 0, p)}px) rotate(${lerp(0, -6, p)}deg)`;
      heroR.style.transform = `translateX(${lerp(-55, 0, p)}%) translateY(${lerp(40, 0, p)}px) rotate(${lerp(0, 6, p)}deg)`;
    }

    // Statements light up one at a time.
    if (stmtSec) {
      const p = pinProgress(stmtSec);
      const idx = Math.min(stmts.length - 1, Math.floor(p * stmts.length * 0.999));
      stmts.forEach((s, i) => s.classList.toggle('on', i === idx));
    }

    // Story: scroll scrubs one fast from start to saved.
    if (story && screens.story) {
      const p = pinProgress(story);
      const ended = p >= 0.87;
      const idle = p < 0.12 || ended;
      const hours = map(p, 0.12, 0.8, 0, 19.6);
      renderHome(screens.story, {
        idle, hours: ended ? 0 : hours,
        startDay: 'Yesterday', startTime: timeFmt(storyStart),
        endDay: 'Today', endTime: timeFmt(storyEnd),
        ifEnd: 'Tomorrow<span>' + timeFmt(storyEnd) + '</span>',
        press: (p > 0.085 && p < 0.12) || (p > 0.83 && p < 0.87),
        toast: ended,
      });
      const step = p < 0.14 ? 0 : p < 0.4 ? 1 : p < 0.62 ? 2 : p < 0.84 ? 3 : 4;
      if (step !== lastStep) {
        steps.forEach((s, i) => { s.classList.toggle('on', i === step); s.classList.toggle('past', i < step); });
        lastStep = step;
      }
      storyBar.style.transform = `scaleX(${p})`;
    }

    // Timer styles: one style per slice of scroll.
    if (stylesSec && tsLayers.length) {
      const p = pinProgress(stylesSec);
      const idx = Math.min(4, Math.floor(p * 5));
      if (idx !== lastStyle) {
        tsLayers.forEach((l, i) => l.classList.toggle('on', i === idx));
        styleItems.forEach((l, i) => l.classList.toggle('on', i === idx));
        lastStyle = idx;
      }
    }

    // Tracking: the month fills in day by day.
    if (calWrap && tDays.length) {
      const n = Math.round(map(through(calWrap), 0.2, 0.62, 0, SEPT.length));
      if (n !== lastCal) {
        let fasts = 0, hrs = 0, goals = 0;
        tDays.forEach((el, i) => {
          const shown = i < n, h = SEPT[i];
          const filled = shown && h > 0;
          const wasFilled = el.classList.contains('f') || el.classList.contains('miss');
          const col = (i + SEPT_OFFSET) % 7;
          el.classList.toggle('f', filled);
          el.classList.toggle('miss', shown && !h);
          el.classList.toggle('jl', filled && col !== 0 && i > 0 && SEPT[i - 1] > 0);
          el.classList.toggle('jr', filled && col !== 6 && i + 1 < n && SEPT[i + 1] > 0);
          if (shown && !wasFilled && !reduceMotion) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
          if (filled) { fasts++; hrs += h; if (h >= GOAL) goals++; }
        });
        $('[data-tstats]', screens.tracking).innerHTML = `<b>${fasts}</b> fasts · <b>${hrs}h</b> · <b>${goals}</b> goal reached`;
        lastCal = n;
      }
    }

    // Light / dark wipe.
    if (darkCard && wipe) wipe.style.setProperty('--x', `${map(through(darkCard), 0.3, 0.68, 100, 0)}%`);

    // Closing CTA: the background blocks fill as you arrive.
    if (cta && ctaBlocks) {
      const p = through(cta);
      [...ctaBlocks.children].forEach((b) => b.style.setProperty('--f', p > b._t ? "100%" : "0%"));
    }
  }

  function buildCtaBlocks() {
    if (!ctaBlocks) return;
    const size = innerWidth <= 900 ? 46 : 64;
    const cols = Math.floor(ctaBlocks.clientWidth / size) || 10;
    const rows = Math.ceil(ctaBlocks.clientHeight / size) + 1 || 8;
    const gap = innerWidth <= 900 ? 6 : 8;
    const cell = (ctaBlocks.clientWidth - 16 - gap * (cols - 1)) / cols;
    Object.assign(ctaBlocks.style, { gridTemplateColumns: `repeat(${cols}, 1fr)`, gridAutoRows: `${cell}px`, gap: `${gap}px` });
    ctaBlocks.innerHTML = '<i></i>'.repeat(cols * rows);
    [...ctaBlocks.children].forEach((b) => { b._t = 0.15 + Math.random() * 0.4; });
  }

  // Clicking a timer style scrolls to it.
  styleItems.forEach((li, i) => {
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      const top = stylesSec.offsetTop + ((i + 0.5) / 5) * (stylesSec.offsetHeight - innerHeight);
      scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  let ticking = false;
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } };
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', () => { buildCtaBlocks(); requestUpdate(); });
  buildCtaBlocks();
  onScroll();

  // ---------- Reveal on view + count-ups ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('[data-count]', e.target).forEach(countUp);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.transitionDelay = `${(sibs.indexOf(el) % 3) * 90}ms`;
    io.observe(el);
  });

  function countUp(el) {
    const to = +el.dataset.count;
    if (reduceMotion) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const k = clamp((t - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Plan rows pick like the paywall's.
  $$('.plan').forEach((p) => p.addEventListener('click', () => {
    $$('.plan').forEach((x) => x.classList.toggle('plan-on', x === p));
  }));
})();
