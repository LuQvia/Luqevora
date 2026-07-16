(() => {
  'use strict';

  const raw = window.LUQEVORA_ANALYTICS_CONFIG || {};
  const validGtm = /^GTM-[A-Z0-9]+$/i.test(String(raw.gtmId || '').trim())
    ? String(raw.gtmId).trim().toUpperCase()
    : '';
  const validGa4 = /^G-[A-Z0-9]+$/i.test(String(raw.ga4Id || '').trim())
    ? String(raw.ga4Id).trim().toUpperCase()
    : '';
  const validClarity = /^[a-z0-9]+$/i.test(String(raw.clarityId || '').trim())
    ? String(raw.clarityId).trim().toLowerCase()
    : '';

  const configured = Boolean(validGtm || validGa4 || validClarity);
  let loaded = false;
  let scrollTracked = false;

  function appendScript(src, marker) {
    if (marker && document.querySelector(`script[data-luqevora-analytics="${marker}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    if (marker) script.dataset.luqevoraAnalytics = marker;
    document.head.appendChild(script);
  }

  function initializeDataLayer() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
  }

  function grantAnalyticsConsent() {
    initializeDataLayer();
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    });
  }

  function loadGtm(id) {
    if (!id) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js'
    });
    appendScript(
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`,
      `gtm-${id}`
    );
  }

  function loadGa4(id) {
    if (!id) return;
    initializeDataLayer();
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    appendScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`,
      `ga4-${id}`
    );
  }

  function loadClarity(id) {
    if (!id || window.clarity?.__luqevoraLoaded) return;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
      c[a].__luqevoraLoaded = true;
      t = l.createElement(r);
      t.async = true;
      t.referrerPolicy = 'strict-origin-when-cross-origin';
      t.dataset.luqevoraAnalytics = `clarity-${i}`;
      t.src = `https://www.clarity.ms/tag/${encodeURIComponent(i)}`;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', id);
  }

  function cleanParameters(parameters) {
    const output = {};
    Object.entries(parameters || {}).forEach(([key, value]) => {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(key)) return;
      if (value === undefined || value === null || value === '') return;
      if (typeof value === 'string') output[key] = value.slice(0, 300);
      else if (typeof value === 'number' || typeof value === 'boolean') output[key] = value;
    });
    return output;
  }

  function track(eventName, parameters = {}) {
    if (!loaded || !validGa4 || !/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(eventName)) return false;
    initializeDataLayer();
    window.gtag('event', eventName, cleanParameters(parameters));
    return true;
  }

  function trackLanguageSelection() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href="/ja/"], a[href="/en/"]');
      if (!link) return;
      track('language_select', {
        language: link.getAttribute('href') === '/ja/' ? 'ja' : 'en',
        page_location: window.location.href
      });
    });
  }

  function trackOutboundLinks() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      let destination;
      try {
        destination = new URL(link.href, window.location.href);
      } catch (_error) {
        return;
      }

      if (!/^https?:$/.test(destination.protocol) || destination.origin === window.location.origin) return;
      const affiliate = link.matches('[data-affiliate-link], [rel~="sponsored"]');
      track(affiliate ? 'affiliate_click' : 'outbound_click', {
        link_url: destination.href,
        link_domain: destination.hostname,
        link_text: (link.textContent || '').trim().slice(0, 100)
      });
    });
  }

  function trackScrollDepth() {
    window.addEventListener('scroll', () => {
      if (scrollTracked) return;
      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      );
      const viewportBottom = window.scrollY + window.innerHeight;
      if (documentHeight > 0 && viewportBottom / documentHeight >= 0.75) {
        scrollTracked = true;
        track('scroll_75', {
          page_location: window.location.href,
          page_title: document.title
        });
      }
    }, { passive: true });
  }

  function bindCustomEvents() {
    window.addEventListener('luqevora:contact_start', (event) => {
      track('contact_start', event.detail || {});
    });
    window.addEventListener('luqevora:contact_success', (event) => {
      track('contact_submit_success', event.detail || {});
    });
  }

  function initializeEventTracking() {
    trackLanguageSelection();
    trackOutboundLinks();
    trackScrollDepth();
    bindCustomEvents();
  }

  function load() {
    if (!configured || loaded) return;
    loaded = true;
    grantAnalyticsConsent();
    loadGa4(validGa4);
    loadGtm(validGtm);
    loadClarity(validClarity);
  }

  initializeEventTracking();

  window.LuqevoraAnalytics = Object.freeze({
    configured,
    loaded: () => loaded,
    load,
    track
  });

  window.addEventListener('luqevoraConsentGranted', load, { once: true });
})();
