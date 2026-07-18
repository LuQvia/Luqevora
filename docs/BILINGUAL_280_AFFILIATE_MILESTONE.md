# 日英280記事・収益導線強化マイルストーン

最終確認日: **2026-07-18**

## 公開規模

- 日本語: 280記事
- 英語: 280記事
- 検索インデックス: 560記事
- 日英の記事ルート: カテゴリ・スラッグとも完全一致
- データ生成記事: 478件（残りは段階移行中の既存HTML）
- 今回の追加: 80テーマ × 2言語 = 160公開ページ
- 今回の内訳: 料金・代替・用途別36テーマ + 新規比較44テーマ

## カテゴリ別の記事数（各言語）

| カテゴリ | 記事数 | 今回の追加 |
| --- | ---: | ---: |
| AIツール | 27 | 0 |
| Webサイト制作 | 50 | 15 |
| SEO・マーケティング | 61 | 21 |
| 業務効率化 | 73 | 24 |
| サーバー・セキュリティ | 69 | 20 |
| 合計 | 280 | 80 |

## 提携候補12社の収益導線向け36テーマ

各製品について「料金・プラン」「代替サービス」「用途別適合」の3テーマを日英で作成しました。

| 製品 | 料金・プラン | 代替サービス | 用途別適合 |
| --- | --- | --- | --- |
| Hostinger | `hostinger-pricing-guide` | `hostinger-alternatives` | `hostinger-for-small-business` |
| Kinsta | `kinsta-pricing-guide` | `kinsta-alternatives` | `kinsta-for-agencies` |
| WP Engine | `wp-engine-pricing-guide` | `wp-engine-alternatives` | `wp-engine-for-agencies` |
| Semrush | `semrush-pricing-guide` | `semrush-alternatives` | `semrush-for-small-business` |
| GetResponse | `getresponse-pricing-guide` | `getresponse-alternatives` | `getresponse-for-creators` |
| ActiveCampaign | `activecampaign-pricing-guide` | `activecampaign-alternatives` | `activecampaign-for-ecommerce` |
| HubSpot Marketing Hub | `hubspot-marketing-pricing-guide` | `hubspot-marketing-alternatives` | `hubspot-marketing-for-small-business` |
| Shopify | `shopify-pricing-guide` | `shopify-alternatives` | `shopify-for-small-business` |
| monday.com | `monday-pricing-guide` | `monday-alternatives` | `monday-for-small-business` |
| ClickUp | `clickup-pricing-guide` | `clickup-alternatives` | `clickup-for-small-business` |
| NordVPN | `nordvpn-pricing-guide` | `nordvpn-alternatives` | `nordvpn-for-remote-teams` |
| Surfshark | `surfshark-pricing-guide` | `surfshark-alternatives` | `surfshark-for-small-business` |

## 新規比較44テーマ

| カテゴリ | 追加数 | 主な比較軸 |
| --- | ---: | --- |
| Webサイト制作 | 12 | EC運用、デザイン自由度、ホスト型WordPress、簡易ストア |
| SEO・マーケティング | 9 | メール配信、自動化、CRM、販売ファネル、SEO調査 |
| 業務効率化 | 18 | プロジェクト実行、文書、業務DB、制作承認、個人タスク |
| サーバー・セキュリティ | 5 | WordPress.comと管理型・総合ホスティングの選択 |
| 合計 | 44 | 既存比較と逆順を含め重複なし |

比較データは `content/article-batches/bilingual-comparison-expansion-3.json`、料金・代替・用途別データは `content/article-batches/bilingual-affiliate-intents.json` で管理します。

## 収益化と品質の扱い

- CTAには製品ごとの公式URLと `affiliateKey` を保存。
- `content/config/affiliates.json` に承認済み追跡URLがない間は通常の公式リンクとして出力。
- 追跡URL登録後のみ広告開示と `rel="sponsored nofollow noopener"` を自動適用。
- 料金記事では表示月額だけでなく、更新、契約期間、利用上限、追加機能、移行・管理時間を確認。
- 代替記事では価格だけでなく、同じサンプル案件、権限、書き出し、移行条件で比較。
- 用途別記事では対象者と完了条件を明示し、担当者・管理者の両方で試す項目を掲載。
- 料金・プラン・キャンペーンは変わるため、検証日と契約直前の公式画面確認を明示。
