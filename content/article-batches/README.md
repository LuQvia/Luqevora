# Article expansion batches

This directory contains structured source data for the bilingual 280-article milestone.

- `product-profiles.json`: provider-owned positioning, pricing model, workflow, strengths, constraints and official sources.
- `product-profiles-expansion.json`: 23 additional official-source product profiles used by the 50-topic expansion.
- `bilingual-comparisons.json`: 20 new comparison topics rendered in Japanese and English.
- `bilingual-comparison-expansion.json`: 50 additional purchase-intent comparison topics rendered in Japanese and English.
- `bilingual-comparison-expansion-2.json`: 26 additional non-duplicative comparison topics rendered in Japanese and English.
- `bilingual-review-expansion.json`: 24 product-profile reviews rendered in Japanese and English.
- `bilingual-affiliate-intents.json`: pricing, alternatives, and use-case guides for 12 affiliate-program candidates, rendered in Japanese and English.
- `bilingual-comparison-expansion-3.json`: 44 additional purchase-intent comparisons with direct paths to relevant official plans.
- `legacy-migrations.json`: 17 Japanese legacy pages migrated into structured bilingual content.
- `english-translations.json`: English counterparts for the 22 existing Japanese data articles.

`scripts/load-articles.mjs` expands these records into the same article schema used by individual JSON files. Affiliate CTAs resolve to official URLs until a reviewed tracking URL is added to `content/config/affiliates.json`.

Comparison plan and trial checklists are selected by category so AI, website, marketing, business-software, and hosting/security articles do not reuse irrelevant limits. A record-level `verifiedAt` may override `content/config/site.json` when a topic is checked on a different date.
