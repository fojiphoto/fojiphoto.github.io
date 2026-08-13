/* ─────────────────────────────────────────────────────────────
   Shared lead-form handler for every service / landing page.

   Markup contract — the form needs:
     <form class="lead-form" data-lead="qa"> … </form>
   plus a submit button and a .fmsg element inside it.

   On success it dispatches the same 'fs:lead' event analytics.js
   listens for, so every page reports conversions the same way.
   ───────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var ENDPOINT = 'https://formsubmit.co/ajax/ed1d5b72ba86e31cb741a2f58d48cd92';

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.classList || !form.classList.contains('lead-form')) return;

    e.preventDefault();

    var which = form.getAttribute('data-lead') || 'service-page';
    var btn = form.querySelector('button[type="submit"]');
    var msg = form.querySelector('.fmsg');
    var original = btn ? btn.innerHTML : '';

    if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }
    if (msg) { msg.className = 'fmsg'; msg.textContent = ''; }

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function () {
        form.reset();
        if (msg) {
          msg.className = 'fmsg ok';
          msg.textContent = 'Got it — we’ll be in touch shortly.';
        }
        document.dispatchEvent(new CustomEvent('fs:lead', { detail: { form: which } }));
      })
      .catch(function () {
        if (msg) {
          msg.className = 'fmsg err';
          msg.innerHTML = 'Something went wrong. Email us at <b>contact@factorialstudio.com</b>.';
        }
      })
      .then(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
      });
  });
})();
