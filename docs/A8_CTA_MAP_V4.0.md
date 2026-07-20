# A8.net and CTA Map — v4.0.0

## Policy

Only user-supplied and already configured A8.net materials are published. Official product URLs remain normal external links until an approved tracking material is supplied and registered in `content/config/affiliates.json`.

## New product CTA mapping

| Product | Japanese CTA | English CTA | Tracking status |
|---|---|---|---|
| Airレジ | `air-regi-official` | `air-regi-official-en` | Official link only |
| Airペイ | `airpay-official` | `airpay-official-en` | Official link only |
| Square POS | `square-pos-official` | `square-pos-official-en` | Official link only |
| PayCAS Mobile | `paycas-mobile-official` | `paycas-mobile-official-en` | Official link only |

Official entries contain a destination URL but no affiliate tracking URL. The article renderer therefore outputs `data-official-link="true"` and does not apply sponsored-link attributes.

## A8.net placements in the new cluster

| Route | Material key | Program | Placement rationale |
|---|---|---|---|
| `/ja/cashless-payments/air-regi-vs-square-pos/` | `emeao-pos-free` | A8.net `s00000012115003` | Secondary route for readers who need multiple POS vendor proposals instead of selecting either compared product directly |
| `/ja/cashless-payments/pos-register-vs-cashless-payment/` | `kantan-chumon-short` | A8.net `s00000017718048` | Relevant restaurant POS/mobile-order implementation example within a POS-versus-payment decision guide |

English versions use official links and contain no A8 tracking material because the configured materials are Japanese advertising assets.

## Rendering safeguards

- Raw A8 HTML is emitted without rewriting the supplied tracking URL or pixel URL.
- Section-level A8 placement is included in first-view disclosure detection.
- A8 pages must contain:
  - `hero-affiliate-disclosure`
  - `data-affiliate-key`
  - an A8 click URL
  - an A8 1×1 tracking pixel
- The release validator fails if any safeguard is missing.

## Adding future approved materials

1. Add the exact network material to `content/config/affiliates.json`.
2. Preserve the supplied click URL, fixed text, `nofollow`, and tracking pixel.
3. Assign the new key to the relevant article CTA or section.
4. Run:

```bash
npm run check
npm run qa:v4
```

Do not replace official CTAs until the program is approved and the exact material is available.
