# Luqevora 自動生成基盤 設計図

## 1. 原則

- データ化済み記事は `content/`、未移行ページは `legacy/` を正本とする段階移行です。
- `public/` は生成物であり、原則として直接編集しない。
- 既存公開URLを維持する。
- 日本語・英語は `translationKey` で1対1に関連付ける。
- 広告リンクは `content/config/affiliates.json` で一元管理する。
- GitHub Actionsの検査に合格した変更だけを公開する。

## 2. データフロー

```text
legacy/（既存サイトのコピー） ─────────────┐
    ↓ inventory / import:legacy            │ 未移行ページを維持
content/（移行済み・新規記事、SEO設定）      │
source-assets/（記事別の元画像）             │
    + templates/（共通HTML）
    ↓ build（legacyを複製後、データ化済み記事・カテゴリ・記事一覧を上書き）
public/（HTML・分割sitemap・RSS・検索データ）
    ↓ validate
GitHub Pagesへ公開
```

## 3. 責務分離

- `content/articles/{lang}`: 比較・レビュー・ガイド記事。
- `content/article-batches`: 製品プロファイル、日英比較、旧記事移行、英訳をまとめた構造化バッチ。`scripts/load-articles.mjs` が通常の記事スキーマへ展開する。
- `content/pages/{lang}`: 運営者情報、広告開示、編集方針等。
- `content/config`: サイト、カテゴリ、ナビゲーション、ホーム掲載記事、広告設定。
- `content/config/seo.json`: 段階公開、優先製品、メタ情報、画像、関連記事件数。
- `content/config/topics.json`: カテゴリ横断の目的別トピック。
- `source-assets/images/articles`: 検索対象記事ごとの1200×675元画像。
- `templates`: ヘッダー、フッター、記事、カテゴリ、トップの共通テンプレート。
- `scripts`: 棚卸し、旧HTML取込、生成、品質検査。
- `public`: GitHub Pagesへ出す完成物。全公開ページを含む。
- `legacy`: 段階移行中に未移行ページと既存デザインを保持する現在サイトの原本。

## 4. URLルール

- 記事: `/{lang}/{category}/{slug}/`
- トピック: `/{lang}/topics/{topic}/`
- カテゴリ: `/{lang}/{category}/`
- 言語トップ: `/{lang}/`
- 末尾スラッシュを統一。
- 既存URL変更は禁止。避けられない場合のみ301リダイレクト表を作る。

## 5. 記事必須項目

`id`, `translationKey`, `language`, `type`, `status`, `slug`, `category`, `title`, `description`, `publishedAt`, `updatedAt`, `verifiedAt`, `sources`, `sections`。

比較記事では、`sections[].table`、`sections[].bullets`、`ctas`、`relatedLinks` を任意で利用できます。CTAは公式URLを必ず持ち、承認済み追跡URLが設定された場合だけ広告リンクへ切り替えます。

## 6. 公開ゲート

以下を検査する。

- HTML: doctype、lang、title、description、canonical、H1、重複ID。
- データ: 必須項目、重複URL、カテゴリ整合性。
- SEO: canonical、日英hreflang、x-default、構造化データ、分割サイトマップ、固有記事画像。
- リンク: 内部リンク、画像・スクリプト参照、カテゴリと記事一覧のカード件数。
- 規模: 日本語・英語それぞれ280記事以上。
- 日英対応: 全記事ルートのカテゴリ・スラッグが一致すること。
- 段階公開: 検索対象も日英で一致し、noindex記事がサイトマップと内部検索へ混入しないこと。
- トピック: トピックハブのカード数と検索対象記事の件数が一致すること。
- 生成記事: 6セクション以上かつ言語別の最低本文量を満たすこと。
- 文章品質: 日本語タイトルの重複表現、英語の全角記号・固有名詞の小文字化、検索説明文の欠落を検出する。
