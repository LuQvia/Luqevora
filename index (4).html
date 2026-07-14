(() => {
  "use strict";

  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".main-nav");
  const analytics = window.LuqevoraAnalytics;
  const banner = document.querySelector(".cookie-banner");
  const settingsButtons = document.querySelectorAll("[data-consent-settings]");
  const consentKey = "luqevora-consent";
  let returnFocus = null;

  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; } catch (_) { return false; }
  }

  function setMenu(open) {
    if (!menuButton || !nav) return;
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    const openLabel = document.documentElement.lang === "ja" ? "メニューを閉じる" : "Close menu";
    const closedLabel = document.documentElement.lang === "ja" ? "メニューを開く" : "Open menu";
    menuButton.setAttribute("aria-label", open ? openLabel : closedLabel);
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
    nav.addEventListener("click", event => {
      if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("click", event => {
      if (nav.classList.contains("open") && !nav.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
    });
    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 761px)").matches) setMenu(false);
    });
  }

  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  function openConsent(trigger = null) {
    if (!banner || !analytics?.configured) return;
    returnFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add("show"));
    banner.querySelector("button")?.focus();
  }

  function closeConsent({ restoreFocus = true } = {}) {
    if (!banner) return;
    banner.classList.remove("show");
    window.setTimeout(() => {
      banner.hidden = true;
      if (restoreFocus && returnFocus instanceof HTMLElement) returnFocus.focus();
      returnFocus = null;
    }, 180);
  }

  if (analytics?.configured) {
    settingsButtons.forEach(button => {
      button.hidden = false;
      button.addEventListener("click", () => openConsent(button));
    });
    const choice = safeGet(consentKey);
    if (choice === "accepted") {
      analytics.load();
    } else if (!choice && banner) {
      window.setTimeout(() => openConsent(null), 600);
    }
  } else {
    banner?.remove();
    settingsButtons.forEach(button => button.remove());
  }

  document.querySelector("[data-consent-accept]")?.addEventListener("click", () => {
    safeSet(consentKey, "accepted");
    closeConsent();
    analytics?.load();
    window.dispatchEvent(new Event("luqevoraConsentGranted"));
  });

  document.querySelector("[data-consent-decline]")?.addEventListener("click", () => {
    const wasAccepted = safeGet(consentKey) === "accepted";
    safeSet(consentKey, "declined");
    closeConsent();
    if (wasAccepted) window.location.reload();
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (nav?.classList.contains("open")) {
      setMenu(false);
      menuButton?.focus();
      return;
    }
    if (banner && !banner.hidden) closeConsent();
  });
})();
