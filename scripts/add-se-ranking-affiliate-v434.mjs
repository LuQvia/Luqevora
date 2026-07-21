import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const verifiedAt = '2026-07-21';
const affiliateId = '5202722';

const links = {
  'se-ranking-en-home': ['en', 'https://seranking.com/', 'https://seranking.com/?ga=5202722&source=link'],
  'se-ranking-en-pricing': ['en', 'https://seranking.com/subscription.html', 'https://seranking.com/subscription.html?ga=5202722&source=link'],
  'se-ranking-en-features': ['en', 'https://seranking.com/features.html', 'https://seranking.com/features.html?ga=5202722&source=link'],
  'se-ranking-en-competitor-research': ['en', 'https://seranking.com/competitor-traffic-research.html', 'https://seranking.com/competitor-traffic-research.html?ga=5202722&source=link'],
  'se-ranking-en-position-tracking': ['en', 'https://seranking.com/position-tracking.html', 'https://seranking.com/position-tracking.html?ga=5202722&source=link'],
  'se-ranking-en-keyword-research': ['en', 'https://seranking.com/keyword-suggestion-tool.html', 'https://seranking.com/keyword-suggestion-tool.html?ga=5202722&source=link'],
  'se-ranking-en-registration': ['en', 'https://seranking.com/sign-up.html', 'https://seranking.com/sign-up.html?ga=5202722&source=link'],
  'se-ranking-en-on-page': ['en', 'https://seranking.com/on-page-checker.html', 'https://seranking.com/on-page-checker.html?ga=5202722&source=link'],
  'se-ranking-en-easy-to-use': ['en', 'https://seranking.com/easy-to-use.html', 'https://seranking.com/easy-to-use.html?ga=5202722&source=link'],
  'se-ranking-ja-pricing': ['ja', 'https://seranking.com/jp/subscription.html', 'https://seranking.com/jp/subscription.html?ga=5202722&source=link'],
  'se-ranking-ja-competitor-research': ['ja', 'https://seranking.com/jp/competitor-traffic-research.html', 'https://seranking.com/jp/competitor-traffic-research.html?ga=5202722&source=link'],
  'se-ranking-ja-website-audit': ['ja', 'https://seranking.com/jp/website-audit.html', 'https://seranking.com/jp/website-audit.html?ga=5202722&source=link'],
  'se-ranking-ja-position-tracking': ['ja', 'https://seranking.com/jp/position-tracking.html', 'https://seranking.com/jp/position-tracking.html?ga=5202722&source=link'],
  'se-ranking-ja-home': ['ja', 'https://seranking.com/jp/', 'https://seranking.com/jp/?ga=5202722&source=link'],
  'se-ranking-ja-features': ['ja', 'https://seranking.com/jp/features.html', 'https://seranking.com/jp/features.html?ga=5202722&source=link'],
  'se-ranking-ja-backlink-checker': ['ja', 'https://seranking.com/jp/backlink-checker.html', 'https://seranking.com/jp/backlink-checker.html?ga=5202722&source=link']
};

async function readJson(relative) {
  return JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));
}
async function writeJson(relative, value) {
  await fs.writeFile(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
}

const affiliatesPath = 'content/config/affiliates.json';
const affiliates = await readJson(affiliatesPath);
for (const [key, [language, destination, url]] of Object.entries(links)) {
  affiliates.links[key] = {
    type: 'url',
    network: 'SE Ranking Affiliate Program',
    programType: 'affiliate',
    programId: affiliateId,
    language,
    destination,
    url,
    verifiedAt
  };
}
await writeJson(affiliatesPath, affiliates);

const profilesPath = 'content/article-batches/product-profiles.json';
const profiles = await readJson(profilesPath);
const profile = profiles['se-ranking'];
if (!profile) throw new Error('SE Ranking product profile was not found.');
profile.affiliateKeyByLanguage = {
  ja: 'se-ranking-ja-pricing',
  en: 'se-ranking-en-pricing'
};
profile.ctaUrlByLanguage = {
  ja: 'https://seranking.com/jp/subscription.html',
  en: 'https://seranking.com/subscription.html'
};
profile.affiliateProgram = {
  network: 'SE Ranking Affiliate Program',
  programId: affiliateId,
  verifiedAt
};
await writeJson(profilesPath, profiles);

function affiliateAnchor({href, key, label}) {
  return `<a class="article-cta-link" data-link-position="article-cta" href="${href.replaceAll('&', '&amp;')}" rel="sponsored nofollow noopener" target="_blank" data-affiliate-key="${key}" data-affiliate-link="true" data-affiliate-product="se-ranking">${label}<span aria-hidden="true"> →</span></a>`;
}

function ctaPanel(language, linksForPanel, note) {
  const title = language === 'ja' ? 'SE Rankingの最新条件を公式画面で確認' : 'Check current SE Ranking terms on the official site';
  return `<aside id="se-ranking-affiliate-offer" aria-label="${title}" class="article-cta-panel" data-se-ranking-affiliate="true"><strong>${title}</strong><div class="article-cta-links">${linksForPanel.map(affiliateAnchor).join('')}</div><p>${note}</p></aside>`;
}

function disclosure(language) {
  return language === 'ja'
    ? '<div class="editorial-note disclosure-note"><p><strong>広告・アフィリエイト開示：</strong>本記事にはSE Rankingのアフィリエイトリンクが含まれます。リンク経由で申込みが成立した場合、運営者が報酬を受け取ることがあります。読者の支払額は通常変わりません。掲載条件と評価方針は<a href="/ja/affiliate-disclosure/">広告掲載方針</a>をご確認ください。</p></div>'
    : '<div class="editorial-note disclosure-note"><p><strong>Affiliate disclosure:</strong> This article contains SE Ranking affiliate links. The operator may receive a commission if an eligible signup or purchase is completed through a link, generally without changing the customer price. See the <a href="/en/affiliate-disclosure/">Affiliate Disclosure</a> for the editorial policy.</p></div>';
}

function updateDates(html, language) {
  html = html.replace(/<meta content="2026-07-16" property="article:modified_time"\/>/, '<meta content="2026-07-21" property="article:modified_time"/>');
  html = html.replace(/"dateModified":"2026-07-16"/g, '"dateModified":"2026-07-21"');
  if (language === 'ja') {
    html = html.replace('公開・確認日：2026-07-16', '公開日：2026-07-16・更新確認日：2026-07-21');
    html = html.replace('公開・最終確認：2026-07-16', '公開日：2026-07-16・更新確認日：2026-07-21');
    html = html.replace('最終確認: 2026/07/16', '最終確認: 2026/07/21');
    html = html.replace('情報確認日：2026-07-16。', '情報確認日：2026-07-21。');
  } else {
    html = html.replace('Published and verified: 2026-07-16', 'Published: 2026-07-16 · Updated and verified: 2026-07-21');
    html = html.replace('Verified: 2026-07-16', 'Verified: 2026-07-21');
    html = html.replace('Information checked: 2026-07-16.', 'Information checked: 2026-07-21.');
  }
  if (!html.includes('name="luqevora-affiliate-program"')) {
    html = html.replace('</head>', '<meta name="luqevora-affiliate-program" content="SE Ranking Affiliate Program">\n</head>');
  }
  return html;
}

async function patchReview(language) {
  const relative = `legacy/${language}/seo-marketing/se-ranking-review/index.html`;
  let html = await fs.readFile(path.join(root, relative), 'utf8');
  html = updateDates(html, language);
  html = html.replace(/<div class="editorial-note disclosure-note">[\s\S]*?<\/div>/, disclosure(language));
  if (!html.includes('id="se-ranking-affiliate-offer"')) {
    const panel = language === 'ja'
      ? ctaPanel('ja', [
          {href: links['se-ranking-ja-pricing'][2], key: 'se-ranking-ja-pricing', label: '料金と14日間無料トライアルを確認'},
          {href: links['se-ranking-ja-features'][2], key: 'se-ranking-ja-features', label: 'SE Rankingの機能を確認'},
          {href: links['se-ranking-ja-position-tracking'][2], key: 'se-ranking-ja-position-tracking', label: '順位チェック機能を確認'}
        ], '料金、プラン上限、無料トライアル、追加機能は変更されるため、申込み直前に公式画面を確認してください。')
      : ctaPanel('en', [
          {href: links['se-ranking-en-registration'][2], key: 'se-ranking-en-registration', label: 'Start the 14-day free trial'},
          {href: links['se-ranking-en-pricing'][2], key: 'se-ranking-en-pricing', label: 'Check current pricing'},
          {href: links['se-ranking-en-features'][2], key: 'se-ranking-en-features', label: 'Explore SE Ranking features'}
        ], 'Pricing, plan limits, trial terms, and add-ons can change. Verify the official signup and pricing screens immediately before purchase.');
    const marker = '<p class="back-link">';
    html = html.replace(marker, `${panel}${marker}`);
  }
  await fs.writeFile(path.join(root, relative), html);
}

async function patchComparison(language) {
  const relative = `legacy/${language}/seo-marketing/seo-tools-small-business/index.html`;
  let html = await fs.readFile(path.join(root, relative), 'utf8');
  html = updateDates(html, language);
  html = html.replace(/<div class="editorial-note disclosure-note">[\s\S]*?<\/div>/, disclosure(language));
  if (!html.includes('id="se-ranking-affiliate-offer"')) {
    const panel = language === 'ja'
      ? ctaPanel('ja', [
          {href: links['se-ranking-ja-pricing'][2], key: 'se-ranking-ja-pricing', label: 'SE Rankingの料金を確認'},
          {href: links['se-ranking-ja-home'][2], key: 'se-ranking-ja-home', label: 'SE Rankingを公式サイトで確認'}
        ], '比較表だけで決めず、実際のプロジェクト数、キーワード数、更新頻度、AI検索、レポート要件を14日間の試用で確認してください。')
      : ctaPanel('en', [
          {href: links['se-ranking-en-registration'][2], key: 'se-ranking-en-registration', label: 'Try SE Ranking free for 14 days'},
          {href: links['se-ranking-en-pricing'][2], key: 'se-ranking-en-pricing', label: 'Compare SE Ranking plans'}
        ], 'Do not decide from the comparison table alone. Test your project count, keyword volume, update frequency, AI-search needs, and reporting workflow during the trial.');
    const marker = language === 'ja'
      ? '<p class="article-link"><a href="/ja/seo-marketing/se-ranking-review/">SE Rankingの詳細レビューを見る →</a></p></div>'
      : '<p class="article-link"><a href="/en/seo-marketing/se-ranking-review/">Read the detailed SE Ranking review →</a></p></div>';
    if (!html.includes(marker)) throw new Error(`Comparison insertion marker not found: ${relative}`);
    html = html.replace(marker, `${marker}${panel}`);
  }
  await fs.writeFile(path.join(root, relative), html);
}

await patchReview('en');
await patchReview('ja');
await patchComparison('en');
await patchComparison('ja');

console.log(`Configured ${Object.keys(links).length} SE Ranking affiliate links and patched four priority legacy pages.`);
