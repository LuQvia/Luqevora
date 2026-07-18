import path from 'node:path';

const productNames = new Map(Object.entries({
  activecampaign: 'ActiveCampaign',
  getresponse: 'GetResponse',
  hubspot: 'HubSpot',
  semrush: 'Semrush',
  monday: 'monday.com',
  clickup: 'ClickUp',
  shopify: 'Shopify',
  hostinger: 'Hostinger',
  kinsta: 'Kinsta',
  'wp-engine': 'WP Engine',
  nordvpn: 'NordVPN',
  surfshark: 'Surfshark',
  cpi: 'CPI',
  'cpi-rental-server': 'CPI Rental Server',
  'xserver-business': 'XServer Business',
  'xserver-for-wordpress': 'XServer for WordPress',
  'conoha-wing-business': 'ConoHa WING Business',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  'microsoft-copilot': 'Microsoft Copilot',
  'wordpress-com': 'WordPress.com',
  woocommerce: 'WooCommerce',
  siteground: 'SiteGround',
  cloudways: 'Cloudways',
  ahrefs: 'Ahrefs',
  'se-ranking': 'SE Ranking',
  mailerlite: 'MailerLite',
  mailchimp: 'Mailchimp',
  brevo: 'Brevo',
  notion: 'Notion',
  asana: 'Asana',
  trello: 'Trello',
  airtable: 'Airtable',
  jira: 'Jira',
  wrike: 'Wrike'
}));

export function sourceFile(source = '') {
  return String(source).split('#')[0];
}

export function articlePath(article) {
  return `/${article.language}/${article.category}/${article.slug}/`;
}

export function languageNeutralPath(url = '') {
  try {
    return new URL(url).pathname.replace(/^\/(?:ja|en)\//, '/');
  } catch {
    return String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/(?:ja|en)\//, '/');
  }
}

function matchingPriorityProducts(slug, products) {
  return products.filter(product => slug === product || slug.startsWith(`${product}-`) || slug.endsWith(`-${product}`) || slug.includes(`-${product}-`));
}

export function buildIndexDecisions(entries, legacyManifest, seoConfig) {
  const indexing = seoConfig.indexing || {};
  const legacyPaths = new Set((legacyManifest || []).map(item => languageNeutralPath(item.canonical || '')).filter(Boolean));
  const selectedTranslationKeys = new Set();
  const initialReasons = new Map();

  for (const entry of entries) {
    const article = entry.article;
    const reasons = [];
    const neutral = languageNeutralPath(articlePath(article));
    const file = sourceFile(entry.source);
    const productMatches = matchingPriorityProducts(article.slug, indexing.priorityProducts || []);

    if (indexing.mode === 'all') reasons.push('all');
    if (indexing.includeLegacyRoutes && legacyPaths.has(neutral)) reasons.push('existing-live-route');
    if ((indexing.includeSourceFiles || []).includes(file)) reasons.push('priority-source');
    if (indexing.includePriorityReviews && article.type === 'review' && productMatches.length) reasons.push('priority-review');
    if (article.type === 'comparison' && productMatches.length >= (indexing.priorityComparisonMinimumMatches || 2)) reasons.push('priority-comparison');

    if (reasons.length) selectedTranslationKeys.add(article.translationKey);
    initialReasons.set(article.id, reasons);
  }

  const decisions = new Map();
  for (const entry of entries) {
    const article = entry.article;
    const reasons = [...(initialReasons.get(article.id) || [])];
    if (indexing.ensureTranslationParity && selectedTranslationKeys.has(article.translationKey) && !reasons.length) reasons.push('translation-pair');
    decisions.set(article.id, {indexable: reasons.length > 0, reasons});
  }
  return decisions;
}

export function normalizeTopic(topicId, topics) {
  return topics.find(topic => topic.id === topicId || (topic.aliases || []).includes(topicId)) || null;
}

function displayProduct(value) {
  if (productNames.has(value)) return productNames.get(value);
  return value.split('-').map(word => word ? `${word[0].toUpperCase()}${word.slice(1)}` : '').join(' ');
}

export function slugDisplayTitle(slug) {
  if (slug.includes('-vs-')) return slug.split('-vs-').map(displayProduct).join(' vs ');
  const suffixes = [
    ['-pricing-guide', 'Pricing Guide'],
    ['-alternatives', 'Alternatives'],
    ['-for-small-business', 'for Small Business'],
    ['-for-remote-teams', 'for Remote Teams'],
    ['-for-agencies', 'for Agencies'],
    ['-for-ecommerce', 'for Ecommerce'],
    ['-for-creators', 'for Creators'],
    ['-review', 'Review'],
    ['-guide', 'Guide']
  ];
  for (const [suffix, label] of suffixes) {
    if (slug.endsWith(suffix)) return `${displayProduct(slug.slice(0, -suffix.length))} ${label}`;
  }
  return displayProduct(slug);
}

function softTrim(value, limit, language) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!limit || text.length <= limit) return text;
  const slice = text.slice(0, limit + 1);
  const boundaries = language === 'ja' ? ['。', '！', '？', '、'] : ['. ', '! ', '? ', '; ', ': ', ', '];
  let cut = -1;
  for (const boundary of boundaries) cut = Math.max(cut, slice.lastIndexOf(boundary));
  if (cut >= Math.floor(limit * 0.68)) return slice.slice(0, cut + (language === 'ja' ? 1 : 0)).trim();
  return `${text.slice(0, limit - 1).trim()}…`;
}

export function seoMetaTitle(article, seoConfig) {
  const language = article.language;
  const limit = seoConfig.metadata?.titleSoftLimit?.[language] || 70;
  const current = String(article.metaTitle || article.title || '').trim();
  if (current.length <= limit) return current;
  const display = slugDisplayTitle(article.slug);
  let candidate = current;
  if (article.slug.includes('-vs-')) {
    candidate = language === 'ja' ? `${display.replace(' vs ', 'と')}を比較｜料金・機能・選び方` : `${display}: Pricing, Features & Fit`;
  } else if (article.slug.endsWith('-pricing-guide')) {
    candidate = language === 'ja' ? `${display.replace(' Pricing Guide', '')}の料金｜プラン・総額・上限` : `${display}: Plans, Costs & Limits`;
  } else if (article.slug.endsWith('-alternatives')) {
    candidate = language === 'ja' ? `${display.replace(' Alternatives', '')}の代替候補｜用途・料金を比較` : `${display}: Pricing & Best-Fit Options`;
  } else if (article.type === 'review') {
    candidate = language === 'ja' ? `${display.replace(' Review', '')}レビュー｜料金・機能・注意点` : `${display}: Pricing, Features & Limits`;
  }
  return softTrim(candidate, limit, language);
}

export function seoDescription(article, seoConfig) {
  const language = article.language;
  const limit = seoConfig.metadata?.descriptionSoftLimit?.[language] || 170;
  return softTrim(article.description, limit, language);
}

export function articleImagePath(article, seoConfig) {
  const base = String(seoConfig.images?.publicDirectory || '/assets/images/articles').replace(/\/$/, '');
  const extension = seoConfig.images?.format || 'png';
  return `${base}/${article.language}/${article.category}/${article.slug}.${extension}`;
}

export function deterministicNumber(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function productTokens(slug, priorityProducts) {
  const known = [...new Set([...priorityProducts, ...productNames.keys()])].sort((a, b) => b.length - a.length);
  return known.filter(token => slug === token || slug.startsWith(`${token}-`) || slug.endsWith(`-${token}`) || slug.includes(`-${token}-`));
}

export function buildRelatedGraph(articles, indexableIds, seoConfig) {
  const desired = seoConfig.relatedArticles?.count || 5;
  const eligible = articles.filter(article => indexableIds.has(article.id));
  const byUrl = new Map(eligible.map(article => [articlePath(article), article]));
  const graph = new Map(eligible.map(article => [article.id, []]));
  const inbound = new Map(eligible.map(article => [article.id, 0]));
  const priorityProducts = seoConfig.indexing?.priorityProducts || [];

  for (const article of eligible) {
    const selected = graph.get(article.id);
    for (const link of article.relatedLinks || []) {
      const target = byUrl.get(link.url);
      if (!target || target.id === article.id || selected.some(item => item.id === target.id)) continue;
      selected.push(target);
      inbound.set(target.id, (inbound.get(target.id) || 0) + 1);
      if (selected.length >= desired) break;
    }
  }

  const sourceOrder = [...eligible].sort((a, b) => deterministicNumber(a.id) - deterministicNumber(b.id));
  for (let slot = 0; slot < desired; slot += 1) {
    for (const article of sourceOrder) {
      const selected = graph.get(article.id);
      if (selected.length > slot) continue;
      const sourceProducts = productTokens(article.slug, priorityProducts);
      const candidates = eligible
        .filter(candidate => candidate.id !== article.id && candidate.language === article.language && !selected.some(item => item.id === candidate.id))
        .map(candidate => {
          const targetProducts = productTokens(candidate.slug, priorityProducts);
          const sharedProducts = sourceProducts.filter(product => targetProducts.includes(product)).length;
          let score = 0;
          if (candidate.topic && candidate.topic === article.topic) score += 120;
          if (candidate.category === article.category) score += 45;
          score += sharedProducts * 95;
          if (candidate.type !== article.type) score += 18;
          if (candidate.translationKey === article.translationKey) score -= 500;
          score -= (inbound.get(candidate.id) || 0) * 7;
          score += (deterministicNumber(`${article.id}:${candidate.id}`) % 1000) / 1000;
          return {candidate, score};
        })
        .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title));
      const winner = candidates[0]?.candidate;
      if (!winner) continue;
      selected.push(winner);
      inbound.set(winner.id, (inbound.get(winner.id) || 0) + 1);
    }
  }
  return {graph, inbound};
}

export function sourceAssetPath(root, article, seoConfig) {
  const extension = seoConfig.images?.format || 'png';
  return path.join(root, seoConfig.images?.sourceDirectory || 'source-assets/images/articles', article.language, article.category, `${article.slug}.${extension}`);
}
