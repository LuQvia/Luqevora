(() => {
  'use strict';

  const VERSION = '2.0.0';
  const IDS = Object.freeze({
    ga4: 'G-E3KM03W0RR',
    gtm: 'GTM-MQX7DMFR',
    clarity: 'xn4y4wj11k'
  });

  const state = {
    version: VERSION,
    configured: true,
    consent: 'denied',
    loaded: false,
    ga4Requested: false,
    gtmRequested: false,
    clarityRequested: false,
    ga4Loaded: false,
    gtmLoaded: false,
    clarityLoaded: false,
    errors: []
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // Consent Mode v2 must be initialized before any Google tag is requested.
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  function addError(service, error) {
    const message = error instanceof Error ? error.message : String(error || 'load_failed');
    state.errors.push({ service, message, at: new Date().toISOString() });
    console.warn(`[Luqevora analytics] ${service}: ${message}`);
  }

  function injectScript(src, marker, service, onLoad) {
    const selector = `script[data-luqevora-analytics="${marker}"]`;
    const existing = document.querySelector(selector);
    if (existing) return existing;

    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    script.dataset.luqevoraAnalytics = marker;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.addEventListener('load', () => {
      try { onLoad?.(); } catch (error) { addError(service, error); }
    }, { once: true });
    script.addEventListener('error', () => addError(service, 'network_or_content_blocker'), { once: true });
    document.head.appendChild(script);
    return script;
  }

  function loadGa4() {
    if (state.ga4Requested) return;
    state.ga4Requested = true;
    window.gtag('js', new Date());
    window.gtag('config', IDS.ga4, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      transport_type: 'beacon'
    });
    injectScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(IDS.ga4)}`,
      `ga4-${IDS.ga4}`,
      'GA4',
      () => { state.ga4Loaded = true; }
    );
  }

  function loadGtm() {
    if (state.gtmRequested) return;
    state.gtmRequested = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    injectScript(
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(IDS.gtm)}`,
      `gtm-${IDS.gtm}`,
      'GTM',
      () => { state.gtmLoaded = true; }
    );
  }

  function loadClarity() {
    if (state.clarityRequested) return;
    state.clarityRequested = true;
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    injectScript(
      `https://www.clarity.ms/tag/${encodeURIComponent(IDS.clarity)}`,
      `clarity-${IDS.clarity}`,
      'Clarity',
      () => { state.clarityLoaded = true; }
    );
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
    if (!state.loaded || !/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(eventName)) return false;
    window.gtag('event', eventName, cleanParameters(parameters));
    window.dataLayer.push({ event: 'luqevora_custom_event', luqevora_event_name: eventName, ...cleanParameters(parameters) });
    return true;
  }

  function load() {
    if (state.loaded) return;
    state.loaded = true;
    state.consent = 'granted';
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted'
    });
    loadGa4();
    loadGtm();
    loadClarity();
    window.dataLayer.push({ event: 'luqevora_analytics_loaded', analytics_version: VERSION });
  }

  function deny() {
    state.consent = 'denied';
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
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
      try { destination = new URL(link.href, window.location.href); } catch (_) { return; }
      if (!/^https?:$/.test(destination.protocol) || destination.origin === window.location.origin) return;
      const affiliate = link.matches('[data-affiliate-link], [rel~="sponsored"]');
      track(affiliate ? 'affiliate_click' : 'outbound_click', {
        link_url: destination.href,
        link_domain: destination.hostname,
        link_text: (link.textContent || '').trim().slice(0, 100)
      });
    });
  }

  let scrollTracked = false;
  function trackScrollDepth() {
    window.addEventListener('scroll', () => {
      if (scrollTracked) return;
      const height = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
      if (height > 0 && (window.scrollY + window.innerHeight) / height >= 0.75) {
        scrollTracked = true;
        track('scroll_75', { page_location: window.location.href, page_title: document.title });
      }
    }, { passive: true });
  }

  window.addEventListener('luqevora:contact_start', (event) => track('contact_start', event.detail || {}));
  window.addEventListener('luqevora:contact_success', (event) => track('contact_submit_success', event.detail || {}));
  trackLanguageSelection();
  trackOutboundLinks();
  trackScrollDepth();

  window.LuqevoraAnalytics = Object.freeze({
    version: VERSION,
    configured: true,
    load,
    deny,
    track,
    loaded: () => state.loaded,
    status: () => JSON.parse(JSON.stringify(state))
  });
})();
