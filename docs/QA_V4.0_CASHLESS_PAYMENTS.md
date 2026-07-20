# QA Report — v4.0.0 Cashless Payments

## Final status

**PASS**

- General content audit: 0 errors / 0 warnings
- Public-site validation: 0 errors / 0 warnings
- Release-specific QA: 158 passed / 0 failed

Machine-readable report: `reports/v4-cashless-qa.json`

## Validation coverage

### Source content

- Required article fields and publication status
- Japanese/English translation-key and route parity
- Official source count and source-domain diversity
- Minimum content depth
- Unique titles and descriptions
- Current verification date
- Valid CTA and affiliate material keys

### Generated HTML

- Doctype, language, title, description, canonical, and H1
- No unresolved template placeholders
- No duplicate IDs
- No broken internal references
- Canonical and hreflang consistency
- Index/noindex policy consistency
- Unique article images

### Structured data

Each of the 16 new article routes was checked for parseable JSON-LD containing:

- Article or BlogPosting
- FAQPage
- canonical URL
- language metadata
- publication and modification dates

Category and topic hubs are generated as CollectionPage / ItemList pages by the standard build.

### Discovery surfaces

Each new route was confirmed in:

- the appropriate split article sitemap
- the appropriate Japanese or English RSS feed
- `public/search-index.json`
- the category directory
- one of the two new topic hubs
- semantic related-article modules

### Product comparison database

Airレジ, Airペイ, Square POS, and PayCAS Mobile were confirmed in the generated catalog with:

- `cashless-payments` as the primary category
- the intended payment or POS-integration topic
- pricing summary
- official sources
- strengths and limitations
- related bilingual articles

### Affiliate and official-link separation

A8 pages were checked for:

- exact configured affiliate key
- A8 click URL
- 1×1 tracking pixel
- analytics wrapper
- first-view advertising disclosure

Official-only pages were checked for:

- `data-official-link="true"`
- no A8 click URL
- no fabricated tracking material

## Reproduction

```bash
npm run check
npm run qa:v4
```

Expected final output:

```text
Validation passed: 966 HTML files, 656 data articles, 0 warnings.
{
  "checks": 158,
  "passed": 158,
  "failed": 0
}
```
