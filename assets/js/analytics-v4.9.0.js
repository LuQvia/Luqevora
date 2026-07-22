(() => {
  'use strict';

  const VERSION = '4.9.0';
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
    pageContextTracked: false,
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

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });

  const meta = name => document.querySelector(`meta[name="${name}"]`)?.content || '';
  const debugMode = new URLSearchParams(location.search).get('ga_debug') === '1';

  const pageContext = () => ({
    content_type: meta('luqevora-content-type') || document.body?.dataset.pageType || 'page',
    content_category: meta('luqevora-category') || document.body?.dataset.category || '',
    content_topic: meta('luqevora-topic') || document.body?.dataset.topic || '',
    product_name: meta('luqevora-product') || document.body?.dataset.product || '',
    content_language: document.documentElement.lang || '',
    page_language: document.documentElement.lang || ''
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
      transport_type: 'beacon',
      debug_mode: debugMode
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
    const payload = cleanParameters({ ...pageContext(), ...parameters });
    window.gtag('event', eventName, payload);
    window.dataLayer.push({
      event: 'luqevora_analytics_event',
      luqevora_event_name: eventName,
      ...payload
    });
    return true;
  }

  function trackPageContext() {
    if (state.pageContextTracked) return;
    state.pageContextTracked = true;
    const ctx = pageContext();
    if (ctx.content_type === 'comparison') {
      track('article_view');
      track('comparison_view');
    } else if (ctx.content_type === 'review') {
      track('article_view');
      track('review_view');
    } else if (ctx.content_type === 'article-directory') {
      track('article_directory_view');
    }
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
    window.dataLayer.push({
      event: 'luqevora_analytics_loaded',
      analytics_version: VERSION,
      ga4_measurement_id: IDS.ga4,
      gtm_container_id: IDS.gtm
    });
    trackPageContext();
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

  function inferAffiliateName(link, destination) {
    const explicit = link.dataset.affiliateName || link.closest('[data-affiliate-name]')?.dataset.affiliateName;
    if (explicit) return explicit;
    if (destination.hostname === 'seranking.com' && destination.searchParams.get('ga') === '5202722') return 'se_ranking';
    if (destination.hostname === 'referworkspace.app.goo.gl') return 'google_workspace';
    return '';
  }

  function isActiveAffiliate(link, destination) {
    const status = link.dataset.affiliateStatus || link.closest('[data-affiliate-status]')?.dataset.affiliateStatus;
    if (status === 'active') return true;
    return Boolean(inferAffiliateName(link, destination));
  }

  function inferCtaType(link, destination, affiliateName) {
    const explicit = link.dataset.ctaType || link.closest('[data-cta-type]')?.dataset.ctaType;
    if (explicit) return explicit;
    const text = (link.textContent || '').toLowerCase();
    const path = destination.pathname.toLowerCase();
    if (affiliateName === 'google_workspace') return 'referral';
    if (path.includes('subscription') || path.includes('pricing') || text.includes('料金') || text.includes('pricing')) return 'pricing';
    if (path.includes('sign-up') || text.includes('sign up') || text.includes('申し込')) return 'sign_up';
    if (text.includes('trial') || text.includes('無料') || text.includes('試用') || affiliateName === 'se_ranking') return 'free_trial';
    return 'official_site';
  }

  function affiliateParameters(link, destination) {
    const container = link.closest('[data-affiliate-key], [data-affiliate-name], [data-affiliate-status]');
    const affiliateName = inferAffiliateName(link, destination);
    return {
      affiliate_name: affiliateName,
      product_name: link.dataset.productName || link.dataset.affiliateProduct || link.dataset.product || container?.dataset.productName || affiliateName,
      affiliate_key: link.dataset.affiliateKey || container?.dataset.affiliateKey || '',
      content_language: document.documentElement.lang || '',
      cta_position: link.dataset.affiliatePosition || link.dataset.linkPosition || container?.dataset.affiliatePosition || container?.dataset.linkPosition || '',
      cta_type: inferCtaType(link, destination, affiliateName),
      link_url: destination.href,
      link_domain: destination.hostname,
      link_text: (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100)
    };
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a.lang-link, a[href="/ja/"], a[href="/en/"]');
    if (!link) return;
    let destination;
    try { destination = new URL(link.href, location.href); } catch (_) { return; }
    const match = destination.pathname.match(/^\/(ja|en)\//);
    if (match) track('language_select', { language: match[1], link_url: destination.href });
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    let destination;
    try { destination = new URL(link.href, location.href); } catch (_) { return; }
    if (!/^https?:$/.test(destination.protocol) || destination.origin === location.origin) return;

    if (isActiveAffiliate(link, destination)) {
      track('affiliate_click', affiliateParameters(link, destination));
      return;
    }

    const official = link.matches('[data-official-link], .source-list a') ||
      link.dataset.affiliateStatus === 'inactive' ||
      link.dataset.affiliateKey?.includes('official');
    track(official ? 'official_link_click' : 'outbound_click', {
      link_url: destination.href,
      link_domain: destination.hostname,
      link_text: (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100)
    });
  });

  const observedCtas = new WeakSet();
  if ('IntersectionObserver' in window) {
    const ctaObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || observedCtas.has(entry.target)) return;
      const link = entry.target.matches('a[href]') ? entry.target : entry.target.querySelector('a[href]');
      if (!link) return;
      let destination;
      try { destination = new URL(link.href, location.href); } catch (_) { return; }
      if (!isActiveAffiliate(link, destination)) return;
      observedCtas.add(entry.target);
      track('affiliate_cta_impression', affiliateParameters(link, destination));
      ctaObserver.unobserve(entry.target);
    }), { threshold: 0.5 });

    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('a[data-affiliate-status="active"]').forEach(element => ctaObserver.observe(element));
    }, { once: true });
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('[data-track-event]');
    if (!target) return;
    track(target.dataset.trackEvent, {
      product_id: target.dataset.productId || '',
      link_position: target.dataset.linkPosition || '',
      link_url: target.href || ''
    });
  });

  let scrollTracked = false;
  window.addEventListener('scroll', () => {
    if (scrollTracked) return;
    const height = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0);
    if (height > 0 && (scrollY + innerHeight) / height >= 0.75) {
      scrollTracked = true;
      track('scroll_75', { page_title: document.title });
    }
  }, { passive: true });

  window.addEventListener('luqevora:contact_start', event => track('contact_start', event.detail || {}));
  window.addEventListener('luqevora:contact_success', event => track('contact_submit_success', event.detail || {}));

  window.LuqevoraAnalytics = Object.freeze({
    version: VERSION,
    configured: true,
    ids: IDS,
    load,
    deny,
    track,
    loaded: () => state.loaded,
    status: () => JSON.parse(JSON.stringify(state))
  });
})();
