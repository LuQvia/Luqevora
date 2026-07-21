import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const affiliates = JSON.parse(await fs.readFile(path.join(root, 'content/config/affiliates.json'), 'utf8'));
const profiles = JSON.parse(await fs.readFile(path.join(root, 'content/article-batches/product-profiles.json'), 'utf8'));
const expected = {
  'se-ranking-en-home': 'https://seranking.com/?ga=5202722&source=link',
  'se-ranking-en-pricing': 'https://seranking.com/subscription.html?ga=5202722&source=link',
  'se-ranking-en-features': 'https://seranking.com/features.html?ga=5202722&source=link',
  'se-ranking-en-competitor-research': 'https://seranking.com/competitor-traffic-research.html?ga=5202722&source=link',
  'se-ranking-en-position-tracking': 'https://seranking.com/position-tracking.html?ga=5202722&source=link',
  'se-ranking-en-keyword-research': 'https://seranking.com/keyword-suggestion-tool.html?ga=5202722&source=link',
  'se-ranking-en-registration': 'https://seranking.com/sign-up.html?ga=5202722&source=link',
  'se-ranking-en-on-page': 'https://seranking.com/on-page-checker.html?ga=5202722&source=link',
  'se-ranking-en-easy-to-use': 'https://seranking.com/easy-to-use.html?ga=5202722&source=link',
  'se-ranking-ja-pricing': 'https://seranking.com/jp/subscription.html?ga=5202722&source=link',
  'se-ranking-ja-competitor-research': 'https://seranking.com/jp/competitor-traffic-research.html?ga=5202722&source=link',
  'se-ranking-ja-website-audit': 'https://seranking.com/jp/website-audit.html?ga=5202722&source=link',
  'se-ranking-ja-position-tracking': 'https://seranking.com/jp/position-tracking.html?ga=5202722&source=link',
  'se-ranking-ja-home': 'https://seranking.com/jp/?ga=5202722&source=link',
  'se-ranking-ja-features': 'https://seranking.com/jp/features.html?ga=5202722&source=link',
  'se-ranking-ja-backlink-checker': 'https://seranking.com/jp/backlink-checker.html?ga=5202722&source=link'
};

const assertions = [];
function check(name, condition, details = '') {
  assertions.push({name, passed: Boolean(condition), details});
}

for (const [key, url] of Object.entries(expected)) {
  const entry = affiliates.links?.[key];
  check(`affiliate:${key}:exists`, Boolean(entry), entry ? '' : 'missing');
  check(`affiliate:${key}:url`, entry?.url === url, entry?.url || 'missing');
  check(`affiliate:${key}:program`, entry?.programId === '5202722' && entry?.network === 'SE Ranking Affiliate Program', JSON.stringify(entry || {}));
}
check('profile:en-key', profiles['se-ranking']?.affiliateKeyByLanguage?.en === 'se-ranking-en-pricing');
check('profile:ja-key', profiles['se-ranking']?.affiliateKeyByLanguage?.ja === 'se-ranking-ja-pricing');

async function readPublic(relative) {
  return fs.readFile(path.join(publicRoot, relative), 'utf8');
}
const priorityPages = {
  'en-review': 'en/seo-marketing/se-ranking-review/index.html',
  'ja-review': 'ja/seo-marketing/se-ranking-review/index.html',
  'en-tools': 'en/seo-marketing/seo-tools-small-business/index.html',
  'ja-tools': 'ja/seo-marketing/seo-tools-small-business/index.html',
  'en-semrush-vs': 'en/seo-marketing/semrush-vs-se-ranking/index.html',
  'ja-semrush-vs': 'ja/seo-marketing/semrush-vs-se-ranking/index.html',
  'en-ahrefs-vs': 'en/seo-marketing/ahrefs-vs-se-ranking/index.html',
  'ja-ahrefs-vs': 'ja/seo-marketing/ahrefs-vs-se-ranking/index.html'
};
for (const [name, relative] of Object.entries(priorityPages)) {
  const html = await readPublic(relative);
  check(`${name}:affiliate-id`, html.includes('ga=5202722') || html.includes('ga=5202722&amp;source=link'));
  check(`${name}:sponsored-rel`, html.includes('rel="sponsored nofollow noopener"'));
  check(`${name}:disclosure`, /affiliate disclosure|広告・アフィリエイト|広告リンク/i.test(html));
  check(`${name}:no-duplicate-jp`, !html.includes('/jp/jp/'));
}

async function walk(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) result.push(full);
  }
  return result;
}
const htmlFiles = await walk(publicRoot);
let affiliateOccurrences = 0;
let affectedPages = 0;
let duplicateJp = 0;
let wrongParameter = 0;
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const matches = html.match(/seranking\.com\/[^"'<>\s]*ga=5202722(?:&amp;|&)source=link/g) || [];
  if (matches.length) {
    affiliateOccurrences += matches.length;
    affectedPages += 1;
  }
  if (html.includes('seranking.com/jp/jp/')) duplicateJp += 1;
  if (/seranking\.com\/[^"'<>\s]*ga=(?!5202722)/.test(html)) wrongParameter += 1;
}
check('site:affiliate-occurrences', affiliateOccurrences >= 18, String(affiliateOccurrences));
check('site:affected-pages', affectedPages >= 10, String(affectedPages));
check('site:no-jp-jp', duplicateJp === 0, String(duplicateJp));
check('site:no-wrong-affiliate-id', wrongParameter === 0, String(wrongParameter));

const failed = assertions.filter(item => !item.passed);
const report = {
  version: '4.3.4',
  generatedAt: new Date().toISOString(),
  summary: {
    passed: assertions.length - failed.length,
    failed: failed.length,
    total: assertions.length,
    configuredLinks: Object.keys(expected).length,
    affiliateOccurrences,
    affectedPages
  },
  assertions
};
await fs.mkdir(path.join(root, 'reports'), {recursive: true});
await fs.writeFile(path.join(root, 'reports/v4.3.4-se-ranking-affiliate-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(JSON.stringify({summary: report.summary, failed}, null, 2));
  process.exit(1);
}
console.log(`SE Ranking affiliate QA passed: ${report.summary.passed}/${report.summary.total}; ${affectedPages} pages; ${affiliateOccurrences} tracked links.`);
