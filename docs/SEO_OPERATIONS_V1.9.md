# SEO運用強化版 v1.9.0

## 目的

v1.8.0の段階公開・構造化データ・固有画像・トピックハブを維持しながら、更新のたびに「品質を落としていないか」「どのURLが実際に変わったか」を機械判定できるようにします。

## 追加した機能

### 1. コンテンツ品質監査

`npm run audit:content` は、データ生成記事について次を確認します。

- 必須項目と日付形式
- 日英翻訳ペアとindex/noindexの一致
- index対象記事の本文量、公式情報源数、セクション数、FAQ数
- 確認日の経過日数
- index対象内のタイトル・description完全重複
- 公式情報URLの形式

結果は次へ出力します。

- `reports/content-audit.json`
- `reports/content-audit.csv`

構造上のエラーはビルドを停止します。情報源数、本文量、鮮度などの改善候補は警告として残し、段階的に修正できます。noindex記事のうち品質スコアが基準を満たすものは `promotionCandidatePairs` と `promotionCandidates` に日英ペア単位で出力します。

監査基準は `content/config/seo.json` の `quality` で変更できます。

### 2. 公開リリースマニフェスト

`npm run release:manifest` は、index対象ページごとに次を含むSHA-256ハッシュを生成します。

- HTML
- 共通CSS・JavaScript・共通画像
- ページ固有OG画像

生成先:

- `public/release-manifest.json`
- `reports/release-manifest.json`

共通CSSやJavaScriptが変わった場合は、影響する全index対象ページを更新扱いにします。記事本文や固有画像だけが変わった場合は、そのページだけを更新扱いにできます。

### 3. 変更URL差分

`npm run release:diff` は、現在のビルドと本番の `release-manifest.json` を比較し、次を分類します。

- added
- updated
- deleted
- unchanged

結果は `reports/changed-urls.json` に出力します。本番にマニフェストがまだない初回だけは、現在のindex対象URLをすべて追加扱いにします。

ローカルファイル同士を比較する場合:

```bash
node scripts/prepare-release.mjs \
  --baseline-file reports/previous-release-manifest.json \
  --current-file public/release-manifest.json
```

### 4. 選択的IndexNow通知

GitHub Actionsは公開前に本番との差分を保存し、GitHub Pages公開後に `reports/changed-urls.json` のURLだけをIndexNowへ送信します。毎回サイトマップ全件を送信しません。

送信せず内容だけ確認する場合:

```bash
node scripts/submit-indexnow.mjs \
  --urls-file reports/changed-urls.json \
  --dry-run
```

### 5. SEO画像生成キャッシュ

既存画像と生成条件が変わっていない場合、`npm run generate:seo-images` は画像を再生成しません。記事スラッグ、トピック、画像サイズ、品質等が変わった画像だけを再生成し、不要になった画像は削除します。

すべて再生成する場合:

```bash
npm run generate:seo-images -- --force
```

並列数は `SEO_IMAGE_CONCURRENCY` で1〜16に変更できます。

## 通常の公開手順

```bash
npm run check
```

この1コマンドで次を実行します。

1. コンテンツ品質監査
2. SEO画像の差分生成
3. 静的サイト生成
4. 公開リリースマニフェスト生成
5. HTML・リンク・サイトマップ・構造化データ検証

GitHubの `main` へ反映すると、Actionsが本番との差分を計算し、検証合格時のみ公開し、公開後に変更URLだけをIndexNowへ通知します。

## 運用上の注意

- `reports/content-audit.json` の警告は、即時公開停止ではなく改善キューです。
- noindexからindexへ移す前に、一次検証、公式情報源、検索意図の重複、固有画像、内部リンクを確認します。
- `public/` は生成物です。記事本文は `content/` 側を修正します。
- IndexNowはクロール通知であり、検索結果への掲載を保証するものではありません。Google向け運用はサイトマップとSearch Consoleを主軸にします。
