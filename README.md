# Luqevora Static Platform

Luqevoraを、静的サイトの速度と安全性を維持したまま、記事データから自動生成する基盤です。

## この版の状態

- バージョン1.10.0は、v1.9.0のSEO運用基盤にCPI法人向けサーバー記事、A8.net素材の原文保持出力、広告計測と表示検証を追加した収益化強化版です。
- 公開記事は日本語280件・英語280件です。すべて同一カテゴリ・スラッグの日英ペアになっています。
- 既存公開URLと購入意図の強い記事を中心に、日本語122件・英語122件を検索対象へ設定しています。残り316件は削除せず `noindex,follow` で保持し、固有性と根拠を高めてから段階公開できます。
- 12テーマの日英トピックハブ、記事ごとの判断要約・検証情報、意味的な関連記事5件を追加しました。
- 検索対象244記事には、固有の1200×675画像、画像サイトマップ情報、Article / BlogPosting構造化データを出力します。
- `hreflang` と `x-default` を日英ペアで統一し、サイトマップを固定ページ・トピック・日英記事の5ファイルへ分割しました。
- 日英RSSとIndexNow通知を備え、GitHub Pages公開後は追加・更新・削除されたURLだけを通知します。
- ビルド前に本文量、公式情報源、日英ペア、重複メタ情報、確認日の鮮度を監査し、JSON/CSVレポートを生成します。
- index対象ページのSHA-256公開マニフェストを生成し、直前の本番との差分を自動判定します。
- SEO画像は生成条件が変わったものだけ再生成するため、通常の検証時間を短縮できます。
- 旧HTMLから17テーマを日英の構造化データへ移行し、データから生成する記事は478件です。
- 現行公開サイト一式を `legacy/` に保存しています。
- ビルド時は現行サイトを先に `public/` へ複製し、データ化済み478記事と全トップ・カテゴリ・記事一覧を再生成します。
- 未移行の記事、固定ページ、デザイン、画像、JavaScript、`CNAME`、`.nojekyll` は維持されます。
- sitemap、robots、RSS、検索用データはビルド時に検索対象ページだけから再生成します。
- ホームの注目比較・レビューは `content/config/home.json` で日英共通に管理します。

品質監査、公開差分、選択的IndexNow通知は [`docs/SEO_OPERATIONS_V1.9.md`](docs/SEO_OPERATIONS_V1.9.md) を参照してください。SEO強化内容と段階公開は [`docs/SEO_ENHANCEMENT_V1.8.md`](docs/SEO_ENHANCEMENT_V1.8.md)、日英280記事マイルストーンは [`docs/BILINGUAL_280_AFFILIATE_MILESTONE.md`](docs/BILINGUAL_280_AFFILIATE_MILESTONE.md) に残しています。

## アフィリエイトリンクの運用

- 各比較記事のCTAには公式URLと `affiliateKey` を保存しています。
- `content/config/affiliates.json` が空の間は、通常の公式リンクとして出力します。
- 承認後に同ファイルへ追跡URLを登録すると、該当CTAだけを広告リンクへ切り替えます。
- 広告リンクへ切り替わった記事は、広告開示と `rel="sponsored nofollow noopener"` を自動で出力します。

## GitHubへ反映する手順

1. ZIPを展開し、中身をLuqevoraリポジトリのルートへアップロードします。
2. GitHub Pagesの公開元を **GitHub Actions** に設定します。
3. `main` ブランチへの反映後、`Build and validate` が完了するまで待ちます。
4. Actionsが成功したら、主要記事、`sitemap.xml`、`release-manifest.json`、言語切替を確認します。

ローカルではNode.js 20以上で次を実行できます。GitHub ActionsではNode.js 24を使用します。

```bash
npm run check
```

## 通常運用

1. `content/articles/ja` または `content/articles/en` に記事JSONを追加・更新します。
   日英共通の比較記事は `content/article-batches/` の構造化データでも管理できます。
2. `npm run check` を実行します。
3. GitHubへpushします。
4. GitHub Actionsが生成・検査し、合格時のみ公開します。公開後は変更URLだけをIndexNowへ通知します。

`public/` は自動生成物です。記事本文やメタ情報は直接編集せず、`content/` を更新してください。記事画像は `source-assets/` へ生成されます。

検索対象のルールは `content/config/seo.json` で管理します。`indexing.mode` を `all` に変えると全記事を検索対象へ切り替えられますが、先に独自検証・固有画像・内部リンク・検索意図の重複を確認してください。

検証では、各言語280記事以上、検索対象100記事以上、日英ルートと検索対象の完全一致、固有画像、トピック件数、分割サイトマップ、`x-default`、構造化データ、内部リンクを確認します。品質監査では本文量、公式情報源数、日付、翻訳ペア、タイトル・description重複も検査し、`reports/content-audit.json` とCSVへ出力します。
