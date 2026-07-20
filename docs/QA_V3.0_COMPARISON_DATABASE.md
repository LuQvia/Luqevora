# Luqevora v3.0.0 Comparison Database QA

## Scope

- Introduced a canonical product comparison catalog generated from the two retained product-profile datasets.
- Added bilingual comparison database pages at `/ja/compare/` and `/en/compare/`.
- Added keyword, category, and pricing-model filters.
- Added a public machine-readable catalog at `/product-catalog.json`.
- Added CollectionPage, ItemList, and BreadcrumbList structured data.
- Added comparison database links to the primary navigation and footer.

## Catalog results

- Products: 63
- Product categories: 5
- Official source references: 155
- Products with related Luqevora articles: 63
- Shared fields: positioning, pricing summary, pricing detail, pricing model, workflow, best fit, strengths, limits, capability indicators, official sources, related articles, verification date

## Data safeguards

- Capability indicators are derived only from text already present in the retained product profiles.
- No product-performance, customer-satisfaction, or hands-on-experience scores are generated.
- Pricing summaries retain a verification date and link to official provider sources.
- The catalog generator runs before every full `npm run check`.

## Final validation

- Published data articles: 598
- Content audit errors: 0
- Content audit warnings: 0
- Generated HTML files: 736
- Indexable pages in release manifest: 419
- HTML/SEO validation errors: 0
- HTML/SEO validation warnings: 0
