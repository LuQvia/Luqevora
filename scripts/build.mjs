import fs from 'node:fs/promises';
import path from 'node:path';
import {root, readJson, writeFile, walk, render, esc, urlPath} from './lib.mjs';
import {loadArticleEntries} from './load-articles.mjs';
import {
  articleImagePath,
  buildIndexDecisions,
  buildRelatedGraph,
  normalizeTopic,
  seoDescription,
  seoMetaTitle
} from './seo.mjs';

const site = await readJson(path.join(root, 'content/config/site.json'));
const categories = await readJson(path.join(root, 'content/config/categories.json'));
const navigation = await readJson(path.join(root, 'content/config/navigation.json'));
const affiliates = await readJson(path.join(root, 'content/config/affiliates.json'));
const homeConfig = await readJson(path.join(root, 'content/config/home.json'));
const seoConfig = await readJson(path.join(root, 'content/config/seo.json'));
const topics = await readJson(path.join(root, 'content/config/topics.json'));
const legacyManifest = await readJson(path.join(root, 'content/legacy-manifest.json'));
const indexNow = await readJson(path.join(root, 'content/config/indexnow.json'));
const outputRoot = path.join(root, site.outputDirectory);
const legacyRoot = path.join(root, 'legacy');

const templates = {
  article: await fs.readFile(path.join(root, 'templates/pages/article.html'), 'utf8'),
  articles: await fs.readFile(path.join(root, 'templates/pages/articles.html'), 'utf8'),
  categoryDirectory: await fs.readFile(path.join(root, 'templates/pages/category-directory.html'), 'utf8'),
  homeDirectory: await fs.readFile(path.join(root, 'templates/pages/home-directory.html'), 'utf8'),
  topics: await fs.readFile(path.join(root, 'templates/pages/topics.html'), 'utf8'),
  topic: await fs.readFile(path.join(root, 'templates/pages/topic.html'), 'utf8'),
  header: await fs.readFile(path.join(root, 'templates/partials/header.html'), 'utf8'),
  footer: await fs.readFile(path.join(root, 'templates/partials/footer.html'), 'utf8')
};

const articleEntries = await loadArticleEntries();
const articles = articleEntries.map(entry => entry.article).filter(article => article.status === 'published');
articles.sort((a, b) => a.language.localeCompare(b.language) || a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug));
const indexDecisions = buildIndexDecisions(articleEntries, legacyManifest, seoConfig);
const indexableIds = new Set(articles.filter(article => indexDecisions.get(article.id)?.indexable).map(article => article.id));
const {graph: relatedGraph, inbound: relatedInbound} = buildRelatedGraph(articles, indexableIds, seoConfig);

function decodeHtml(value = '') {
  const named = {amp: '&', quot: '"', apos: "'", '#39': "'", lt: '<', gt: '>', nbsp: ' '};
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, key) => {
    const normalized = key.toLowerCase();
    if (normalized in named) return named[normalized];
    if (normalized.startsWith('#x')) return String.fromCodePoint(parseInt(normalized.slice(2), 16));
    if (normalized.startsWith('#')) return String.fromCodePoint(parseInt(normalized.slice(1), 10));
    return match;
  });
}

function plainText(value = '') {
  return decodeHtml(String(value).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match?.[2] || '';
}

function metaContent(html, key, value) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attribute(match[0], key).toLowerCase() === String(value).toLowerCase()) return decodeHtml(attribute(match[0], 'content'));
  }
  return '';
}

function replaceMetaContent(html, key, value, content) {
  return html.replace(/<meta\b[^>]*>/gi, tag => {
    if (attribute(tag, key).toLowerCase() !== String(value).toLowerCase()) return tag;
    const escaped = esc(content);
    if (/\bcontent\s*=\s*(["'])[\s\S]*?\1/i.test(tag)) {
      return tag.replace(/\bcontent\s*=\s*(["'])[\s\S]*?\1/i, `content="${escaped}"`);
    }
    return tag.replace(/>$/, ` content="${escaped}">`);
  });
}

function canonicalFrom(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attribute(match[0], 'rel').split(/\s+/).includes('canonical')) return decodeHtml(attribute(match[0], 'href'));
  }
  return '';
}

function isNoIndex(html) {
  return metaContent(html, 'name', 'robots').toLowerCase().split(/[\s,]+/).includes('noindex');
}

function formatDate(date, language) {
  const [year, month, day] = String(date).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return date;
  if (language === 'ja') return `${year}年${month}月${day}日`;
  return new Intl.DateTimeFormat('en', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'})
    .format(new Date(Date.UTC(year, month - 1, day)));
}

function currentLabel(language, japanese, english) {
  return language === 'ja' ? japanese : english;
}

function topicForArticle(article) {
  return normalizeTopic(article.topic, topics) || topics.find(topic => topic.category === article.category) || null;
}

function inferTopic(category, slug, rawTopic = '') {
  const configured = normalizeTopic(rawTopic, topics);
  if (configured) return configured;
  const value = String(slug).toLowerCase();
  if (category === 'ai-tools') {
    if (/(meeting|transcri|otter|fireflies|notta|tldv|fathom)/.test(value)) return topics.find(topic => topic.id === 'ai-meeting-notes');
    return topics.find(topic => topic.id === 'generative-ai');
  }
  if (category === 'website-builders') {
    if (/(shopify|woocommerce|ecommerce|ec-site)/.test(value)) return topics.find(topic => topic.id === 'ecommerce-platforms');
    return topics.find(topic => topic.id === 'website-builders');
  }
  if (category === 'seo-marketing') {
    if (/(affiliate|a8net|moshimo|blogging|monetiz)/.test(value)) return topics.find(topic => topic.id === 'affiliate-marketing');
    if (/(mail|email|activecampaign|getresponse|hubspot|brevo|kit-review)/.test(value)) return topics.find(topic => topic.id === 'email-marketing');
    return topics.find(topic => topic.id === 'seo-tools');
  }
  if (category === 'business-software') {
    if (/(project|task|asana|monday|clickup|trello|notion|airtable|jira|wrike)/.test(value)) return topics.find(topic => topic.id === 'project-management');
    return topics.find(topic => topic.id === 'team-collaboration');
  }
  if (category === 'hosting-security') {
    if (/(vpn|surfshark)/.test(value)) return topics.find(topic => topic.id === 'vpn-security');
    if (/(password|1password|bitwarden|keeper|nordpass|vault)/.test(value)) return topics.find(topic => topic.id === 'password-managers');
    return topics.find(topic => topic.id === 'web-hosting');
  }
  return topics.find(topic => topic.category === category) || null;
}

function header(language, currentCategory, alternateUrl) {
  const links = (navigation[language] || [])
    .filter(item => item.url !== `/${language}/`)
    .map(item => {
      const isCurrent = item.url === `/${language}/${currentCategory}/`;
      return `<a href="${esc(item.url)}"${isCurrent ? ' aria-current="page"' : ''}>${esc(item.label)}</a>`;
    });
  links.push(`<a href="/${language}/topics/"${currentCategory === 'topics' ? ' aria-current="page"' : ''}>${currentLabel(language, '目的別', 'Topics')}</a>`);
  links.push(`<a href="/${language}/articles/"${currentCategory === 'articles' ? ' aria-current="page"' : ''}>${currentLabel(language, '記事一覧', 'Articles')}</a>`);
  return render(templates.header, {
    lang: language,
    skipLabel: currentLabel(language, '本文へ移動', 'Skip to content'),
    menuLabel: currentLabel(language, 'メニューを開く', 'Open menu'),
    navLabel: currentLabel(language, 'メインナビゲーション', 'Primary navigation'),
    navigation: links.join(''),
    alternateUrl,
    alternateLang: language === 'ja' ? 'en' : 'ja',
    alternateLabel: language === 'ja' ? 'English' : '日本語'
  });
}

function footer(language) {
  const categoryLinks = categories.map(category => `<a href="/${language}/${category.path}/">${esc(category.name[language])}</a>`).join('');
  const info = language === 'ja'
    ? [
        ['目的別ガイド', 'topics'], ['記事一覧', 'articles'], ['運営者情報', 'about'], ['編集方針', 'editorial-policy'],
        ['広告掲載方針', 'affiliate-disclosure'], ['プライバシーポリシー', 'privacy'], ['利用規約', 'terms'], ['お問い合わせ', 'contact']
      ]
    : [
        ['Topic Guides', 'topics'], ['Articles', 'articles'], ['About', 'about'], ['Editorial Policy', 'editorial-policy'],
        ['Affiliate Disclosure', 'affiliate-disclosure'], ['Privacy', 'privacy'], ['Terms', 'terms'], ['Contact', 'contact']
      ];
  return render(templates.footer, {
    lang: language,
    year: new Date().getUTCFullYear(),
    footerDescription: currentLabel(language, 'AI・SaaS・Webサービスを公式情報を基準に整理し、より明確な意思決定を支援します。', 'We organize AI, SaaS, and web-service information using official sources to support clearer decisions.'),
    operatorLabel: currentLabel(language, '運営：LuQvia（個人事業）', 'Operated by LuQvia, an independent business in Japan'),
    footerTagline: currentLabel(language, 'より良いツール選びを、もっと分かりやすく。', 'Better tools. Clearer decisions.'),
    categoryTitle: currentLabel(language, 'カテゴリ', 'Categories'),
    informationTitle: currentLabel(language, '記事・運営', 'Information'),
    footerCategoryLinks: categoryLinks,
    footerInformationLinks: info.map(([label, slug]) => `<a href="/${language}/${slug}/">${esc(label)}</a>`).join(''),
    cookieSettingsLabel: currentLabel(language, 'Cookie設定', 'Cookie settings'),
    cookieAriaLabel: currentLabel(language, 'Cookie設定', 'Cookie preferences'),
    cookieText: currentLabel(language, '当サイトでは、利用状況の分析のためCookie等を使用する場合があります。', 'We may use cookies and similar technologies for analytics.'),
    cookieDetailsLabel: currentLabel(language, '詳しく見る', 'Learn more'),
    cookieDeclineLabel: currentLabel(language, '拒否する', 'Decline'),
    cookieAcceptLabel: currentLabel(language, '同意する', 'Accept')
  });
}

function localizedHreflang(suffix = '/') {
  const clean = suffix === '/' ? '' : String(suffix).replace(/^\/|\/$/g, '');
  const localized = language => `${site.baseUrl}/${language}/${clean ? `${clean}/` : ''}`;
  return [
    ...site.languages.map(language => `<link rel="alternate" hreflang="${language}" href="${localized(language)}">`),
    `<link rel="alternate" hreflang="x-default" href="${localized(site.defaultLanguage)}">`
  ].join('\n  ');
}

function hreflangFor(article) {
  const alternates = articles.filter(candidate => candidate.translationKey === article.translationKey);
  const links = alternates.map(candidate =>
    `<link rel="alternate" hreflang="${esc(candidate.language)}" href="${site.baseUrl}${urlPath(candidate.language, candidate.category, candidate.slug)}">`
  );
  const fallback = alternates.find(candidate => candidate.language === site.defaultLanguage) || article;
  links.push(`<link rel="alternate" hreflang="x-default" href="${site.baseUrl}${urlPath(fallback.language, fallback.category, fallback.slug)}">`);
  return links.join('\n  ');
}

function articleStructuredData(article, category, canonical, imageUrl, topic) {
  const graph = [
    {
      '@type': 'Organization', '@id': `${site.baseUrl}/#organization`, name: site.organization.name,
      url: site.organization.url, logo: {'@type': 'ImageObject', url: `${site.baseUrl}/assets/images/logo-icon.png`, width: 512, height: 512},
      email: 'info@luqevora.com', brand: {'@type': 'Brand', name: site.siteName}
    },
    {
      '@type': 'WebSite', '@id': `${site.baseUrl}/#website`, name: site.siteName, url: site.baseUrl,
      publisher: {'@id': `${site.baseUrl}/#organization`}, inLanguage: site.languages
    },
    {
      '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: article.title,
      description: article.description, isPartOf: {'@id': `${site.baseUrl}/#website`}, inLanguage: article.language,
      primaryImageOfPage: {'@id': `${canonical}#primaryimage`}
    },
    {
      '@type': 'ImageObject', '@id': `${canonical}#primaryimage`, url: imageUrl, contentUrl: imageUrl,
      width: seoConfig.images.width, height: seoConfig.images.height, caption: article.title, inLanguage: article.language
    },
    {
      '@type': ['Article', 'BlogPosting'], '@id': `${canonical}#article`, headline: article.title,
      description: article.description, datePublished: article.publishedAt, dateModified: article.updatedAt,
      mainEntityOfPage: {'@id': `${canonical}#webpage`}, author: {'@id': `${site.baseUrl}/#organization`},
      publisher: {'@id': `${site.baseUrl}/#organization`}, image: {'@id': `${canonical}#primaryimage`},
      articleSection: category.name[article.language], inLanguage: article.language,
      about: topic ? {'@type': 'Thing', name: topic.name[article.language]} : undefined
    },
    {
      '@type': 'BreadcrumbList', itemListElement: [
        {'@type': 'ListItem', position: 1, name: site.siteName, item: `${site.baseUrl}/${article.language}/`},
        {'@type': 'ListItem', position: 2, name: category.name[article.language], item: `${site.baseUrl}/${article.language}/${category.path}/`},
        {'@type': 'ListItem', position: 3, name: article.title, item: canonical}
      ]
    }
  ];
  if ((article.faqs || []).length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: article.faqs.map(item => ({
        '@type': 'Question', name: item.question, acceptedAnswer: {'@type': 'Answer', text: item.answer}
      }))
    });
  }
  return JSON.stringify({'@context': 'https://schema.org', '@graph': graph});
}

function configuredAffiliateEntry(key, language = '') {
  if (!key) return null;
  const entry = affiliates.links?.[key];
  if (!entry) return null;
  if (typeof entry === 'string') return {type: 'url', url: entry};
  if (entry.language && language && entry.language !== language) return null;
  return entry;
}

function validatedRawAffiliateHtml(entry, key) {
  const raw = String(entry?.rawHtml || '');
  if (!raw) throw new Error(`${key}: raw affiliate material is empty`);
  if (/<script\b|javascript:|\son[a-z]+\s*=/i.test(raw)) throw new Error(`${key}: unsafe markup in raw affiliate material`);
  if (!/<a\b[^>]*href=["']https:\/\/px\.a8\.net\/svt\/ejp\?[^"']+["'][^>]*rel=["'][^"']*nofollow[^"']*["'][^>]*>/i.test(raw)) {
    throw new Error(`${key}: A8 affiliate anchor or nofollow attribute is missing`);
  }
  if (!/<img\b[^>]*src=["']https:\/\/www\d+\.a8\.net\/0\.gif\?[^"']+["'][^>]*>/i.test(raw)) {
    throw new Error(`${key}: A8 tracking pixel is missing`);
  }
  return raw;
}

function renderSection(section, index) {
  const paragraphs = (section.body || []).map(paragraph => `<p>${esc(paragraph)}</p>`).join('');
  const bullets = (section.bullets || []).length
    ? `<ul class="fact-list">${section.bullets.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`
    : '';
  const table = section.table
    ? `<div class="table-scroll"><table class="comparison-table review-table"><thead><tr>${section.table.headers.map(item => `<th scope="col">${esc(item)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map(row => `<tr>${row.map((cell, cellIndex) => `<td${cellIndex === 0 ? ' class="tool-name"' : ''}>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    : '';
  const callout = section.callout ? `<div class="notice">${esc(section.callout)}</div>` : '';
  return `<section id="section-${index + 1}"><h2>${esc(section.heading)}</h2>${paragraphs}${table}${bullets}${callout}</section>`;
}

function renderArticleCtas(article) {
  let hasAffiliate = false;
  const links = (article.ctas || []).map(cta => {
    const entry = configuredAffiliateEntry(cta.affiliateKey, article.language);
    if (entry?.type === 'rawHtml') {
      hasAffiliate = true;
      const material = validatedRawAffiliateHtml(entry, cta.affiliateKey);
      return `<span class="article-cta-material" data-affiliate-key="${esc(cta.affiliateKey)}" data-affiliate-position="article-cta">${material}</span>`;
    }
    const affiliateUrl = entry?.url || '';
    const isAffiliate = Boolean(affiliateUrl);
    hasAffiliate ||= isAffiliate;
    const href = affiliateUrl || cta.officialUrl;
    const rel = isAffiliate ? affiliates.rules.defaultRel : 'noopener noreferrer';
    const attributes = isAffiliate ? `data-affiliate-key="${esc(cta.affiliateKey)}" data-affiliate-link="true"` : 'data-official-link="true"';
    return `<a class="article-cta-link" data-link-position="article-cta" href="${esc(href)}" rel="${esc(rel)}" target="${esc(affiliates.rules.externalTarget || '_blank')}" ${attributes}>${esc(cta.label)}<span aria-hidden="true"> →</span></a>`;
  }).join('');
  if (!links) return {html: '', hasAffiliate};
  const title = currentLabel(article.language, '公式ページで最新条件を確認', 'Check current terms on the official site');
  const note = currentLabel(article.language, '料金、割引、対象機能、契約期間は変更されるため、申込画面の表示を優先してください。', 'Prices, discounts, included features, and billing terms can change. Rely on the checkout page before purchase.');
  return {
    html: `<aside aria-label="${esc(title)}" class="article-cta-panel"><strong>${esc(title)}</strong><div class="article-cta-links">${links}</div><p>${esc(note)}</p></aside>`,
    hasAffiliate
  };
}

function decisionSummary(article) {
  const conclusion = article.sections?.[0]?.body?.[0] || article.lead || article.description;
  const points = [...new Set((article.sections || []).flatMap(section => section.bullets || []))].slice(0, 3);
  const title = currentLabel(article.language, '先に結論', 'Decision summary');
  const list = points.length ? `<ul>${points.map(point => `<li>${esc(point)}</li>`).join('')}</ul>` : '';
  return `<section class="decision-summary" id="decision-summary"><span class="eyebrow">${esc(currentLabel(article.language, '判断の要点', 'Key decision'))}</span><h2>${esc(title)}</h2><p>${esc(conclusion)}</p>${list}</section>`;
}

function evidencePanel(article, topic) {
  const sourceCount = (article.sources || []).length;
  const verified = formatDate(article.verifiedAt, article.language);
  const topicLink = topic ? `<a href="/${article.language}/topics/${topic.id}/">${esc(topic.name[article.language])}</a>` : '';
  return `<section class="evidence-panel" id="evidence"><div><span class="eyebrow">${esc(currentLabel(article.language, '検証情報', 'Evidence record'))}</span><h2>${esc(currentLabel(article.language, '調査範囲と確認日', 'Research scope and verification'))}</h2></div><dl><div><dt>${esc(currentLabel(article.language, '公式情報', 'Official sources'))}</dt><dd>${sourceCount}${esc(currentLabel(article.language, '件', ' sources'))}</dd></div><div><dt>${esc(currentLabel(article.language, '最終確認', 'Last verified'))}</dt><dd>${esc(verified)}</dd></div>${topic ? `<div><dt>${esc(currentLabel(article.language, '目的別ガイド', 'Topic guide'))}</dt><dd>${topicLink}</dd></div>` : ''}</dl><p>${esc(currentLabel(article.language, '提供元の料金・製品・ヘルプページを優先し、記事内の断定は確認できた範囲に限定しています。', 'We prioritize provider-owned pricing, product, and help pages and limit claims to what those sources support.'))}</p></section>`;
}

function semanticRelated(article) {
  const exact = relatedGraph.get(article.id);
  if (exact?.length) return exact;
  const topic = topicForArticle(article);
  return articles
    .filter(candidate => indexableIds.has(candidate.id) && candidate.language === article.language && candidate.id !== article.id)
    .sort((a, b) => {
      const topicScoreA = topicForArticle(a)?.id === topic?.id ? 2 : a.category === article.category ? 1 : 0;
      const topicScoreB = topicForArticle(b)?.id === topic?.id ? 2 : b.category === article.category ? 1 : 0;
      return topicScoreB - topicScoreA || a.title.localeCompare(b.title);
    })
    .slice(0, seoConfig.relatedArticles.count);
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function copyLegacySite() {
  if (!await exists(path.join(legacyRoot, 'index.html'))) return false;
  await fs.cp(legacyRoot, outputRoot, {
    recursive: true,
    filter: source => {
      const relative = path.relative(legacyRoot, source).replaceAll('\\', '/');
      if (!relative) return true;
      if (['.git', '.github'].includes(relative.split('/')[0])) return false;
      return !['sitemap.xml', 'robots.txt', 'search-index.json'].includes(relative);
    }
  });
  return true;
}

async function copySeoAssets() {
  const sourceAssets = path.join(root, 'source-assets');
  if (await exists(sourceAssets)) await fs.cp(sourceAssets, path.join(outputRoot, 'assets'), {recursive: true});
}

function replaceOrInsertXDefault(html, href) {
  const tag = `<link rel="alternate" hreflang="x-default" href="${href}">`;
  if (/<link\b(?=[^>]*hreflang=["']x-default["'])[^>]*>/i.test(html)) {
    return html.replace(/<link\b(?=[^>]*hreflang=["']x-default["'])[^>]*>/i, tag);
  }
  return html.replace(/(<link\b(?=[^>]*rel=["']canonical["'])[^>]*>)/i, `$1\n  ${tag}`);
}

async function normalizePublicChrome() {
  const files = (await walk(outputRoot)).filter(file => file.endsWith('.html'));
  for (const file of files) {
    const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
    const parts = relative.split('/');
    const language = parts[0];
    if (!site.languages.includes(language)) continue;
    const currentCategory = categories.some(category => category.id === parts[1])
      ? parts[1]
      : parts[1] === 'articles' ? 'articles' : parts[1] === 'topics' ? 'topics' : '';
    const alternateLanguage = language === 'ja' ? 'en' : 'ja';
    const tail = parts.slice(1, -1);
    const alternateUrl = `/${alternateLanguage}/${tail.length ? `${tail.join('/')}/` : ''}`;
    const defaultUrl = `${site.baseUrl}/${site.defaultLanguage}/${tail.length ? `${tail.join('/')}/` : ''}`;
    const sharedHeader = header(language, currentCategory, alternateUrl);
    const sharedFooter = footer(language);
    const footerOnly = sharedFooter.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] || '';
    const cookieOnly = sharedFooter.match(/<section\b[^>]*class=["'][^"']*\bcookie-banner\b[^"']*["'][^>]*>[\s\S]*?<\/section>/i)?.[0] || '';
    let html = await fs.readFile(file, 'utf8');
    html = html.replace(/<a\b[^>]*class=["'][^"']*\bskip-link\b[^"']*["'][^>]*>[\s\S]*?<\/header>/i, sharedHeader);
    if (footerOnly) html = html.replace(/<footer\b[^>]*class=["'][^"']*\bsite-footer\b[^"']*["'][^>]*>[\s\S]*?<\/footer>/i, footerOnly);
    if (cookieOnly) html = html.replace(/<section\b[^>]*class=["'][^"']*\bcookie-banner\b[^"']*["'][^>]*>[\s\S]*?<\/section>/i, cookieOnly);
    html = html.replaceAll('レビューレビュー', 'レビュー').replaceAll('ガイドガイド', 'ガイド').replaceAll('比較比較', '比較');
    html = html.replace(/\/assets\/css\/style\.css(?:\?v=[^"']+)?/g, `/assets/css/style.css?v=${site.assetVersion}`);
    html = html.replace(/\/assets\/js\/analytics-v4\.(?:2|5)\.0\.js/g, '/assets/js/analytics-v4.6.0.js');
    html = html.replace(/\/assets\/js\/main-v4\.(?:2|5)\.0\.js/g, '/assets/js/main-v4.6.0.js');
    html = html.replace(/\/assets\/js\/article-directory-v4\.(?:2|5)\.0\.js/g, '/assets/js/article-directory-v4.6.0.js');
    html = replaceOrInsertXDefault(html, defaultUrl);
    if (!/type=["']application\/rss\+xml["']/i.test(html)) {
      html = html.replace('</head>', `  <link rel="alternate" type="application/rss+xml" title="Luqevora ${language}" href="/feed-${language}.xml">\n</head>`);
    }
    const articleRoute = relative.match(/^(ja|en)\/([^/]+)\/([^/]+)\/index\.html$/);
    if (articleRoute && categories.some(category => category.id === articleRoute[2]) && !isNoIndex(html)) {
      const h1 = plainText((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
      const currentTitle = plainText((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || h1);
      const currentDescription = metaContent(html, 'name', 'description');
      const inferredType = /(?:-vs-|comparison)/.test(articleRoute[3]) ? 'comparison' : articleRoute[3].endsWith('-review') ? 'review' : 'guide';
      const compactArticle = {
        language,
        slug: articleRoute[3],
        type: inferredType,
        title: h1,
        metaTitle: currentTitle,
        description: currentDescription
      };
      const compactTitle = seoMetaTitle(compactArticle, seoConfig);
      const compactDescription = seoDescription(compactArticle, seoConfig);
      html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(compactTitle)}</title>`);
      html = replaceMetaContent(html, 'name', 'description', compactDescription);
      html = replaceMetaContent(html, 'property', 'og:title', compactTitle);
      html = replaceMetaContent(html, 'property', 'og:description', compactDescription);
      html = replaceMetaContent(html, 'name', 'twitter:title', compactTitle);
      html = replaceMetaContent(html, 'name', 'twitter:description', compactDescription);
      const imagePath = `/assets/images/articles/${articleRoute[1]}/${articleRoute[2]}/${articleRoute[3]}.${seoConfig.images.format || 'png'}`;
      if (await exists(path.join(outputRoot, imagePath.replace(/^\//, '')))) {
        const imageUrl = `${site.baseUrl}${imagePath}`;
        html = html.replaceAll(`${site.baseUrl}/assets/images/og-default.png`, imageUrl);
        html = html.replaceAll('/assets/images/og-default.png', imagePath);
        if (!html.includes('article-featured-image')) {
          const figure = `<figure class="article-featured-image"><img alt="${esc(h1)}" decoding="async" fetchpriority="high" height="${seoConfig.images.height}" src="${imagePath}" width="${seoConfig.images.width}"><figcaption>${esc(currentLabel(language, '記事の比較・判断ポイントを示すオリジナル画像', 'Original visual for this decision guide'))}</figcaption></figure>`;
          html = html.replace(/(<article\b[^>]*class=["'][^"']*\barticle-(?:body|content)\b[^"']*["'][^>]*>)/i, `$1\n      ${figure}`);
        }
      }
    }
    await writeFile(file, html);
  }
}

await fs.rm(outputRoot, {recursive: true, force: true});
await fs.mkdir(outputRoot, {recursive: true});
const legacyPreserved = await copyLegacySite();
await copySeoAssets();

for (const article of articles) {
  const category = categories.find(candidate => candidate.id === article.category);
  if (!category) throw new Error(`${article.id}: unknown category ${article.category}`);
  const alternate = articles.find(candidate => candidate.translationKey === article.translationKey && candidate.language !== article.language);
  const decision = indexDecisions.get(article.id) || {indexable: false, reasons: []};
  const topic = topicForArticle(article);
  const canonical = `${site.baseUrl}${urlPath(article.language, article.category, article.slug)}`;
  const imagePath = decision.indexable ? articleImagePath(article, seoConfig) : '/assets/images/og-default.png';
  const imageUrl = `${site.baseUrl}${imagePath}`;
  const articleCtas = renderArticleCtas(article);
  const faqHtml = (article.faqs || []).length
    ? `<section id="faq"><h2>${currentLabel(article.language, 'よくある質問', 'Frequently asked questions')}</h2><div class="faq-list">${article.faqs.map(item => `<div class="faq-item"><h3>${esc(item.question)}</h3><p>${esc(item.answer)}</p></div>`).join('')}</div></section>`
    : '';
  const sourceHtml = (article.sources || []).length
    ? `<section id="sources"><h2>${currentLabel(article.language, '確認先となる公式情報', 'Official sources')}</h2><ul class="source-list">${article.sources.map(source => `<li><a data-link-position="official-sources" data-official-link="true" href="${esc(source.url)}" rel="noopener noreferrer" target="_blank">${esc(source.label)}</a></li>`).join('')}</ul></section>`
    : '';
  const related = semanticRelated(article);
  const topicUrl = topic ? `/${article.language}/topics/${topic.id}/` : `/${article.language}/articles/`;
  const relatedHtml = `<section aria-labelledby="related-heading" class="related-articles-block"><div class="related-articles-heading"><h2 id="related-heading">${currentLabel(article.language, '次に読む比較・レビュー', 'What to read next')}</h2><a href="${topicUrl}">${currentLabel(article.language, '目的別ガイドへ →', 'Topic guide →')}</a></div>${related.length ? `<div class="related-articles-grid">${related.map(item => `<a class="related-article-card" href="${urlPath(item.language, item.category, item.slug)}"><strong>${esc(item.title)}</strong><span>${esc(seoDescription(item, seoConfig))}</span></a>`).join('')}</div>` : ''}</section>`;
  const formattedVerified = formatDate(article.verifiedAt, article.language);
  const disclosure = article.affiliateDisclosure || articleCtas.hasAffiliate
    ? `<div class="editorial-note disclosure-note"><p><strong>${currentLabel(article.language, '広告開示：', 'Affiliate disclosure:')}</strong> ${esc(affiliates.rules.sponsoredLabel[article.language])}</p></div>`
    : `<div class="editorial-note disclosure-note"><p><strong>${currentLabel(article.language, '広告開示：', 'Affiliate disclosure:')}</strong> ${currentLabel(article.language, '公開時点でアフィリエイトリンクを含みません。追加時はリンク付近と', 'No affiliate links are included as of publication. If added, they will be disclosed near the link and in our ')}<a href="/${article.language}/affiliate-disclosure/">${currentLabel(article.language, '広告掲載方針', 'Affiliate Disclosure')}</a>${currentLabel(article.language, 'で明示します。', ' page.')}</p></div>`;
  const editorialNote = `<div class="editorial-note"><p><strong>${currentLabel(article.language, '調査方針：', 'Research policy:')}</strong> ${currentLabel(article.language, `${article.title}について、記事末尾に示す提供元の公式情報を優先して確認しました。料金・機能・条件は契約前に公式画面で再確認してください。`, `For ${article.title}, we prioritized the provider-owned sources listed below. Recheck prices, features, and terms on the official site before purchase.`)}</p><p><strong>${currentLabel(article.language, '料金表記：', 'Pricing:')}</strong> ${currentLabel(article.language, '公式に円価格がある場合は円で掲載します。円価格がない場合は公式通貨を記載し、独自の為替換算は行いません。', 'We use the provider’s official currency and do not publish independent exchange-rate conversions.')}</p></div>`;
  const tocItems = [`<li><a href="#decision-summary">${currentLabel(article.language, '先に結論', 'Decision summary')}</a></li>`];
  tocItems.push(...(article.sections || []).map((section, index) => `<li><a href="#section-${index + 1}">${esc(section.heading)}</a></li>`));
  if ((article.faqs || []).length) tocItems.push(`<li><a href="#faq">${currentLabel(article.language, 'よくある質問', 'FAQ')}</a></li>`);
  tocItems.push(`<li><a href="#evidence">${currentLabel(article.language, '調査範囲', 'Evidence record')}</a></li>`);
  if ((article.sources || []).length) tocItems.push(`<li><a href="#sources">${currentLabel(article.language, '公式情報', 'Official sources')}</a></li>`);
  const breadcrumbs = `<a href="/${article.language}/">${site.siteName}</a><span>/</span><a href="/${article.language}/${category.path}/">${esc(category.name[article.language])}</a>${topic ? `<span>/</span><a href="/${article.language}/topics/${topic.id}/">${esc(topic.name[article.language])}</a>` : ''}<span>/</span><span>${esc(article.title)}</span>`;
  const output = render(templates.article, {
    lang: article.language,
    robots: decision.indexable ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' : 'noindex,follow,max-image-preview:large',
    metaTitle: esc(seoMetaTitle(article, seoConfig)),
    description: esc(seoDescription(article, seoConfig)),
    canonical,
    hreflang: hreflangFor(article),
    ogImage: imageUrl,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    category: esc(article.category),
    contentType: esc(article.type),
    topic: esc(topic?.id || article.topic || article.category),
    structuredData: articleStructuredData(article, category, canonical, imageUrl, topic),
    header: header(article.language, article.category, alternate ? urlPath(alternate.language, alternate.category, alternate.slug) : `/${article.language === 'ja' ? 'en' : 'ja'}/`),
    breadcrumbAriaLabel: currentLabel(article.language, 'パンくずリスト', 'Breadcrumb'),
    breadcrumbs,
    badge: esc(article.badge || currentLabel(article.language, '記事', 'Article')),
    title: esc(article.title),
    lead: esc(article.lead || article.description),
    publishedLabel: currentLabel(article.language, `公開・最終確認：${formattedVerified}`, `Published / verified: ${formattedVerified}`),
    authorLabel: currentLabel(article.language, `執筆：${article.author || site.organization.name}`, `By ${article.author || site.organization.name}`),
    heroAffiliateDisclosure: articleCtas.hasAffiliate ? `<p class="hero-affiliate-disclosure"><strong>${currentLabel(article.language, '広告', 'Advertisement')}</strong> ${esc(affiliates.rules.sponsoredLabel[article.language])}</p>` : '',
    featuredImage: decision.indexable ? `<figure class="article-featured-image"><img alt="${esc(article.title)}" decoding="async" fetchpriority="high" height="${seoConfig.images.height}" src="${imagePath}" width="${seoConfig.images.width}"><figcaption>${esc(currentLabel(article.language, `${article.title}の判断ポイントを示すオリジナル画像`, `Original visual for ${article.title}`))}</figcaption></figure>` : '',
    decisionSummary: decisionSummary(article),
    editorialNote,
    affiliateDisclosure: disclosure,
    articleCtas: articleCtas.html,
    body: (article.sections || []).map(renderSection).join(''),
    faq: faqHtml,
    evidencePanel: evidencePanel(article, topic),
    sources: sourceHtml,
    relatedArticles: relatedHtml,
    updateNote: currentLabel(article.language, `情報確認日：${formattedVerified}。料金、機能、条件の変更を確認した場合に更新します。`, `Information verified ${formattedVerified}. We update this page when prices, features, or terms change.`),
    tocAriaLabel: currentLabel(article.language, '目次', 'Table of contents'),
    tocTitle: currentLabel(article.language, '目次', 'Contents'),
    tocItems: tocItems.join(''),
    footer: footer(article.language)
  });
  await writeFile(path.join(outputRoot, article.language, article.category, article.slug, 'index.html'), output);
}

await normalizePublicChrome();

const articlePageFiles = (await walk(outputRoot)).filter(file => {
  const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
  return /^(ja|en)\/[^/]+\/[^/]+\/index\.html$/.test(relative);
});
const articleRecords = [];
let totalArticleFiles = 0;
for (const file of articlePageFiles) {
  const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
  const route = relative.match(/^(ja|en)\/([^/]+)\/([^/]+)\/index\.html$/);
  if (!route || !categories.some(category => category.id === route[2])) continue;
  totalArticleFiles += 1;
  const html = await fs.readFile(file, 'utf8');
  if (isNoIndex(html)) continue;
  const language = route[1];
  const category = categories.find(candidate => candidate.id === route[2]);
  const badge = plainText((html.match(/<span\b[^>]*class=["'][^"']*\bbadge\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '');
  const rawType = metaContent(html, 'name', 'luqevora-content-type').toLowerCase();
  let type = ['review', 'comparison', 'guide'].includes(rawType) ? rawType : 'review';
  if (badge.includes('比較') || badge.toLowerCase().includes('comparison')) type = 'comparison';
  if (badge.includes('ガイド') || badge.toLowerCase().includes('guide')) type = 'guide';
  const rawTopic = metaContent(html, 'name', 'luqevora-topic');
  const topic = inferTopic(route[2], route[3], rawTopic);
  const canonical = canonicalFrom(html);
  articleRecords.push({
    language,
    category: route[2],
    categoryLabel: category.name[language],
    slug: route[3],
    title: plainText((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ''),
    description: metaContent(html, 'name', 'description'),
    url: canonical.startsWith(site.baseUrl) ? canonical.slice(site.baseUrl.length) : `/${language}/${route[2]}/${route[3]}/`,
    type,
    topic: topic?.id || '',
    topicLabel: topic?.name?.[language] || category.name[language],
    badge: badge || currentLabel(language, type === 'comparison' ? '比較記事' : type === 'guide' ? '実践ガイド' : '個別レビュー', type === 'comparison' ? 'Comparison' : type === 'guide' ? 'Guide' : 'Review'),
    verifiedAt: (metaContent(html, 'property', 'article:modified_time') || site.defaultVerifiedAt).slice(0, 10),
    image: metaContent(html, 'property', 'og:image')
  });
}
articleRecords.sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt) || a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

function contentTypeLabel(type, language) {
  return currentLabel(language, type === 'comparison' ? '比較記事' : type === 'guide' ? '実践ガイド' : '個別レビュー', type === 'comparison' ? 'Comparison' : type === 'guide' ? 'Guide' : 'Review');
}

function renderDirectoryCard(record, language) {
  const search = `${record.title} ${record.description} ${record.categoryLabel} ${record.topicLabel}`.toLowerCase();
  const image = record.image.includes('/assets/images/articles/')
    ? `<img alt="" class="article-card-image" decoding="async" height="${seoConfig.images.height}" loading="lazy" src="${record.image.replace(site.baseUrl, '')}" width="${seoConfig.images.width}">`
    : '';
  return `<a class="article-directory-card card${record.type === 'comparison' ? ' article-card-featured' : ''}" data-category="${esc(record.category)}" data-search="${esc(search)}" data-topic="${esc(record.topic)}" data-type="${esc(record.type)}" href="${esc(record.url)}">${image}<div class="article-card-top"><span class="badge">${esc(contentTypeLabel(record.type, language))}</span><span class="article-topic">${esc(record.topicLabel)}</span></div><h3>${esc(record.title)}</h3><p>${esc(record.description)}</p><div class="article-card-meta"><span>${currentLabel(language, '最終確認', 'Last checked')}: ${esc(record.verifiedAt)}</span><span>${currentLabel(language, '読む →', 'Read →')}</span></div></a>`;
}

function representativeRecords(records, type, limit) {
  const selected = [];
  const urls = new Set();
  for (const category of categories) {
    const record = records.find(candidate => candidate.type === type && candidate.category === category.id);
    if (record && !urls.has(record.url)) {
      selected.push(record);
      urls.add(record.url);
    }
  }
  for (const record of records) {
    if (record.type === type && !urls.has(record.url)) {
      selected.push(record);
      urls.add(record.url);
    }
  }
  return selected.slice(0, limit);
}

function configuredHomeRecords(records, type, slugs, limit) {
  const selected = [];
  const urls = new Set();
  for (const slug of slugs || []) {
    const record = records.find(candidate => candidate.type === type && candidate.slug === slug);
    if (record) {
      selected.push(record);
      urls.add(record.url);
    }
  }
  for (const record of representativeRecords(records, type, limit)) {
    if (selected.length >= limit) break;
    if (!urls.has(record.url)) selected.push(record);
  }
  return selected.slice(0, limit);
}

function topicLink(topic, language, records) {
  const count = records.filter(record => record.topic === topic.id).length;
  return `<a class="topic-link-card" href="/${language}/topics/${topic.id}/"><span class="topic-link-count">${count} ${currentLabel(language, '件', 'articles')}</span><strong>${esc(topic.name[language])}</strong><small>${esc(topic.description[language])}</small><span aria-hidden="true">→</span></a>`;
}

for (const language of site.languages) {
  const languageRecords = articleRecords.filter(record => record.language === language);
  const availableTopics = topics.filter(topic => languageRecords.some(record => record.topic === topic.id));
  const topicIndexCanonical = `${site.baseUrl}/${language}/topics/`;
  const topicIndexTitle = currentLabel(language, '目的別ツール選びガイド | Luqevora', 'Tool Guides by Goal | Luqevora');
  const topicIndexDescription = currentLabel(language, `${availableTopics.length}の目的別テーマから、比較・レビュー・導入ガイドを探せます。料金、機能、制約を公式情報で確認できます。`, `Browse comparisons, reviews, and implementation guides across ${availableTopics.length} decision topics, using provider-owned pricing, feature, and policy sources.`);
  const topicIndexGraph = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: topicIndexCanonical,
    name: topicIndexTitle,
    description: topicIndexDescription,
    inLanguage: language,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: availableTopics.map((topic, index) => ({'@type': 'ListItem', position: index + 1, url: `${site.baseUrl}/${language}/topics/${topic.id}/`, name: topic.name[language]}))
    }
  };
  const topicIndex = render(templates.topics, {
    lang: language,
    metaTitle: esc(topicIndexTitle),
    description: esc(topicIndexDescription),
    canonical: topicIndexCanonical,
    hreflang: localizedHreflang('topics'),
    ogImage: `${site.baseUrl}/assets/images/og-default.png`,
    structuredData: JSON.stringify(topicIndexGraph),
    header: header(language, 'topics', `/${language === 'ja' ? 'en' : 'ja'}/topics/`),
    breadcrumbAriaLabel: currentLabel(language, 'パンくずリスト', 'Breadcrumb'),
    breadcrumbCurrent: currentLabel(language, '目的別ガイド', 'Topic Guides'),
    eyebrow: currentLabel(language, `${availableTopics.length}テーマ`, `${availableTopics.length} topics`),
    title: currentLabel(language, '目的から比較・レビューを探す', 'Find the right guide for your goal'),
    lead: currentLabel(language, 'カテゴリをまたいで、導入目的や運用課題に近い記事をまとめています。', 'Explore comparisons and reviews organized around the workflow or buying decision you need to solve.'),
    topicCards: availableTopics.map(topic => topicLink(topic, language, languageRecords)).join(''),
    footer: footer(language)
  });
  await writeFile(path.join(outputRoot, language, 'topics', 'index.html'), topicIndex);

  for (const topic of availableTopics) {
    const records = languageRecords.filter(record => record.topic === topic.id);
    const canonical = `${site.baseUrl}/${language}/topics/${topic.id}/`;
    const pageTitle = `${topic.name[language]} | Luqevora`;
    const category = categories.find(item => item.id === topic.category);
    const graph = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      url: canonical,
      name: pageTitle,
      description: topic.description[language],
      inLanguage: language,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: records.length,
        itemListElement: records.map((record, index) => ({'@type': 'ListItem', position: index + 1, url: `${site.baseUrl}${record.url}`, name: record.title}))
      }
    };
    const page = render(templates.topic, {
      lang: language,
      metaTitle: esc(pageTitle),
      description: esc(topic.description[language]),
      canonical,
      hreflang: localizedHreflang(`topics/${topic.id}`),
      ogImage: `${site.baseUrl}/assets/images/og-default.png`,
      structuredData: JSON.stringify(graph),
      header: header(language, 'topics', `/${language === 'ja' ? 'en' : 'ja'}/topics/${topic.id}/`),
      breadcrumbAriaLabel: currentLabel(language, 'パンくずリスト', 'Breadcrumb'),
      topicsLabel: currentLabel(language, '目的別ガイド', 'Topic Guides'),
      eyebrow: currentLabel(language, '目的別ツール選び', 'Decision topic'),
      title: esc(topic.name[language]),
      description: esc(topic.description[language]),
      categoryPath: esc(category.path),
      categoryLabel: esc(category.name[language]),
      articleCountLabel: currentLabel(language, `${records.length}件の記事`, `${records.length} articles`),
      methodEyebrow: currentLabel(language, '比較方法', 'How we compare'),
      methodTitle: currentLabel(language, '料金だけでなく、運用条件まで確認', 'Compare operating conditions—not only price'),
      methodText: currentLabel(language, '公式料金、利用上限、管理機能、データの扱い、解約・移行条件を同じ軸で確認し、用途に合う選択肢を整理します。', 'We compare official pricing, usage limits, administration, data handling, and cancellation or migration conditions on the same basis.'),
      articleCards: records.map(record => renderDirectoryCard(record, language)).join(''),
      footer: footer(language)
    });
    await writeFile(path.join(outputRoot, language, 'topics', topic.id, 'index.html'), page);
  }
}

for (const language of site.languages) {
  for (const category of categories) {
    const records = articleRecords.filter(record => record.language === language && record.category === category.id);
    const categoryTopics = topics.filter(topic => topic.category === category.id && records.some(record => record.topic === topic.id));
    const canonical = `${site.baseUrl}/${language}/${category.path}/`;
    const description = category.description?.[language] || currentLabel(language, `${category.name.ja}の記事一覧です。`, `${category.name.en} articles.`);
    const pageTitle = `${category.name[language]} | Luqevora`;
    const graph = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      url: canonical,
      name: pageTitle,
      description,
      inLanguage: language,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: records.length,
        itemListElement: records.map((record, index) => ({'@type': 'ListItem', position: index + 1, url: `${site.baseUrl}${record.url}`, name: record.title}))
      }
    };
    const relatedCategories = categories.filter(candidate => candidate.id !== category.id).map(candidate => {
      const count = articleRecords.filter(record => record.language === language && record.category === candidate.id).length;
      return `<a class="related-category-link" href="/${language}/${candidate.path}/"><span>${esc(candidate.id.split('-').map(part => part[0]).join('').toUpperCase())}</span><strong>${esc(candidate.name[language])}</strong><small>${count} ${currentLabel(language, '件', 'articles')}</small></a>`;
    }).join('');
    const directory = render(templates.categoryDirectory, {
      lang: language,
      metaTitle: esc(pageTitle),
      description: esc(description),
      canonical,
      hreflang: localizedHreflang(category.path),
      ogImage: `${site.baseUrl}/assets/images/og-default.png`,
      structuredData: JSON.stringify(graph),
      header: header(language, category.id, `/${language === 'ja' ? 'en' : 'ja'}/${category.path}/`),
      breadcrumbAriaLabel: currentLabel(language, 'パンくずリスト', 'Breadcrumb'),
      eyebrow: currentLabel(language, `${records.length} 件の記事`, `${records.length} articles`),
      title: esc(category.name[language]),
      categoryId: esc(category.id),
      allArticlesLabel: currentLabel(language, 'このカテゴリの記事をすべて見る', 'View all articles in this category'),
      evaluationEyebrow: currentLabel(language, '選び方', 'Evaluation'),
      evaluationTitle: currentLabel(language, '比較するときの確認ポイント', 'What to check before choosing'),
      pointOneTitle: currentLabel(language, '料金と利用上限', 'Pricing and limits'),
      pointOneText: currentLabel(language, '初回価格だけでなく、更新・超過・人数・容量など実運用の条件を確認します。', 'Check renewals, overages, seats, and capacity—not only the introductory price.'),
      pointTwoTitle: currentLabel(language, '機能と管理性', 'Features and administration'),
      pointTwoText: currentLabel(language, '主要機能に加え、権限、共有、移行、書き出し、管理負荷を整理します。', 'Review permissions, sharing, migration, export, and administrative effort alongside core features.'),
      pointThreeTitle: currentLabel(language, '適合性と制約', 'Fit and constraints'),
      pointThreeText: currentLabel(language, '向いている用途と、契約前に確認すべき制約を明示します。', 'Identify the best-fit use cases and the constraints to verify before purchase.'),
      articlesEyebrow: currentLabel(language, '記事', 'Articles'),
      articlesTitle: currentLabel(language, 'このカテゴリの記事', 'Articles in this category'),
      articlesLead: currentLabel(language, '検索対象として優先した比較・レビュー・ガイドを、新しい確認日順に表示します。', 'Priority comparisons, reviews, and guides are listed by latest verification date.'),
      articleCards: records.map(record => renderDirectoryCard(record, language)).join(''),
      topicsEyebrow: currentLabel(language, '目的別', 'Topics'),
      topicsTitle: currentLabel(language, '目的から記事を探す', 'Browse this category by goal'),
      topicsLead: currentLabel(language, '導入目的や運用課題に近いテーマから絞り込めます。', 'Narrow the list by the decision or workflow you need to solve.'),
      topicLinks: categoryTopics.map(topic => topicLink(topic, language, records)).join(''),
      relatedTitle: currentLabel(language, '関連カテゴリ', 'Related categories'),
      relatedCategories,
      footer: footer(language)
    });
    await writeFile(path.join(outputRoot, language, category.path, 'index.html'), directory);
  }
}

for (const language of site.languages) {
  const records = articleRecords.filter(record => record.language === language);
  const availableTopics = topics.filter(topic => records.some(record => record.topic === topic.id));
  const canonical = `${site.baseUrl}/${language}/`;
  const pageTitle = currentLabel(language, 'AI・SaaS・Webサービス比較 | Luqevora', 'AI, SaaS & Web Service Comparisons | Luqevora');
  const description = currentLabel(language, `優先度の高い${records.length}件のAI・SaaS・Webサービス比較、レビュー、ガイドを公式情報で整理。料金・機能・制約から選べます。`, `Explore ${records.length} priority comparisons, reviews, and guides for AI, SaaS, and web services using provider-owned pricing, feature, and policy sources.`);
  const comparisons = configuredHomeRecords(records, 'comparison', homeConfig.featuredComparisons, 5);
  const reviews = configuredHomeRecords(records, 'review', homeConfig.featuredReviews, 6);
  const categoryIcons = {'ai-tools': 'AI', 'website-builders': 'WEB', 'seo-marketing': 'SEO', 'business-software': 'OPS', 'hosting-security': 'SEC'};
  const categoryCards = categories.map(category => {
    const count = records.filter(record => record.category === category.id).length;
    return `<a class="card category-summary-card" data-category-count="${count}" data-category-id="${esc(category.id)}" href="/${language}/${category.path}/"><span class="arrow" aria-hidden="true">↗</span><span class="card-icon">${esc(categoryIcons[category.id] || category.id.slice(0, 3).toUpperCase())}</span><h3>${esc(category.name[language])}</h3><p>${esc(category.description?.[language] || '')}</p><span class="category-count">${esc(currentLabel(language, `${count} 件`, `${count} articles`))}</span></a>`;
  }).join('');
  const graph = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: canonical,
    name: pageTitle,
    description,
    inLanguage: language,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: comparisons.length + reviews.length,
      itemListElement: [...comparisons, ...reviews].map((record, index) => ({'@type': 'ListItem', position: index + 1, url: `${site.baseUrl}${record.url}`, name: record.title}))
    }
  };
  const home = render(templates.homeDirectory, {
    lang: language,
    metaTitle: esc(pageTitle),
    description: esc(description),
    canonical,
    hreflang: localizedHreflang('/'),
    ogImage: `${site.baseUrl}/assets/images/og-default.png`,
    structuredData: JSON.stringify(graph),
    header: header(language, '', `/${language === 'ja' ? 'en' : 'ja'}/`),
    homeEyebrow: currentLabel(language, 'デジタルツール選びのガイド', 'Digital tool decision guide'),
    heroTitle: currentLabel(language, 'より良いツール選びを、<br><span class="accent">もっと分かりやすく。</span>', 'Better tools.<br><span class="accent">Clearer decisions.</span>'),
    heroText: currentLabel(language, 'AI・SaaS・Webサービスの料金、機能、制約を公式情報から整理。比較から導入判断まで、必要な情報を一か所で確認できます。', 'We organize official information on pricing, features, and constraints so you can compare AI, SaaS, and web services with confidence.'),
    homeSearchAriaLabel: currentLabel(language, '記事を検索', 'Search articles'),
    homeSearchLabel: currentLabel(language, '製品名や目的から記事を探す', 'Find an article by product or goal'),
    homeSearchPlaceholder: currentLabel(language, '例：ChatGPT、SEO、レンタルサーバー', 'Try ChatGPT, SEO, or web hosting'),
    homeSearchButton: currentLabel(language, '検索する', 'Search'),
    browseLabel: currentLabel(language, 'すべての記事を見る', 'Browse all articles'),
    methodLabel: currentLabel(language, '編集方針を見る', 'How we evaluate'),
    heroCardTitle: currentLabel(language, '判断に必要な情報だけを明確に', 'Clear information for better decisions'),
    heroChecks: currentLabel(language, '<li>公式ページを優先して確認</li><li>向いている人と制約を明示</li><li>情報確認日と出典を掲載</li>', '<li>Official sources prioritized</li><li>Best-fit users and constraints stated</li><li>Verification dates and sources included</li>'),
    articleCount: records.length,
    articleCountLabel: currentLabel(language, '検索対象の記事', 'search-ready articles'),
    categoryCount: categories.length,
    categoryCountLabel: currentLabel(language, '主要カテゴリ', 'core categories'),
    languageLabel: currentLabel(language, '日本語・英語', 'Japanese and English'),
    coverageAriaLabel: currentLabel(language, 'サイトの掲載範囲', 'Site coverage'),
    officialBadge: currentLabel(language, '公式情報', 'Official sources'),
    officialLabel: currentLabel(language, '提供元ページを優先', 'provider pages prioritized'),
    categoriesEyebrow: currentLabel(language, 'カテゴリ', 'Categories'),
    categoriesTitle: currentLabel(language, '製品カテゴリから探す', 'Browse by product category'),
    categoriesLead: currentLabel(language, '製品分野ごとに、比較記事・個別レビュー・実践ガイドをまとめています。', 'Find comparisons, individual reviews, and practical guides grouped by product area.'),
    categoryCards,
    topicsEyebrow: currentLabel(language, '目的別ガイド', 'Topic guides'),
    topicsTitle: currentLabel(language, '解決したいことから探す', 'Browse by the decision you need to make'),
    topicsLead: currentLabel(language, 'カテゴリをまたいで、購入・導入・運用の目的に近い記事へ移動できます。', 'Move directly to comparisons and reviews aligned with your buying, setup, or operating goal.'),
    topicLinks: availableTopics.map(topic => topicLink(topic, language, records)).join(''),
    allTopicsLabel: currentLabel(language, '目的別ガイドをすべて見る', 'View all topic guides'),
    comparisonsEyebrow: currentLabel(language, '比較記事', 'Comparisons'),
    comparisonsTitle: currentLabel(language, '人気サービスを並べて比較', 'Compare popular services side by side'),
    comparisonsLead: currentLabel(language, '料金だけでなく、機能・運用負荷・制約まで同じ軸で整理します。', 'Compare pricing, features, operating effort, and constraints on the same page.'),
    comparisonCards: comparisons.map(record => renderDirectoryCard(record, language)).join(''),
    allComparisonsLabel: currentLabel(language, '比較記事をすべて見る', 'View all comparisons'),
    reviewsEyebrow: currentLabel(language, '個別レビュー', 'Product reviews'),
    reviewsTitle: currentLabel(language, '個別レビューで詳しく確認', 'Explore individual product reviews'),
    reviewsLead: currentLabel(language, '導入前に確認したい特徴、注意点、向いている用途を製品ごとにまとめています。', 'Review the features, caveats, and best-fit use cases to check before adopting each product.'),
    reviewCards: reviews.map(record => renderDirectoryCard(record, language)).join(''),
    allReviewsLabel: currentLabel(language, '個別レビューをすべて見る', 'View all reviews'),
    transparencyEyebrow: currentLabel(language, '透明性', 'Transparency'),
    transparencyTitle: currentLabel(language, '公式情報と更新日を明示します', 'Official sources and verification dates'),
    transparencyText: currentLabel(language, '記事は公式料金ページ・製品ページ・ヘルプ情報を優先して作成し、条件が変わりやすい箇所には確認日を付けています。', 'Articles prioritize official pricing, product, and help pages, with verification dates for details that can change.'),
    transparencyChecks: currentLabel(language, '<li>広告リンクの有無を記事内で開示</li><li>比較の判断軸を先に提示</li><li>出典へのリンクを記事末尾に掲載</li>', '<li>Affiliate-link status disclosed in every article</li><li>Evaluation criteria stated up front</li><li>Sources linked at the end of each article</li>'),
    footer: footer(language)
  });
  await writeFile(path.join(outputRoot, language, 'index.html'), home);
}

for (const language of site.languages) {
  const records = articleRecords.filter(record => record.language === language);
  const canonical = `${site.baseUrl}/${language}/articles/`;
  const pageTitle = currentLabel(language, '記事一覧・ツールレビュー検索 | Luqevora', 'All Comparisons and Tool Reviews | Luqevora');
  const description = currentLabel(language, `検索対象として優先した${records.length}件の比較記事・個別レビュー・ガイドを、カテゴリ・記事種別・キーワードで探せます。`, `Search ${records.length} priority Luqevora comparisons, product reviews, and guides by category, content type, topic, or keyword.`);
  const graph = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    url: canonical,
    name: pageTitle,
    description,
    inLanguage: language,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: records.length,
      itemListElement: records.map((record, index) => ({'@type': 'ListItem', position: index + 1, url: `${site.baseUrl}${record.url}`, name: record.title}))
    }
  };
  const categoryOptions = [
    `<option value="">${currentLabel(language, 'すべてのカテゴリ', 'All categories')}</option>`,
    ...categories.map(category => `<option value="${esc(category.id)}">${esc(category.name[language])}</option>`)
  ].join('');
  const typeOptions = language === 'ja'
    ? '<option value="">すべての記事</option><option value="comparison">比較記事</option><option value="review">個別レビュー</option><option value="guide">実践ガイド</option>'
    : '<option value="">All content types</option><option value="comparison">Comparisons</option><option value="review">Reviews</option><option value="guide">Guides</option>';
  const directory = render(templates.articles, {
    lang: language,
    metaTitle: esc(pageTitle),
    description: esc(description),
    canonical,
    hreflang: localizedHreflang('articles'),
    ogImage: `${site.baseUrl}/assets/images/og-default.png`,
    structuredData: JSON.stringify(graph),
    header: header(language, 'articles', `/${language === 'ja' ? 'en' : 'ja'}/articles/`),
    breadcrumbAriaLabel: currentLabel(language, 'パンくずリスト', 'Breadcrumb'),
    breadcrumbCurrent: currentLabel(language, '記事一覧', 'All Articles'),
    eyebrow: currentLabel(language, `${records.length} 件・検索対象`, `${records.length} search-ready articles`),
    title: currentLabel(language, '比較記事・レビューを探す', 'Find comparisons and tool reviews'),
    lead: currentLabel(language, 'カテゴリ、記事種別、製品名から、目的に合う比較記事・レビュー・ガイドを絞り込めます。', 'Filter by category, content type, topic, or product name to find the most relevant article.'),
    searchLabel: currentLabel(language, 'キーワード検索', 'Keyword search'),
    searchPlaceholder: currentLabel(language, '製品名・記事タイトル・機能で検索', 'Search products, article titles, or features'),
    categoryFilterLabel: currentLabel(language, 'カテゴリ', 'Category'),
    categoryOptions,
    typeFilterLabel: currentLabel(language, '記事種別', 'Content type'),
    typeOptions,
    resetLabel: currentLabel(language, '条件をリセット', 'Reset filters'),
    articleCount: records.length,
    articleCountLabel: currentLabel(language, '件の記事', 'articles'),
    articleCards: records.map(record => renderDirectoryCard(record, language)).join(''),
    emptyLabel: currentLabel(language, '条件に一致する記事がありません。検索語や絞り込みを変更してください。', 'No articles match your filters. Try another keyword or filter.'),
    footer: footer(language)
  });
  await writeFile(path.join(outputRoot, language, 'articles', 'index.html'), directory);
}

await normalizePublicChrome();

const htmlFiles = (await walk(outputRoot)).filter(file => file.endsWith('.html'));
const htmlRecords = [];
for (const file of htmlFiles) {
  const html = await fs.readFile(file, 'utf8');
  const canonical = canonicalFrom(html);
  if (!canonical.startsWith(site.baseUrl) || isNoIndex(html)) continue;
  const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
  const articleRoute = relative.match(/^(ja|en)\/([^/]+)\/([^/]+)\/index\.html$/);
  const topicRoute = relative.match(/^(ja|en)\/topics(?:\/([^/]+))?\/index\.html$/);
  const type = articleRoute && categories.some(category => category.id === articleRoute[2])
    ? 'article'
    : topicRoute ? 'topic' : 'page';
  htmlRecords.push({
    canonical,
    relative,
    type,
    language: (relative.match(/^(ja|en)\//) || [])[1] || '',
    lastmod: (metaContent(html, 'property', 'article:modified_time') || site.defaultVerifiedAt).slice(0, 10),
    image: metaContent(html, 'property', 'og:image'),
    title: plainText((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '')
  });
}

const xmlEscape = value => String(value).replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[character]));
const indexableCanonicalSet = new Set(htmlRecords.map(record => record.canonical));

function sitemapAlternates(record) {
  const pathname = new URL(record.canonical).pathname;
  const match = pathname.match(/^\/(ja|en)(\/.*)$/);
  if (!match) return `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(record.canonical)}"/>`;
  const tail = match[2];
  const links = site.languages
    .map(language => `${site.baseUrl}/${language}${tail}`)
    .filter(url => indexableCanonicalSet.has(url))
    .map(url => {
      const language = new URL(url).pathname.split('/')[1];
      return `<xhtml:link rel="alternate" hreflang="${language}" href="${xmlEscape(url)}"/>`;
    });
  const defaultUrl = `${site.baseUrl}/${site.defaultLanguage}${tail}`;
  if (indexableCanonicalSet.has(defaultUrl)) links.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(defaultUrl)}"/>`);
  return links.join('');
}

function sitemapUrl(record) {
  const image = record.type === 'article' && record.image.includes('/assets/images/articles/')
    ? `<image:image><image:loc>${xmlEscape(record.image)}</image:loc><image:title>${xmlEscape(record.title)}</image:title></image:image>`
    : '';
  return `  <url><loc>${xmlEscape(record.canonical)}</loc><lastmod>${xmlEscape(record.lastmod)}</lastmod>${sitemapAlternates(record)}${image}</url>`;
}

const sitemapGroups = new Map([
  ['pages.xml', htmlRecords.filter(record => record.type === 'page')],
  ['topics-ja.xml', htmlRecords.filter(record => record.type === 'topic' && record.language === 'ja')],
  ['topics-en.xml', htmlRecords.filter(record => record.type === 'topic' && record.language === 'en')],
  ['articles-ja.xml', htmlRecords.filter(record => record.type === 'article' && record.language === 'ja')],
  ['articles-en.xml', htmlRecords.filter(record => record.type === 'article' && record.language === 'en')]
]);
for (const [filename, records] of sitemapGroups) {
  records.sort((a, b) => a.canonical.localeCompare(b.canonical));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${records.map(sitemapUrl).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(outputRoot, 'sitemaps', filename), xml);
}
const sitemapLastmod = htmlRecords.map(record => record.lastmod).sort().at(-1) || site.defaultVerifiedAt;
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...sitemapGroups.keys()].map(filename => `  <sitemap><loc>${site.baseUrl}/sitemaps/${filename}</loc><lastmod>${sitemapLastmod}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`;
await writeFile(path.join(outputRoot, 'sitemap.xml'), sitemapIndex);
await writeFile(path.join(outputRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.baseUrl}/sitemap.xml\n`);
await writeFile(path.join(outputRoot, `${indexNow.key}.txt`), `${indexNow.key}\n`);

for (const language of site.languages) {
  const records = articleRecords.filter(record => record.language === language).slice(0, 50);
  const title = currentLabel(language, 'Luqevora 最新記事', 'Luqevora Latest Articles');
  const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${xmlEscape(title)}</title><link>${site.baseUrl}/${language}/</link><description>${xmlEscape(currentLabel(language, 'AI・SaaS・Webサービスの比較・レビュー', 'AI, SaaS, and web-service comparisons and reviews'))}</description><language>${language}</language><lastBuildDate>${new Date(`${site.defaultVerifiedAt}T00:00:00Z`).toUTCString()}</lastBuildDate>${records.map(record => `<item><title>${xmlEscape(record.title)}</title><link>${site.baseUrl}${record.url}</link><guid isPermaLink="true">${site.baseUrl}${record.url}</guid><description>${xmlEscape(record.description)}</description><pubDate>${new Date(`${record.verifiedAt}T00:00:00Z`).toUTCString()}</pubDate></item>`).join('')}</channel></rss>\n`;
  await writeFile(path.join(outputRoot, `feed-${language}.xml`), feed);
}

const searchIndex = articleRecords.map(record => ({
  title: record.title,
  description: record.description,
  url: record.url,
  language: record.language,
  category: record.category,
  topic: record.topic
})).sort((a, b) => a.language.localeCompare(b.language) || a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
await writeFile(path.join(outputRoot, 'search-index.json'), `${JSON.stringify(searchIndex, null, 2)}\n`);

const inboundValues = [...relatedInbound.values()];
await writeFile(path.join(root, 'reports/build.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  indexingMode: seoConfig.indexing.mode,
  dataDrivenArticleCount: articles.length,
  indexableDataDrivenArticles: indexableIds.size,
  noindexDataDrivenArticles: articles.length - indexableIds.size,
  totalPublicArticleFiles: totalArticleFiles,
  indexablePublicArticles: articleRecords.length,
  indexableArticlesByLanguage: Object.fromEntries(site.languages.map(language => [language, articleRecords.filter(record => record.language === language).length])),
  topicPages: htmlRecords.filter(record => record.type === 'topic').length,
  originalArticleImages: htmlRecords.filter(record => record.type === 'article' && record.image.includes('/assets/images/articles/')).length,
  relatedInboundMinimum: inboundValues.length ? Math.min(...inboundValues) : 0,
  relatedInboundMaximum: inboundValues.length ? Math.max(...inboundValues) : 0,
  legacyPreserved,
  publicHtmlFiles: htmlFiles.length,
  sitemapUrls: htmlRecords.length,
  searchIndexArticles: searchIndex.length,
  dataDrivenRoutes: articles.map(article => urlPath(article.language, article.category, article.slug))
}, null, 2)}\n`);

console.log(`Built ${articles.length} data-driven articles (${indexableIds.size} indexable), ${articleRecords.length} total indexable articles, ${htmlFiles.length} HTML files.`);
