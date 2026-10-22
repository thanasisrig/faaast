// Faaast website: draws the app's screens in HTML and drives them from the scroll.
(() => {
  // Set this once the App Store listing is live; every [data-store] link points to it.
  const APP_STORE_URL = 'https://apps.apple.com/app/id6818526484';

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
  // The app's own tab icons (assets/tab-icons in the app repo): outline, and filled when selected.
  const ICON = {
    fast: "<svg viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12 6V12L16 14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    'fast-fill': "<svg viewBox=\"0 0 24 24\"><path fill-rule=\"evenodd\" d=\"M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 5C11.4477 5 11 5.4477 11 6V12C11 12.3788 11.214 12.7251 11.5527 12.8945L15.5527 14.8945C16.0467 15.1415 16.6475 14.9412 16.8945 14.4473C17.1415 13.9533 16.9412 13.3525 16.4473 13.1055L13 11.3818V6C13 5.4477 12.5523 5 12 5Z\" fill=\"currentColor\"/></svg>",
    tracking: "<svg viewBox=\"0 0 24 24\"><path d=\"M6 20V10\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M12 20V4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M18 20V7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    'tracking-fill': "<svg viewBox=\"0 0 24 24\"><rect x=\"4\" y=\"9\" rx=\"2\" fill=\"currentColor\"/><rect x=\"10\" y=\"3\" rx=\"2\" fill=\"currentColor\"/><rect x=\"16\" y=\"6\" rx=\"2\" fill=\"currentColor\"/></svg>",
    me: "<svg viewBox=\"0 0 24 24\"><path d=\"M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"7\" r=\"4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    'me-fill': "<svg viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"7\" r=\"5\" fill=\"currentColor\"/><path d=\"M20 19V21H12H4V19C4 17.9391 4.42143 16.9217 5.17157 16.1716C5.92172 15.4214 6.93913 15 8 15H16C17.0609 15 18.0783 15.4214 18.8284 16.1716C19.5786 16.9217 20 17.9391 20 19Z\" fill=\"currentColor\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    settings: "<svg viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
    'settings-fill': "<svg viewBox=\"0 0 24 24\"><path fill-rule=\"evenodd\" d=\"M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z M9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12Z\" fill=\"currentColor\"/><path d=\"M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>",
  };
  const PENCIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>';
  const statusBar = `<div class="sb"><span>9:41</span><svg viewBox="0 0 74 13" fill="currentColor"><rect x="0" y="8" width="3.4" height="5" rx="1"/><rect x="5" y="5.5" width="3.4" height="7.5" rx="1"/><rect x="10" y="3" width="3.4" height="10" rx="1"/><rect x="15" y="0" width="3.4" height="13" rx="1"/><path d="M31 3.2c2.5 0 4.8 1 6.5 2.6l1.2-1.2A10.8 10.8 0 0 0 31 1.4a10.8 10.8 0 0 0-7.7 3.2l1.2 1.2A9 9 0 0 1 31 3.2zm0 3.5c1.5 0 2.9.6 4 1.6l1.2-1.2a7.5 7.5 0 0 0-10.4 0L27 8.3c1.1-1 2.5-1.6 4-1.6zm0 3.4c-.7 0-1.3.3-1.8.7L31 12.6l1.8-1.8c-.5-.4-1.1-.7-1.8-.7z"/><rect x="45" y="1" width="25" height="11.5" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="47" y="3" width="19" height="7.5" rx="2"/><rect x="71" y="4.5" width="1.6" height="4.5" rx=".8" opacity=".4"/></svg></div>`;
  const tabbar = (on) => `<div class="tabbar">${[['fast', 'Fast'], ['tracking', 'Tracking'], ['me', 'Me'], ['settings', 'Settings']].map(([k, l]) => `<div class="tab${k === on ? ' on' : ''}">${ICON[k === on ? `${k}-fill` : k]}${l}</div>`).join('')}</div>`;

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


  // The Me tab: records, then weight. Weigh-ins over 30 days, kg.
  const WEIGHTS = [86.3, 86.1, 86.2, 85.9, 85.8, 85.9, 85.6, 85.5, 85.6, 85.3, 85.2, 85.1, 85.0, 84.8];
  const meScreen = () => {
    const W = 290, H = 130, lo = 79, hi = 87;
    const X = (i) => 6 + (i * (W - 12)) / (WEIGHTS.length - 1);
    const Y = (kg) => 8 + ((hi - kg) / (hi - lo)) * (H - 16);
    const line = WEIGHTS.map((kg, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(kg).toFixed(1)}`).join(' ');
    const dots = WEIGHTS.map((kg, i) => `<circle class="dot" data-i="${i}" cx="${X(i).toFixed(1)}" cy="${Y(kg).toFixed(1)}" r="${i === WEIGHTS.length - 1 ? 5 : 3.5}" fill="${i === WEIGHTS.length - 1 ? '#111' : '#8A8A8A'}" opacity="0"/>`).join('');
    const stat = (k, v, unit, sub) => `<div class="me-stat"><small>${k}</small><b><span data-count="${v}">0</span>${unit ? `<i>${unit}</i>` : ''}</b><span>${sub}</span></div>`;
    return `
    <div class="app">
      <div class="me-scroll" data-mescroll>
        <div class="me-title">Me</div>
        <div class="me-k" style="top:180px">YOUR FASTS</div>
        <div class="me-stats">
          ${stat('AVERAGE FAST', 18, 'h', 'Over 51 fasts')}
          ${stat('LONGEST FAST', 76, 'h', 'Sat 26 Sep 2026')}
          ${stat('TOTAL FASTS', 51, '', 'Since 15 Aug 2026')}
          ${stat('TOTAL HOURS', 888, 'h', 'About 37 days')}
        </div>
        <div class="me-k" style="top:502px">WEIGHT</div>
        <div class="me-weight">
          <div class="me-w-top"><span>LATEST · TODAY, 7:50 AM</span><b>Log +</b></div>
          <div class="me-w-big"><b>84.8<i>kg</i></b><div><span class="trend" data-trend>↓ 1.5 kg</span><span>in 30 days</span></div></div>
          <svg class="me-chart" viewBox="0 0 ${W + 30} ${H + 18}">
            <line x1="0" x2="${W}" y1="${Y(85)}" y2="${Y(85)}" stroke="#E5E5E5"/><text x="${W + 6}" y="${Y(85) + 4}" font-size="12" fill="#707070">85</text>
            <line x1="0" x2="${W}" y1="${Y(80)}" y2="${Y(80)}" stroke="#248A3D" stroke-dasharray="5 5" stroke-width="1.5"/><text x="${W + 6}" y="${Y(80) + 4}" font-size="12" fill="#707070">80</text>
            <text x="4" y="${Y(80) - 6}" font-size="12" font-weight="600" fill="#248A3D">Goal 80.0</text>
            <path data-wline d="${line}" pathLength="100" fill="none" stroke="#111" stroke-width="2.5" stroke-linejoin="round" stroke-dasharray="100" stroke-dashoffset="100"/>
            ${dots}
          </svg>
          <div class="me-axis"><span>7 Sep</span><span>22 Sep</span><span>Today</span></div>
          <div class="me-w-foot"><span>4.8 kg to your goal</span><div class="seg"><span>7 days</span><span>Month</span></div></div>
        </div>
      </div>
      ${statusBar.replace('class="sb"', 'class="sb me-sb"')}
      ${tabbar('me')}
    </div>`;
  };

  // ---------- Mount ----------
  const screens = {};
  $$('[data-app]').forEach((scr) => {
    const kind = scr.dataset.app;
    scr.innerHTML = kind === 'tracking' ? trackingScreen() : kind === 'me' ? meScreen() : kind === 'styles' ? homeScreen(stylesTimer()) : homeScreen(blocksTimer());
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
  const meCard = $('#meCard'), meScroll = screens.me && $('[data-mescroll]', screens.me);
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

    // Me: the screen scrolls down to Weight, and the line draws towards the goal.
    if (meCard && meScroll) {
      const t = through(meCard);
      meScroll.style.transform = `translateY(${-map(t, 0.3, 0.5, 0, 300)}px)`;
      const q = map(t, 0.4, 0.58, 0, 1);
      $('[data-wline]', screens.me).setAttribute('stroke-dashoffset', 100 - q * 100);
      $$('.dot', screens.me).forEach((d) => d.setAttribute('opacity', q >= d.dataset.i / (WEIGHTS.length - 1) ? 1 : 0));
      $('[data-trend]', screens.me).classList.toggle('on', q > 0.9);
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
