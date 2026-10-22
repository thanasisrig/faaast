// Faaast website analytics: PostHog (EU), anonymous and cookieless.
// Nothing is stored in the visitor's browser (persistence: memory), no session
// replay, no click autocapture, Do Not Track respected. Off on localhost unless
// the URL has ?ph=test. The project token is a public client key.
(() => {
  const TOKEN = 'phc_rJgcBdGTsHBU27g2vcE6Qbv5EKtZLtGSGpna4ioLj2xz';
  const HOST = 'https://eu.i.posthog.com';
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (local && !new URLSearchParams(location.search).has('ph')) return;

  // PostHog's loader snippet (loads posthog-js from PostHog's EU asset host).
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset get_distinct_id getFeatureFlag isFeatureEnabled onFeatureFlags".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init(TOKEN, {
    api_host: HOST,
    persistence: 'memory',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
    respect_dnt: true,
  });
  posthog.register({ site: 'faaast-website' });

  const track = (event, props) => posthog.capture(event, props);

  // Download buttons, by where they sit on the page.
  document.querySelectorAll('[data-store]').forEach((a) => {
    a.addEventListener('click', () => track('download_clicked', { location: a.dataset.loc || 'unknown' }));
  });

  // How far people read: each section once per visit, after about a second on
  // screen, so jumping past it (the Download link, a nav link) doesn't count.
  const seen = new Set(), timers = {};
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const id = e.target.id;
    if (seen.has(id)) return;
    clearTimeout(timers[id]);
    if (e.isIntersecting) timers[id] = setTimeout(() => { seen.add(id); track('section_viewed', { section: id }); }, 1000);
  }), { threshold: 0.35 });
  ['how', 'styles', 'tracking', 'who', 'features', 'privacy', 'pro', 'facts', 'faq', 'download']
    .forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });

  document.querySelectorAll('.faq details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) track('faq_opened', { question: d.querySelector('summary').textContent.trim() });
  }));
  document.querySelectorAll('.style-list li').forEach((li) => li.addEventListener('click', () => {
    track('timer_style_clicked', { style: li.querySelector('b').textContent.trim() });
  }));
  document.querySelectorAll('.plan').forEach((p) => p.addEventListener('click', () => {
    track('plan_clicked', { plan: p.querySelector('b').textContent.trim().toLowerCase() });
  }));
  document.querySelectorAll('a[href^="mailto:"], a[href="/support/"], a[href="/privacy/"]').forEach((a) => {
    a.addEventListener('click', () => track('contact_clicked', { link: a.getAttribute('href').startsWith('mailto:') ? 'email' : a.getAttribute('href') }));
  });
})();
