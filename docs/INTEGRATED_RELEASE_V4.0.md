# Luqevora Integrated Release v4.0.0

## Release scope

v4.0.0 adds a bilingual cashless-payment decision cluster to the existing Luqevora static publishing platform while retaining the Store DX, XServer, website-builder, SaaS, hosting, and affiliate content already integrated in v3.7.0.

## 1. Cashless-payment category foundation

- New category: `cashless-payments`
- Japanese label: キャッシュレス決済
- English label: Cashless Payments
- Navigation links added in both languages.
- New topic hubs:
  - `cashless-payment-services`
  - `pos-payment-integration`
- Category, topic, article-directory, home, footer, breadcrumb, canonical, hreflang, and search facets are generated from the same configuration.

## 2. New bilingual article cluster

### Individual reviews

- `/ja/cashless-payments/air-regi-review/`
- `/en/cashless-payments/air-regi-review/`
- `/ja/cashless-payments/airpay-review/`
- `/en/cashless-payments/airpay-review/`
- `/ja/cashless-payments/square-pos-review/`
- `/en/cashless-payments/square-pos-review/`
- `/ja/cashless-payments/paycas-mobile-review/`
- `/en/cashless-payments/paycas-mobile-review/`

### Comparison and implementation guides

- `/ja/cashless-payments/airpay-vs-square/`
- `/en/cashless-payments/airpay-vs-square/`
- `/ja/cashless-payments/square-vs-paycas-mobile/`
- `/en/cashless-payments/square-vs-paycas-mobile/`
- `/ja/cashless-payments/air-regi-vs-square-pos/`
- `/en/cashless-payments/air-regi-vs-square-pos/`
- `/ja/cashless-payments/pos-register-vs-cashless-payment/`
- `/en/cashless-payments/pos-register-vs-cashless-payment/`

All 16 routes are indexable, included in the search index, included in the relevant RSS feed, and included in the split article sitemaps.

## 3. Product comparison database

The following products were added to `content/article-batches/product-profiles-expansion.json` and the generated comparison catalog:

- Airレジ / AirREGI
- Airペイ / AirPAY
- Square POSレジ / Square POS
- PayCAS Mobile

The catalog generator now honors an explicit `category` and `topic` in a product profile before falling back to article-majority inference. This prevents payment terminals that also appear in Store DX articles from being assigned to the wrong primary category.

The existing Kantan Chumon profile and related articles were also refreshed with the official public plan prices and four-language support confirmed on 2026-07-20.

## 4. CTA and A8.net policy

- Airレジ, Airペイ, Square, and PayCAS Mobile use official CTAs because no approved A8 tracking material for those four products was supplied in this release.
- No tracking URL, program ID, or conversion condition was invented.
- Existing supplied A8.net material is used only where editorially relevant:
  - `emeao-pos-free` on the Airレジ vs Square POS comparison
  - `kantan-chumon-short` on the POS register vs cashless-payment guide
- The renderer now detects raw A8 material placed inside article sections and automatically emits a first-view advertising disclosure.
- Validation confirms the A8 click URL, analytics wrapper, `nofollow`, and 1×1 tracking pixel are retained.

See `docs/A8_CTA_MAP_V4.0.md` for the exact placement map.

## 5. Generated outputs

The standard pipeline regenerates:

- category and topic pages
- all article HTML
- comparison database and product pages
- Article / BlogPosting and FAQPage structured data
- semantic related links
- `sitemap.xml` and split sitemaps
- Japanese and English RSS feeds
- `search-index.json`
- release manifest and SHA-256 page hashes
- operations and revenue dashboards
- content-audit and validation reports

## 6. Release metrics

From the final v4.0.0 build:

- 656 data-driven published articles
- 340 indexable data-driven articles
- 422 total indexable public articles
- 211 indexable articles per language
- 72 comparison-database products
- 36 topic pages
- 422 unique article images
- 966 public HTML files
- 649 sitemap URLs
- 0 content-audit errors
- 0 content-audit warnings
- 0 site-validation errors
- 0 site-validation warnings
- 158/158 v4 release-specific QA checks passed

## 7. Commands

```bash
npm run check
npm run qa:v4
```

Both commands must pass before deployment.
