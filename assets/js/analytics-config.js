/**
 * Luqevora analytics configuration v1.9.0.
 *
 * GA4 and Microsoft Clarity are loaded directly after analytics consent.
 * GTM is loaded in parallel for future tag management.
 * Do not add the same GA4 property or Clarity project inside GTM while this
 * direct configuration remains enabled, otherwise duplicate measurement may occur.
 */
window.LUQEVORA_ANALYTICS_CONFIG = Object.freeze({
  version: '1.9.0',
  gtmId: 'GTM-MQX7DMFR',
  ga4Id: 'G-E3KM03W0RR',
  clarityId: 'xn4y4wj11k'
});
