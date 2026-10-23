/* ─────────────────────────────────────────────────────────────────────────
   Factorial Studio — visitor bot
   A small robot in the top-left that shows the site's visitor count.

   ▶ TO SWITCH THE COUNT ON: set COUNTER_URL below. Until it is set, the bot
     renders and waves but shows no number — it never invents one.

   GitHub Pages is static, so the number has to come from somewhere that can
   store and increment it. Two ways, pick one:

   1. Your own Vercel function (recommended — your data, no third party):
        COUNTER_URL = 'https://<your-project>.vercel.app/api/count';
      It should answer a GET with JSON { "count": 1234 } and send
        Access-Control-Allow-Origin: https://factorialstudio.com

   2. counterapi.dev (free tier, needs a workspace signup):
        COUNTER_URL = 'https://api.counterapi.dev/v2/<workspace>/visits/up';
      Its reply nests the number at data.up_count — handled below.

   The response shape is sniffed rather than assumed, so either works without
   editing anything else.
   ───────────────────────────────────────────────────────────────────────── */

var COUNTER_URL = '';          // ← paste one of the two above

(function () {
  'use strict';

  if (window.__fsBot) return;  // a page that includes the file twice
  window.__fsBot = true;

  /* One visit per browser session, not per page view. Clicking through six
     pages is one visitor, and counting it as six is the quickest way to make
     the number meaningless. */
  var FIRST_THIS_SESSION = (function () {
    try {
      if (sessionStorage.getItem('fs-counted')) return false;
      sessionStorage.setItem('fs-counted', '1');
      return true;
    } catch (e) { return true; }   // private mode: count it, better than not
  })();

  var CSS = [
    '.fsbot{position:fixed;left:18px;top:92px;z-index:90;display:flex;align-items:center;',
      'gap:10px;padding:8px 14px 8px 8px;border-radius:999px;',
      'background:rgba(6,40,28,.86);backdrop-filter:blur(10px);',
      'border:2px solid rgba(163,217,119,.32);box-shadow:0 10px 26px rgba(3,30,20,.4);',
      'font-family:var(--f-body,"Fredoka",sans-serif);',
      'opacity:0;transform:translateY(-8px);animation:fsbotIn .5s ease-out .4s forwards;',
      'cursor:default;transition:border-color .25s,box-shadow .25s}',
    '.fsbot:hover{border-color:rgba(251,191,36,.55);box-shadow:0 12px 30px rgba(3,30,20,.5)}',
    '@keyframes fsbotIn{to{opacity:1;transform:none}}',
    '.fsbot-svg{width:34px;height:34px;flex:none;animation:fsbotFloat 3.4s ease-in-out infinite}',
    '@keyframes fsbotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}',
    /* the eyes blink on their own timer so the bot never looks frozen */
    '.fsbot-eye{animation:fsbotBlink 4.2s infinite}',
    '@keyframes fsbotBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}',
    '.fsbot-txt{display:flex;flex-direction:column;line-height:1.15;white-space:nowrap}',
    '.fsbot-n{font-family:var(--f-disp,"Bungee",cursive);font-size:.92rem;color:#fff;',
      'letter-spacing:.02em;font-variant-numeric:tabular-nums}',
    '.fsbot-l{font-size:.58rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;',
      'color:var(--gold,#fbbf24)}',
    /* no number yet: the bot still shows, it just does not claim anything */
    '.fsbot.is-bare .fsbot-txt{display:none}',
    '.fsbot.is-bare{padding:8px}',
    '@media (max-width:900px){.fsbot{left:12px;top:76px;padding:6px 11px 6px 6px}',
      '.fsbot-svg{width:28px;height:28px}.fsbot-n{font-size:.8rem}.fsbot-l{font-size:.52rem}}',
    '@media (prefers-reduced-motion:reduce){',
      '.fsbot,.fsbot-svg,.fsbot-eye{animation:none!important;opacity:1;transform:none}}'
  ].join('');

  var ROBOT =
    '<svg class="fsbot-svg" viewBox="0 0 40 40" aria-hidden="true">' +
      '<path d="M20 5v4" stroke="#a3d977" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="20" cy="4" r="2.4" fill="#fbbf24"/>' +
      '<rect x="6.5" y="9.5" width="27" height="21" rx="7.5" fill="#0e6347" ' +
        'stroke="#a3d977" stroke-width="2.2"/>' +
      '<g class="fsbot-eye" style="transform-origin:14.5px 19px">' +
        '<circle cx="14.5" cy="19" r="2.7" fill="#fbbf24"/></g>' +
      '<g class="fsbot-eye" style="transform-origin:25.5px 19px">' +
        '<circle cx="25.5" cy="19" r="2.7" fill="#fbbf24"/></g>' +
      '<path d="M16 25.5c1.3 1.2 2.6 1.8 4 1.8s2.7-.6 4-1.8" stroke="#a3d977" ' +
        'stroke-width="2" stroke-linecap="round" fill="none"/>' +
      '<path d="M3.5 17v6M36.5 17v6" stroke="#a3d977" stroke-width="2.2" stroke-linecap="round"/>' +
    '</svg>';

  function mount() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var el = document.createElement('div');
    el.className = 'fsbot is-bare';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = ROBOT +
      '<span class="fsbot-txt"><b class="fsbot-n">—</b><span class="fsbot-l">visitors</span></span>';
    document.body.appendChild(el);

    /* The nav is a different height on different pages, and different again
       once the viewport narrows, so a fixed offset tucks the bot under it
       somewhere. Measure the real nav instead and sit clear of it. */
    function place() {
      var nav = document.querySelector('nav, .policy-nav');
      if (!nav) return;
      var b = nav.getBoundingClientRect();
      if (b.height) el.style.top = Math.round(b.bottom + 14) + 'px';
    }
    place();
    window.addEventListener('resize', place);
    // webfonts land after first paint and can change the nav's height
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

    return el;
  }

  /* Different services nest the number differently. Rather than hard-code one
     shape, walk the response for the first plausible integer. */
  function pluck(d) {
    if (typeof d === 'number') return d;
    if (!d || typeof d !== 'object') return null;
    var keys = ['count', 'up_count', 'value', 'hits', 'views', 'visits', 'total'];
    for (var i = 0; i < keys.length; i++) {
      if (typeof d[keys[i]] === 'number') return d[keys[i]];
    }
    if (d.data) return pluck(d.data);
    if (d.result) return pluck(d.result);
    return null;
  }

  function render(el, n) {
    el.classList.remove('is-bare');
    var out = el.querySelector('.fsbot-n');
    var target = n, start = Math.max(0, n - Math.min(n, 40)), t0 = null;
    // count up on arrival — it reads as live rather than as a static label
    function step(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / 700);
      out.textContent = Math.round(start + (target - start) * k).toLocaleString();
      if (k < 1) requestAnimationFrame(step);
    }
    if (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) {
      out.textContent = target.toLocaleString();
    } else {
      requestAnimationFrame(step);
    }
    el.title = target.toLocaleString() + ' visitors so far';
  }

  function start() {
    var el = mount();
    if (!COUNTER_URL) return;    // bot shows, number stays off. Never faked.

    var url = COUNTER_URL;
    if (!FIRST_THIS_SESSION) url = url.replace(/\/up$/, '');  // read, don't increment

    fetch(url, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var n = pluck(d);
        if (typeof n === 'number' && isFinite(n)) render(el, n);
        // a dead counter leaves the bot bare rather than showing a wrong number
      })
      .catch(function () { /* offline, blocked, or the service is down */ });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
