# LuQvia Website Production Integration v4.2.0

## Purpose

v4.2.0 connects high-intent Luqevora comparison content with LuQvia's website-production and ongoing-improvement service without presenting the operator's service as an independent ranking result.

## Canonical service source

All repeated service information is managed in `content/config/luqvia-service.json`.

- Production price guideline: JPY 11,000 per page multiplied by the number of pages
- Ongoing support: JPY 11,000 per month
- Core coverage: website planning and production, mobile layout, inquiry routes, official LINE and form connections, and post-launch updates
- Free diagnosis: `https://forms.gle/LFzrDn36osnjPEd6A`
- Official LINE: `https://lin.ee/nTfIJLT`
- Website: `https://www.luqvia.com/`

Final pricing and scope remain subject to an estimate. The panel states this directly.

## Editorial separation

Each panel is labeled as an operator service. It states that LuQvia operates Luqevora and that the service guidance is separate from the comparison evaluation. LuQvia links are not marked as affiliate links and do not use `rel=sponsored`.

## Placement policy

The panel is limited to 20 Japanese comparison pages with strong intent around website builders, ecommerce implementation, hosting selection, and Store DX. Unrelated comparisons such as AI, VPN, and SEO-tool head-to-head pages are excluded.

## Conversion measurement

The links include explicit event names:

- `luqvia_website_open`
- `luqvia_diagnosis_open`
- `luqvia_line_open`

Website links include source-page UTM attribution using `utm_content=<article-slug>`.

## Generated output

The build injects:

- operator-service disclosure
- production and monthly pricing summaries
- supported-service list
- website, diagnosis, LINE, and email routes
- table-of-contents entry
- `Service` JSON-LD on each target page
- updated sitemap last-modified dates through article metadata
