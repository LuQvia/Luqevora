# Store DX Platform v4.1.0

## Release scope

v4.1.0 converts the existing Store DX article cluster into a guided Store DX platform. It preserves the static-site architecture and adds a bilingual diagnostic experience, cross-category product selection, implementation guides, and LuQvia consultation routes.

Release verification date: 2026-07-20.

## Public routes

- Japanese Store DX hub: `/ja/store-dx/`
- English Store DX hub: `/en/store-dx/`
- Japanese assessment: `/ja/store-dx-assessment/`
- English assessment: `/en/store-dx-assessment/`

The assessment runs in the browser. Answers are not transmitted by the diagnostic script. Users can review the generated priorities and then choose an article, product profile, or LuQvia consultation route.

## Diagnostic dimensions

The recommendation logic evaluates:

- industry
- store count
- current operational problems
- implementation stage
- priority workflow

It produces a phased recommendation covering the relevant solution groups rather than selecting a single product without context.

## Cross-category comparison groups

The canonical configuration is `content/config/store-dx-platform.json`.

| Group | Registered products |
|---|---|
| POS | AirREGI, Square POS, funfo, Kantan Chumon, EMEAO! POS matching |
| Payments | AirPAY, Square POS, PayCAS Mobile |
| Reservations | STORES Reservations, Square POS |
| Retention | LINE Official Account, funfo, STORES Reservations |
| Accounting | freee Accounting, Money Forward Cloud Accounting, AirREGI, Square POS |

The comparison catalog now contains 76 products. Four new product profiles were added for STORES Reservations, LINE Official Account, freee Accounting, and Money Forward Cloud Accounting.

## New bilingual article pairs

- Store DX implementation roadmap
- Store DX stack comparison
- Salon Store DX guide
- Retail Store DX guide

All eight routes are indexable and included in search data, RSS where applicable, structured data, and the split sitemap set.

## Topics and internal linking

Three bilingual topic clusters were added:

- reservations and customer records
- customer communication and retention
- back-office and accounting integration

The Store DX hub links product profiles, diagnosis, implementation guides, existing POS/payment content, and LuQvia consultation routes. Existing category-card output is retained so normal validation and article discovery continue to work.

## Consultation routes

LuQvia routes are configured as official, non-affiliate destinations:

- website: `https://www.luqvia.com/`
- LINE: `https://lin.ee/nTfIJLT`
- email: `info@luqvia.com`

The release does not invent an affiliate relationship for STORES Reservations, LINE Official Account, freee, or Money Forward. Their product CTAs remain official links unless an approved tracking URL is later registered in `content/config/affiliates.json`.

## Main implementation files

- `content/config/store-dx-platform.json`
- `scripts/store-dx-platform-lib.mjs`
- `source-assets/js/store-dx-diagnosis-v4.1.0.js`
- `scripts/qa-v41-store-dx-platform.mjs`
- `content/articles/ja/*store-dx*.json`
- `content/articles/en/*store-dx*.json`

## Build output

The final v4.1.0 build produced:

- 664 data-driven articles
- 430 indexable public articles, 215 per language
- 76 comparison products
- 40 topic pages
- 988 public HTML files
- 671 sitemap URLs
- 430 search-index articles

See `docs/QA_V4.1_STORE_DX_PLATFORM.md` and `reports/v4.1-store-dx-platform-qa.json` for release verification.
