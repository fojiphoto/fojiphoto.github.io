/* ─────────────────────────────────────────────────────────────
   Factorial Studio — site analytics + cookie consent

   GA4 Measurement ID lives HERE ONLY. Every page loads this one file.

   Consent: gtag is not loaded until the visitor accepts. Until then
   nothing is fetched from Google and no _ga cookie is written. The
   choice is remembered in localStorage for 12 months. "Decline" also
   remembers, so the banner does not nag on every page. Lead events
   fired before consent are queued and only flushed if consent is
   given. This is what makes the site shippable to EU clients.
   ───────────────────────────────────────────────────────────── */

var GA_MEASUREMENT_ID = 'G-BT9PWTTM6P';

(function () {
  'use strict';

  var KEY = 'fs-consent';                 // 'granted' | 'denied'
  var TTL = 365 * 24 * 60 * 60 * 1000;    // re-ask after a year

  var configured = GA_MEASUREMENT_ID &&
                   GA_MEASUREMENT_ID.indexOf('XXXX') === -1 &&
                   /^G-[A-Z0-9]{6,}$/i.test(GA_MEASUREMENT_ID);

  var pending = [];
  var loaded = false;

  function store(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }
  function stored() {
    try {
      var j = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!j || Date.now() - j.t > TTL) return null;
      return j.v;
    } catch (e) { return null; }
  }

  function send(name, params) {
    if (loaded && typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    } else {
      pending.push([name, params || {}]);
    }
  }

  // A form told us it submitted successfully:
  //   document.dispatchEvent(new CustomEvent('fs:lead', {detail:{form:'teardown'}}))
  document.addEventListener('fs:lead', function (e) {
    var which = (e && e.detail && e.detail.form) || 'unknown';
    send('generate_lead', { form_id: which, page_path: location.pathname });
  });

  function loadGA() {
    if (loaded || !configured) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    pending.forEach(function (ev) { gtag('event', ev[0], ev[1]); });
    pending.length = 0;
  }

  function banner() {
    var css = document.createElement('style');
    css.textContent =
      '#fs-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:560px;' +
      'margin:0 auto;background:#06281c;color:#eaf5ee;border:2px solid rgba(163,217,119,.45);' +
      'border-radius:18px;padding:16px 18px;box-shadow:0 18px 44px rgba(3,30,20,.45);' +
      "font-family:'Fredoka',system-ui,sans-serif;font-size:.92rem;line-height:1.5}" +
      '#fs-consent p{margin:0 0 12px}#fs-consent a{color:#fbbf24;text-decoration:underline}' +
      '#fs-consent .b{display:flex;gap:10px;flex-wrap:wrap}' +
      '#fs-consent button{font:inherit;font-weight:600;border-radius:999px;padding:10px 20px;cursor:pointer;border:2px solid transparent}' +
      '#fs-consent .ok{background:#fbbf24;color:#3a2a06}' +
      '#fs-consent .no{background:transparent;color:#eaf5ee;border-color:rgba(163,217,119,.45)}' +
      '#fs-consent button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}' +
      '@media (max-width:480px){#fs-consent{left:10px;right:10px;bottom:10px;padding:14px}}';
    document.head.appendChild(css);

    var el = document.createElement('div');
    el.id = 'fs-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'Cookie consent');
    var policy = location.pathname.indexOf('/fsa.io/') === 0 ? '../privacy.html' : '/privacy.html';
    el.innerHTML =
      '<p>We use Google Analytics to see which pages are useful. It sets a cookie. ' +
      'No ads, no selling data. <a href="' + policy + '">Privacy policy</a></p>' +
      '<div class="b"><button class="ok" type="button">Accept analytics</button>' +
      '<button class="no" type="button">Decline</button></div>';
    el.querySelector('.ok').onclick = function () { store('granted'); el.remove(); loadGA(); };
    el.querySelector('.no').onclick = function () { store('denied'); el.remove(); pending.length = 0; };
    document.body.appendChild(el);
  }

  if (!configured) return;

  var v = stored();
  if (v === 'granted') { loadGA(); }
  else if (v === null) {
    if (document.body) banner();
    else document.addEventListener('DOMContentLoaded', banner);
  }
  // v === 'denied': do nothing, say nothing.
})();
