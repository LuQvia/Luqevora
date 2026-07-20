import path from 'node:path';
import {root, readJson, writeFile} from './lib.mjs';
import {loadArticleEntries} from './load-articles.mjs';

const profileFiles = [
  'content/article-batches/product-profiles.json',
  'content/article-batches/product-profiles-expansion.json'
];
const merged = {};
for (const relative of profileFiles) Object.assign(merged, await readJson(path.join(root, relative)));
const entries = await loadArticleEntries();
const articles = entries.map(entry => entry.article).filter(article => article.status === 'published');
const categories = await readJson(path.join(root, 'content/config/categories.json'));
const topics = await readJson(path.join(root, 'content/config/topics.json'));
const site = await readJson(path.join(root, 'content/config/site.json'));

const normalize = value => String(value || '').toLowerCase().normalize('NFKC').replace(/[^a-z0-9\p{L}]+/gu, ' ').trim();
const tokens = value => normalize(value).split(/\s+/).filter(token => token.length >= 3);
const hasAny = (text, patterns) => patterns.some(pattern => text.includes(pattern));

function relatedArticles(id, profile) {
  const candidates = new Set([...tokens(id), ...tokens(profile.name)]);
  return articles
    .map(article => {
      const haystack = normalize(`${article.slug} ${article.title} ${article.description || ''}`);
      const score = [...candidates].reduce((total, token) => total + (haystack.includes(token) ? 1 : 0), 0);
      return {article, score};
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
    .slice(0, 12)
    .map(({article}) => ({
      language: article.language,
      type: article.type,
      title: article.title,
      url: `/${article.language}/${article.category}/${article.slug}/`,
      category: article.category,
      topic: article.topic || ''
    }));
}

function majority(items, fallback) {
  const counts = new Map();
  for (const item of items.filter(Boolean)) counts.set(item, (counts.get(item) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || fallback;
}

const products = Object.entries(merged).map(([id, profile]) => {
  const related = relatedArticles(id, profile);
  const category = profile.category || majority(related.map(item => item.category), 'business-software');
  const topic = profile.topic || majority(related.map(item => item.topic), topics.find(item => item.category === category)?.id || '');
  const corpus = normalize(JSON.stringify(profile));
  const flags = {
    freeOption: hasAny(corpus, ['無料', 'free tier', 'free plan', 'free access', '無料版', '無料利用']),
    business: hasAny(corpus, ['法人', 'business', 'enterprise', 'team', '組織', 'チーム']),
    ecommerce: hasAny(corpus, ['ec ', 'ecommerce', 'ネットショップ', 'shopify', 'woocommerce', '商品販売']),
    wordpress: hasAny(corpus, ['wordpress', 'ワードプレス']),
    seo: hasAny(corpus, ['seo', '検索エンジン']),
    integrations: hasAny(corpus, ['連携', 'integration', 'connector', 'api']),
    mobile: hasAny(corpus, ['スマートフォン', 'mobile', 'ipad', 'android', 'ios'])
  };
  const pricingModel = hasAny(corpus, ['無料版', 'free tier', 'free plan', '無料利用'])
    ? 'freemium'
    : hasAny(corpus, ['従量', 'usage based', 'pay as you go']) ? 'usage'
    : hasAny(corpus, ['月額', '年額', 'subscription', 'per month', 'monthly']) ? 'subscription'
    : 'contact-or-variable';
  return {
    id,
    name: profile.name,
    affiliateKey: profile.affiliateKey || '',
    category,
    categoryName: Object.fromEntries(categories.map(item => [item.id, item.name]))[category] || {ja: category, en: category},
    topic,
    positioning: profile.positioning || {ja: '', en: ''},
    pricing: profile.pricing || {ja: '', en: ''},
    pricingDetail: profile.pricingDetail || {ja: '', en: ''},
    pricingModel,
    workflow: profile.workflow || {ja: '', en: ''},
    bestFor: profile.bestFor || {ja: '', en: ''},
    strengths: profile.strengths || {ja: [], en: []},
    limits: profile.limits || {ja: [], en: []},
    flags,
    sources: profile.sources || [],
    relatedArticles: related,
    lastVerified: site.defaultVerifiedAt
  };
}).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

const output = {
  schemaVersion: '1.0.0',
  generatedAt: new Date().toISOString(),
  lastVerified: site.defaultVerifiedAt,
  sourceFiles: profileFiles,
  productCount: products.length,
  fields: {
    pricing: 'Current pricing summary. Verify exact amounts on official sources before publication.',
    flags: 'Text-supported capability indicators, not performance scores.',
    relatedArticles: 'Automatically matched published Luqevora articles.'
  },
  products
};
await writeFile(path.join(root, 'content/products/catalog.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated comparison catalog with ${products.length} products.`);
