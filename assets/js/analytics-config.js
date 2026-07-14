/*
  Luqevora analytics configuration.
  Recommended: set only gtmId and manage GA4 / Clarity inside GTM.
  Direct ga4Id / clarityId are fallbacks for sites not using GTM.
*/
window.LUQEVORA_ANALYTICS_CONFIG = Object.freeze({
  gtmId: "",      // Example: GTM-XXXXXXX
  ga4Id: "",      // Example: G-XXXXXXXXXX (used only when gtmId is empty)
  clarityId: ""   // Used only when gtmId is empty
});
