(() => {
  "use strict";

  const raw = window.LUQEVORA_ANALYTICS_CONFIG || {};
  const validGtm = /^GTM-[A-Z0-9]+$/i.test(String(raw.gtmId || "").trim()) ? String(raw.gtmId).trim() : "";
  const validGa4 = /^G-[A-Z0-9]+$/i.test(String(raw.ga4Id || "").trim()) ? String(raw.ga4Id).trim() : "";
  const validClarity = /^[a-z0-9]+$/i.test(String(raw.clarityId || "").trim()) ? String(raw.clarityId).trim() : "";
  const mode = validGtm ? "gtm" : (validGa4 || validClarity ? "direct" : "none");
  const configured = mode !== "none";
  let loaded = false;

  function appendScript(src) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    document.head.appendChild(script);
  }

  function loadGtm(id) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    appendScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`);
  }

  function loadGa4(id) {
    appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
  }

  function loadClarity(id) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r);
      t.async = true;
      t.src = `https://www.clarity.ms/tag/${encodeURIComponent(i)}`;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", id);
  }

  function load() {
    if (!configured || loaded) return;
    loaded = true;
    if (mode === "gtm") {
      loadGtm(validGtm);
      return;
    }
    if (validGa4) loadGa4(validGa4);
    if (validClarity) loadClarity(validClarity);
  }

  window.LuqevoraAnalytics = Object.freeze({ configured, mode, load });
  window.addEventListener("luqevoraConsentGranted", load, { once: true });
})();
