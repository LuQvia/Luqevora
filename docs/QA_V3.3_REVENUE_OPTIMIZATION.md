# QA v3.3 Revenue Optimization

## Scope

- Revenue optimization dashboard generated outside `public/`
- Machine-readable CTA inventory and CSV improvement queue
- Affiliate and official-link event dimensions standardized
- CTA viewport impressions added after analytics consent
- Product-hub navigation event metadata strengthened
- No estimated CTR, CVR, EPC, conversion, or revenue values

## Generated reports

- `reports/revenue-optimization.html`
- `reports/revenue-optimization.json`
- `reports/revenue-optimization.csv`

## Measurement events

- `affiliate_click`
- `official_link_click`
- `cta_impression`
- `diagnosis_complete`
- `product_click`
- `article_product_hub`

## Audit result

- Published data articles: 598
- Commercial CTA/reference articles: 575
- CTA/reference placements: 1,099
- Public HTML files: 876
- Indexable pages: 559
- Content audit errors: 0
- Content audit warnings: 0
- HTML/SEO validation errors: 0
- HTML/SEO validation warnings: 0

## Important limitation

The package does not include imported GA4 or affiliate-network performance exports. The dashboard therefore does not calculate CTR, CVR, EPC, approval rate, or revenue. Those metrics must be calculated only from real exported data.
