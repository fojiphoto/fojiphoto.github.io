/* ─────────────────────────────────────────────────────────────
   Factorial Studio — site analytics

   ▶ TO SWITCH ANALYTICS ON: paste your GA4 Measurement ID below.
     It looks like  G-ABC1234XYZ  and comes from
     Google Analytics → Admin → Data streams → your web stream.

   Until a real ID is set, this file does nothing at all — no
   network requests, no cookies. So it is safe to ship as-is.

   The ID lives HERE ONLY. Every page loads this one file, so you
   never have to touch the HTML again.
   ───────────────────────────────────────────────────────────── */

var GA_MEASUREMENT_ID = 'G-DEGDESVT7E';   // ← paste it here

(function () {
  'use strict';

  var configured = GA_MEASUREMENT_ID &&
                   GA_MEASUREMENT_ID.indexOf('XXXX') === -1 &&
                   /^G-[A-Z0-9]{6,}$/i.test(GA_MEASUREMENT_ID);

  // Queue lead events even before (or without) analytics, so nothing is lost
  // and the forms never depend on this file having loaded.
  var pending = [];

  function send(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    } else {
      pending.push([name, params || {}]);
    }
  }

  // A form told us it submitted successfully.
  // Fired from the page handlers as:  document.dispatchEvent(
  //   new CustomEvent('fs:lead', { detail: { form: 'teardown' } }) )
  document.addEventListener('fs:lead', function (e) {
    var which = (e && e.detail && e.detail.form) || 'unknown';
    send('generate_lead', {
      form_id: which,
      page_path: location.pathname
    });
  });

  if (!configured) return;   // nothing else happens until an ID is set

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    // Don't write the visitor's full address into the analytics record.
    anonymize_ip: true
  });

  // flush anything that happened before gtag was ready
  pending.forEach(function (ev) { gtag('event', ev[0], ev[1]); });
  pending.length = 0;
})();
