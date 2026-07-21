import fs from 'node:fs/promises';
import path from 'node:path';
import {root, readJson, writeFile, walk, render, esc, urlPath} from './lib.mjs';
import {loadArticleEntries} from './load-articles.mjs';
import {generateStoreDxPlatform} from './store-dx-platform-lib.mjs';
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
const luqviaService = await readJson(path.join(root, 'content/config/luqvia-service.json'));
const homeConfig = await readJson(path.join(root, 'content/config/home.json'));
const productCatalog = await readJson(path.join(root, 'content/products/catalog.json'));
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
  compare: await fs.readFile(path.join(root, 'templates/pages/compare.html'), 'utf8'),
  product: await fs.readFile(path.join(root, 'templates/pages/product.html'), 'utf8'),
  diagnosis: await fs.readFile(path.join(root, 'templates/pages/diagnosis.html'), 'utf8'),
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

const luqviaTargetSet = new Set((luqviaService.targetArticles || []).map(item => `${item.category}/${item.slug}`));

function hasLuqviaServicePanel(article) {
  return Boolean(luqviaService.enabled && article.language === luqviaService.language && article.type === 'comparison' && luqviaTargetSet.has(`${article.category}/${article.slug}`));
}

function luqviaTrackedWebsiteUrl(article) {
  const url = new URL(luqviaService.urls.website);
  url.searchParams.set('utm_source', 'luqevora');
  url.searchParams.set('utm_medium', 'owned_media');
  url.searchParams.set('utm_campaign', 'website_production');
  url.searchParams.set('utm_content', article.slug);
  return url.toString();
}

function renderLuqviaServicePanel(article) {
  if (!hasLuqviaServicePanel(article)) return '';
  const p = luqviaService.pricing;
  const serviceItems = (luqviaService.services || []).map(item => `<li>${esc(item)}</li>`).join('');
  const website = luqviaTrackedWebsiteUrl(article);
  return `<section class="luqvia-service-panel" id="luqvia-service" data-operator-service="LuQvia"><div class="luqvia-service-heading"><span class="eyebrow">運営者サービスのご案内</span><h2>${esc(luqviaService.headline)}</h2><p class="luqvia-relationship"><strong>関係性の明示：</strong> ${esc(luqviaService.operatorRelationship)}</p><p>${esc(luqviaService.description)}</p></div><div class="luqvia-pricing-grid"><article><span>${esc(p.productionLabel)}</span><strong>${esc(p.productionValue)}</strong></article><article><span>${esc(p.monthlyLabel)}</span><strong>${esc(p.monthlyValue)}</strong></article><article><span>事前相談</span><strong>無料ホームページ診断</strong></article></div><div class="luqvia-service-content"><div><h3>主な対応内容</h3><ul class="fact-list">${serviceItems}</ul></div><div class="luqvia-service-actions"><a class="btn btn-primary" data-track-event="luqvia_website_open" data-source-article="${esc(article.slug)}" href="${esc(website)}" rel="noopener noreferrer" target="_blank">サービス・料金を見る</a><a class="btn btn-secondary" data-track-event="luqvia_diagnosis_open" data-source-article="${esc(article.slug)}" href="${esc(luqviaService.urls.diagnosis)}" rel="noopener noreferrer" target="_blank">無料診断を申し込む</a><a class="text-link" data-track-event="luqvia_line_open" data-source-article="${esc(article.slug)}" href="${esc(luqviaService.urls.line)}" rel="noopener noreferrer" target="_blank">公式LINEで相談する →</a><a class="text-link" href="mailto:${esc(luqviaService.urls.email)}">メールで相談する →</a></div></div><p class="luqvia-service-note">${esc(p.monthlyNote)} 最終料金と対応範囲は、無料診断または見積もり時の案内を優先してください。</p></section>`;
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
        ['製品比較DB', 'compare'], ['目的別ガイド', 'topics'], ['記事一覧', 'articles'], ['運営者情報', 'about'], ['編集方針', 'editorial-policy'],
        ['広告掲載方針', 'affiliate-disclosure'], ['プライバシーポリシー', 'privacy'], ['利用規約', 'terms'], ['お問い合わせ', 'contact']
      ]
    : [
        ['Product Database', 'compare'], ['Topic Guides', 'topics'], ['Articles', 'articles'], ['About', 'about'], ['Editorial Policy', 'editorial-policy'],
        ['Affiliate Disclosure', 'affiliate-disclosure'], ['Privacy', 'privacy'], ['Terms', 'terms'], ['Contact', 'contact']
      ];
  return render(templates.footer, {
    lang: language,
    year: new Date().getUTCFullYear(),
    footerDescription: currentLabel(language, 'AI・SaaS・Webサービスを公式情報を基準に整理し、より明確な意思決定を支援します。', 'We organize AI, SaaS, and web-service information using official sources to support clearer decisions.'),
    operatorLabel: currentLabel(language, '運営：LuQvia', 'Operated by LuQvia'),
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
  if (hasLuqviaServicePanel(article)) {
    graph.push({
      '@type': 'Service',
      '@id': `${canonical}#luqvia-website-production`,
      name: luqviaService.serviceName,
      serviceType: 'ホームページ制作・継続改善サポート',
      provider: {'@type': 'Organization', name: 'LuQvia', url: luqviaService.urls.website},
      areaServed: {'@type': 'Country', name: '日本'},
      url: luqviaService.urls.website
    });
  }
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

function renderSection(section, index, language) {
  const paragraphs = (section.body || []).map(paragraph => `<p>${esc(paragraph)}</p>`).join('');
  const bullets = (section.bullets || []).length
    ? `<ul class="fact-list">${section.bullets.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`
    : '';
  const table = section.table
    ? `<div class="table-scroll"><table class="comparison-table review-table"><thead><tr>${section.table.headers.map(item => `<th scope="col">${esc(item)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map(row => `<tr>${row.map((cell, cellIndex) => `<td${cellIndex === 0 ? ' class="tool-name"' : ''}>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
    : '';
  const callout = section.callout ? `<div class="notice">${esc(section.callout)}</div>` : '';
  const materialKey = section.affiliateMaterialKey || '';
  const entry = configuredAffiliateEntry(materialKey, language);
  const affiliateMaterial = entry?.type === 'rawHtml'
    ? `<aside class="section-affiliate-material" aria-label="${esc(currentLabel(language, '広告', 'Advertisement'))}"><span class="article-cta-material" data-affiliate-key="${esc(materialKey)}" data-affiliate-position="section-${index + 1}">${validatedRawAffiliateHtml(entry, materialKey)}</span>${section.affiliateNote ? `<p>${esc(section.affiliateNote)}</p>` : ''}</aside>`
    : '';
  return `<section id="section-${index + 1}"><h2>${esc(section.heading)}</h2>${paragraphs}${table}${bullets}${callout}${affiliateMaterial}</section>`;
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
    const isMailto = /^mailto:/i.test(href);
    const rel = isAffiliate ? affiliates.rules.defaultRel : 'noopener noreferrer';
    const attributes = isAffiliate ? `data-affiliate-key="${esc(cta.affiliateKey)}" data-affiliate-link="true" data-affiliate-product="${esc(cta.affiliateKey)}"` : 'data-official-link="true"';
    const navigationAttributes = isMailto ? '' : ` rel="${esc(rel)}" target="${esc(affiliates.rules.externalTarget || '_blank')}"`;
    return `<a class="article-cta-link" data-link-position="article-cta" href="${esc(href)}"${navigationAttributes} ${attributes}>${esc(cta.label)}<span aria-hidden="true"> →</span></a>`;
  }).join('');
  if (!links) return {html: '', hasAffiliate};
  const title = currentLabel(article.language, '公式ページで最新条件を確認', 'Check current terms on the official site');
  const note = currentLabel(article.language, '料金、割引、対象機能、契約期間は変更されるため、申込画面の表示を優先してください。', 'Prices, discounts, included features, and billing terms can change. Rely on the checkout page before purchase.');
  return {
    html: `<aside id="offer" aria-label="${esc(title)}" class="article-cta-panel"><strong>${esc(title)}</strong><div class="article-cta-links">${links}</div><p>${esc(note)}</p></aside>`,
    hasAffiliate
  };
}


function sentenceSnippet(value = '') {
  const text = plainText(value);
  if (!text) return '';
  const pieces = text.split(/(?<=[。！？!?])\s*|(?<=\.)\s+/).filter(Boolean);
  return (pieces[0] || text).slice(0, 180);
}

function renderThreePointSummary(article) {
  const candidates = [
    article.lead,
    ...(article.sections || []).flatMap(section => [section.body?.[0], ...(section.bullets || [])])
  ].filter(Boolean).map(sentenceSnippet);
  const points = [...new Set(candidates)].filter(Boolean).slice(0, 3);
  if (!points.length) return '';
  const title = currentLabel(article.language, '3点でわかる要約', 'Three-point summary');
  return `<section class="three-point-summary" id="three-point-summary"><span class="eyebrow">${esc(currentLabel(article.language, 'まず確認', 'At a glance'))}</span><h2>${esc(title)}</h2><ol>${points.map(point => `<li>${esc(point)}</li>`).join('')}</ol></section>`;
}

function renderProsCautions(article) {
  const sections = article.sections || [];
  const positivePattern = /メリット|強み|利点|特徴|おすすめ|benefit|advantage|strength|best/i;
  const cautionPattern = /デメリット|注意|弱点|制約|欠点|対象外|確認|caveat|constraint|limit|drawback|watch/i;
  const positive = sections.filter(section => positivePattern.test(section.heading || '')).flatMap(section => section.bullets || section.body || []);
  const caution = sections.filter(section => cautionPattern.test(section.heading || '')).flatMap(section => section.bullets || section.body || []);
  const negativeSignal = /ではありません|できません|非対応|対象外|注意|制約|弱点|not |cannot|does not|unsupported|excluded|caveat|constraint/i;
  const fallbackPositive = sections
    .filter(section => !cautionPattern.test(section.heading || ''))
    .flatMap(section => [...(section.bullets || []), ...(section.body || [])])
    .filter(item => !negativeSignal.test(plainText(item)))
    .slice(0, 6);
  const fallbackCaution = article.language === 'ja'
    ? ['最新料金と契約期間を公式画面で再確認する', '解約・移行・データ保持条件を契約前に確認する', '必要な機能が対象プランに含まれるか確認する']
    : ['Recheck current pricing and billing terms on the official site', 'Confirm cancellation, migration, and data-retention conditions', 'Verify that required features are included in the selected plan'];
  const pros = [...new Set((positive.length ? positive : fallbackPositive).map(sentenceSnippet))].filter(Boolean).slice(0, 3);
  const cautions = [...new Set((caution.length ? caution : fallbackCaution).map(sentenceSnippet))].filter(Boolean).slice(0, 3);
  return `<section class="pros-cautions" id="pros-cautions"><div class="pros-panel"><span class="fit-label">${esc(currentLabel(article.language, '確認できる利点', 'Supported advantages'))}</span><ul>${pros.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div><div class="cautions-panel"><span class="fit-label">${esc(currentLabel(article.language, '契約前の注意点', 'Pre-purchase checks'))}</span><ul>${cautions.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div></section>`;
}

function renderArticleDates(article) {
  const published = formatDate(article.publishedAt, article.language);
  const updated = formatDate(article.updatedAt, article.language);
  const verified = formatDate(article.verifiedAt, article.language);
  const labels = article.language === 'ja'
    ? [['公開日', published], ['更新日', updated], ['公式情報確認日', verified]]
    : [['Published', published], ['Updated', updated], ['Official information checked', verified]];
  return `<dl class="article-date-grid">${labels.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`;
}

function renderClosingDecision(article, hasOffer) {
  const title = currentLabel(article.language, '次の行動', 'Next action');
  const text = hasOffer
    ? currentLabel(article.language, '申込前に料金・対象機能・契約期間を公式画面で確認してください。広告リンクは上部の案内欄にまとめています。', 'Before signing up, verify pricing, included features, and billing terms on the official page. The relevant link is grouped in the offer panel above.')
    : currentLabel(article.language, '公式情報と比較条件を再確認し、要件に合う候補だけを残してください。', 'Recheck the official information and comparison criteria, then shortlist only the options that meet your requirements.');
  return `<section class="closing-decision"><h2>${esc(title)}</h2><p>${esc(text)}</p>${hasOffer ? `<a class="closing-decision-link" href="#offer">${esc(currentLabel(article.language, '公式条件の確認欄へ戻る', 'Return to the official-offer panel'))} ↑</a>` : ''}</section>`;
}

function decisionSummary(article) {
  const conclusion = article.sections?.[0]?.body?.[0] || article.lead || article.description;
  const points = [...new Set((article.sections || []).flatMap(section => section.bullets || []))].slice(0, 3);
  const title = currentLabel(article.language, '先に結論', 'Decision summary');
  const list = points.length ? `<ul>${points.map(point => `<li>${esc(point)}</li>`).join('')}</ul>` : '';
  return `<section class="decision-summary" id="decision-summary"><span class="eyebrow">${esc(currentLabel(article.language, '判断の要点', 'Key decision'))}</span><h2>${esc(title)}</h2><p>${esc(conclusion)}</p>${list}</section>`;
}


function editorialEvaluation(article) {
  const sections = article.sections || [];
  const sourceCount = (article.sources || []).length;
  const tableCount = sections.filter(section => section.table).length;
  const bulletCount = sections.flatMap(section => section.bullets || []).length;
  const faqCount = (article.faqs || []).length;
  const text = sections.flatMap(section => [section.heading, ...(section.body || []), ...(section.bullets || [])]).join(' ').toLowerCase();
  const pricingSignals = (text.match(/料金|価格|費用|月額|年額|price|pricing|cost|billing/g) || []).length;
  const constraintSignals = (text.match(/注意|制約|弱点|対象外|解約|移行|上限|条件|caveat|constraint|limit|cancel|migration/g) || []).length;
  const scores = [
    Math.min(96, 66 + Math.min(sourceCount, 10) * 3),
    Math.min(96, 68 + Math.min(pricingSignals, 8) * 3 + Math.min(tableCount, 2) * 2),
    Math.min(96, 68 + Math.min(constraintSignals, 8) * 3),
    Math.min(96, 70 + Math.min(sections.length, 8) * 2 + Math.min(bulletCount, 6)),
    Math.min(96, 72 + Math.min(faqCount, 5) * 3 + (article.verifiedAt ? 5 : 0))
  ];
  const overall = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  return {overall, scores};
}

function renderEditorialScorecard(article) {
  if (article.type !== 'review') return '';
  const evaluation = editorialEvaluation(article);
  const labels = article.language === 'ja'
    ? ['公式情報網羅度', '料金条件の明確さ', '制約・注意点', '判断支援の充実度', '更新・検証管理']
    : ['Official-source coverage', 'Pricing clarity', 'Constraints and caveats', 'Decision support', 'Update and verification'];
  const rows = labels.map((label, index) => `<div class="score-row"><span>${esc(label)}</span><div class="score-track" aria-hidden="true"><i style="width:${evaluation.scores[index]}%"></i></div><strong>${evaluation.scores[index]}</strong></div>`).join('');
  const note = currentLabel(article.language,
    '記事内の公式出典、料金情報、制約説明、比較材料、確認日の充実度を共通ルールで採点した「記事の検証品質」です。サービス自体の性能や利用者満足度を示す点数ではありません。',
    'This is an evidence-quality score based on official sources, pricing detail, caveat coverage, decision support, and verification records. It does not measure product performance or customer satisfaction.');
  return `<section class="editorial-scorecard" id="editorial-score"><div class="score-overall"><span>${esc(currentLabel(article.language, '記事検証スコア', 'Evidence quality score'))}</span><strong>${evaluation.overall}<small>/100</small></strong></div><div class="score-details">${rows}</div><p>${esc(note)}</p></section>`;
}

function renderFitPanel(article) {
  const bullets = [...new Set((article.sections || []).flatMap(section => section.bullets || []))];
  const recommend = bullets.slice(0, 3);
  const fallbackRecommend = article.language === 'ja'
    ? ['公式情報を確認しながら比較したい人', '料金だけでなく運用条件も重視する人', '契約前に制約を整理したい人']
    : ['Readers comparing provider-owned information', 'Teams evaluating operating conditions as well as price', 'Buyers who want constraints clear before purchase'];
  const avoid = article.language === 'ja'
    ? ['要件を整理せず最安価格だけで決めたい人', '移行・解約・データ保持条件を確認しない人', '記事確認日以降の変更を公式画面で再確認できない人']
    : ['Buyers choosing only the lowest headline price', 'Teams that will not check migration, cancellation, or data-retention terms', 'Readers unable to recheck changes after the verification date'];
  const recommendedItems = (recommend.length ? recommend : fallbackRecommend).map(item => `<li>${esc(item)}</li>`).join('');
  return `<section class="fit-panel" id="fit"><div class="fit-column fit-positive"><span class="fit-label">${esc(currentLabel(article.language, '向いている人', 'Best suited for'))}</span><ul>${recommendedItems}</ul></div><div class="fit-column fit-caution"><span class="fit-label">${esc(currentLabel(article.language, '慎重に検討したい人', 'Consider alternatives if'))}</span><ul>${avoid.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div></section>`;
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
      : parts[1] === 'articles' ? 'articles' : parts[1] === 'topics' ? 'topics' : parts[1] === 'compare' ? 'compare' : '';
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
    html = html.replace(/\/assets\/js\/analytics-v4\.\d+\.\d+\.js/g, '/assets/js/analytics-v4.8.0.js');
    html = html.replace(/\/assets\/js\/main-v4\.\d+\.\d+\.js/g, '/assets/js/main-v4.7.0.js');
    html = html.replace(/\/assets\/js\/article-directory-v4\.\d+\.\d+\.js/g, '/assets/js/article-directory-v4.7.0.js');
    html = replaceOrInsertXDefault(html, defaultUrl);
    if (!/type=["']application\/rss\+xml["']/i.test(html)) {
      html = html.replace('</head>', `  <link rel="alternate" type="application/rss+xml" title="Luqevora.com ${language}" href="/feed-${language}.xml">\n</head>`);
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
  const luqviaServicePanel = renderLuqviaServicePanel(article);
  const sectionHasAffiliate = (article.sections || []).some(section => {
    const entry = configuredAffiliateEntry(section.affiliateMaterialKey || '', article.language);
    return entry?.type === 'rawHtml';
  });
  const hasAnyAffiliate = articleCtas.hasAffiliate || sectionHasAffiliate;
  const faqHtml = (article.faqs || []).length
    ? `<section id="faq"><h2>${currentLabel(article.language, 'よくある質問', 'Frequently asked questions')}</h2><div class="faq-list">${article.faqs.map(item => `<div class="faq-item"><h3>${esc(item.question)}</h3><p>${esc(item.answer)}</p></div>`).join('')}</div></section>`
    : '';
  const sourceHtml = (article.sources || []).length
    ? `<section id="sources"><h2>${currentLabel(article.language, '確認先となる公式情報', 'Official sources')}</h2><ul class="source-list">${article.sources.map(source => `<li><a data-link-position="official-sources" data-official-link="true" href="${esc(source.url)}" rel="noopener noreferrer" target="_blank">${esc(source.label)}</a></li>`).join('')}</ul></section>`
    : '';
  const related = semanticRelated(article);
  const topicUrl = topic ? `/${article.language}/topics/${topic.id}/` : `/${article.language}/articles/`;
  const relatedGroups = ['comparison', 'review', 'guide'].map(type => ({type, items: related.filter(item => item.type === type)})).filter(group => group.items.length);
  const linkedProducts = (productCatalog.products || []).filter(product => (product.relatedArticles || []).some(item => item.language === article.language && item.url === urlPath(article.language, article.category, article.slug))).slice(0, 3);
  const productHubHtml = linkedProducts.length ? `<div class="article-product-hubs"><h3>${currentLabel(article.language, '製品データも確認', 'Check product data')}</h3>${linkedProducts.map(product => `<a class="related-article-card" data-track-event="article_product_hub" data-link-position="article-related-product" data-product-id="${esc(product.id)}" href="/${article.language}/products/${product.id}/"><strong>${esc(product.name)}</strong><span>${esc(product.pricing?.[article.language] || product.positioning?.[article.language] || '')}</span></a>`).join('')}</div>` : '';
  const relatedHtml = `<section aria-labelledby="related-heading" class="related-articles-block"><div class="related-articles-heading"><h2 id="related-heading">${currentLabel(article.language, '次に読む記事', 'What to read next')}</h2><a href="${topicUrl}">${currentLabel(article.language, '目的別ガイドへ →', 'Topic guide →')}</a></div>${productHubHtml}${relatedGroups.map(group => `<div class="related-role-group"><h3>${esc(contentTypeLabel(group.type, article.language))}</h3><div class="related-articles-grid">${group.items.map(item => `<a class="related-article-card" href="${urlPath(item.language, item.category, item.slug)}"><strong>${esc(item.title)}</strong><span>${esc(seoDescription(item, seoConfig))}</span></a>`).join('')}</div></div>`).join('')}</section>`;
  const formattedVerified = formatDate(article.verifiedAt, article.language);
  const disclosure = article.affiliateDisclosure || hasAnyAffiliate
    ? `<div class="editorial-note disclosure-note"><p><strong>${currentLabel(article.language, '広告開示：', 'Affiliate disclosure:')}</strong> ${esc(affiliates.rules.sponsoredLabel[article.language])}</p></div>`
    : `<div class="editorial-note disclosure-note"><p><strong>${currentLabel(article.language, '広告開示：', 'Affiliate disclosure:')}</strong> ${currentLabel(article.language, '公開時点でアフィリエイトリンクを含みません。追加時はリンク付近と', 'No affiliate links are included as of publication. If added, they will be disclosed near the link and in our ')}<a href="/${article.language}/affiliate-disclosure/">${currentLabel(article.language, '広告掲載方針', 'Affiliate Disclosure')}</a>${currentLabel(article.language, 'で明示します。', ' page.')}</p></div>`;
  const editorialNote = `<div class="editorial-note"><p><strong>${currentLabel(article.language, '調査方針：', 'Research policy:')}</strong> ${currentLabel(article.language, `${article.title}について、記事末尾に示す提供元の公式情報を優先して確認しました。料金・機能・条件は契約前に公式画面で再確認してください。`, `For ${article.title}, we prioritized the provider-owned sources listed below. Recheck prices, features, and terms on the official site before purchase.`)}</p><p><strong>${currentLabel(article.language, '料金表記：', 'Pricing:')}</strong> ${currentLabel(article.language, '公式に円価格がある場合は円で掲載します。円価格がない場合は公式通貨を記載し、独自の為替換算は行いません。', 'We use the provider’s official currency and do not publish independent exchange-rate conversions.')}</p></div>`;
  const tocItems = [`<li><a href="#three-point-summary">${currentLabel(article.language, '3点要約', 'Three-point summary')}</a></li>`, `<li><a href="#decision-summary">${currentLabel(article.language, '先に結論', 'Decision summary')}</a></li>`];
  if (article.type === 'review') tocItems.push(`<li><a href="#editorial-score">${currentLabel(article.language, '編集評価', 'Editorial score')}</a></li>`);
  tocItems.push(`<li><a href="#pros-cautions">${currentLabel(article.language, '利点と注意点', 'Advantages and cautions')}</a></li>`);
  tocItems.push(`<li><a href="#fit">${currentLabel(article.language, '向いている人', 'Best fit')}</a></li>`);
  tocItems.push(...(article.sections || []).map((section, index) => `<li><a href="#section-${index + 1}">${esc(section.heading)}</a></li>`));
  if (luqviaServicePanel) tocItems.push('<li><a href="#luqvia-service">LuQviaのHP制作</a></li>');
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
    publishedLabel: currentLabel(article.language, `公式情報確認：${formattedVerified}`, `Official information checked: ${formattedVerified}`),
    articleDates: renderArticleDates(article),
    authorLabel: currentLabel(article.language, `執筆：${article.author || site.organization.name}`, `By ${article.author || site.organization.name}`),
    heroAffiliateDisclosure: hasAnyAffiliate ? `<p class="hero-affiliate-disclosure"><strong>${currentLabel(article.language, '広告', 'Advertisement')}</strong> ${esc(affiliates.rules.sponsoredLabel[article.language])}</p>` : '',
    featuredImage: decision.indexable ? `<figure class="article-featured-image"><img alt="${esc(article.title)}" decoding="async" fetchpriority="high" height="${seoConfig.images.height}" src="${imagePath}" width="${seoConfig.images.width}"><figcaption>${esc(currentLabel(article.language, `${article.title}の判断ポイントを示すオリジナル画像`, `Original visual for ${article.title}`))}</figcaption></figure>` : '',
    threePointSummary: renderThreePointSummary(article),
    decisionSummary: decisionSummary(article),
    editorialScorecard: renderEditorialScorecard(article),
    prosCautions: renderProsCautions(article),
    fitPanel: renderFitPanel(article),
    editorialNote,
    affiliateDisclosure: disclosure,
    articleCtas: articleCtas.html,
    body: (article.sections || []).map((section, index) => renderSection(section, index, article.language)).join(''),
    luqviaServicePanel,
    faq: faqHtml,
    evidencePanel: evidencePanel(article, topic),
    sources: sourceHtml,
    closingDecision: renderClosingDecision(article, Boolean(articleCtas.html)),
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
  const topicIndexTitle = currentLabel(language, '目的別ツール選びガイド | Luqevora.com', 'Tool Guides by Goal | Luqevora.com');
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
    const pageTitle = `${topic.name[language]} | Luqevora.com`;
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
    const pageTitle = `${category.name[language]} | Luqevora.com`;
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
    const comparisonRecords = records.filter(record => record.type === 'comparison');
    const reviewRecords = records.filter(record => record.type === 'review');
    const guideRecords = records.filter(record => record.type === 'guide');
    const categoryMix = `<div class="category-mix-grid"><a href="/${language}/articles/?category=${esc(category.id)}&type=comparison"><strong>${comparisonRecords.length}</strong><span>${currentLabel(language, '比較記事', 'Comparisons')}</span></a><a href="/${language}/articles/?category=${esc(category.id)}&type=review"><strong>${reviewRecords.length}</strong><span>${currentLabel(language, '個別レビュー', 'Reviews')}</span></a><a href="/${language}/articles/?category=${esc(category.id)}&type=guide"><strong>${guideRecords.length}</strong><span>${currentLabel(language, '実践ガイド', 'Guides')}</span></a></div>`;
    const featuredCategoryRecords = [...comparisonRecords.slice(0, 3), ...reviewRecords.slice(0, 3)].slice(0, 6);
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
      articlesLead: currentLabel(language, '公開中の比較・レビュー・ガイドを、新しい確認日順に表示します。', 'Published comparisons, reviews, and guides are listed by latest verification date.'),
      categoryMix,
      featuredTitle: currentLabel(language, 'まず読むべき比較・レビュー', 'Start with these comparisons and reviews'),
      featuredLead: currentLabel(language, '選択肢を絞り込むために、比較記事と主要レビューを先に確認できます。', 'Use these comparisons and core reviews to narrow your shortlist.'),
      featuredCards: featuredCategoryRecords.map(record => renderDirectoryCard(record, language).replace('article-directory-card', 'category-featured-card')).join(''),
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
  const pageTitle = currentLabel(language, 'AI・SaaS・Webサービス比較 | Luqevora.com', 'AI, SaaS & Web Service Comparisons | Luqevora.com');
  const description = currentLabel(language, `AI・SaaS・Webサービスの比較、レビュー、ガイドを${records.length}件掲載。公式情報を基に料金・機能・制約を整理します。`, `Explore ${records.length} AI, SaaS, and web-service comparisons, reviews, and guides based on provider-owned pricing, feature, and policy sources.`);
  const comparisons = configuredHomeRecords(records, 'comparison', homeConfig.featuredComparisons, 5);
  const reviews = configuredHomeRecords(records, 'review', homeConfig.featuredReviews, 6);
  const categoryIcons = {'ai-tools': 'AI', 'website-builders': 'WEB', 'seo-marketing': 'SEO', 'business-software': 'OPS', 'hosting-security': 'SEC'};
  const categoryCards = categories.map(category => {
    const count = records.filter(record => record.category === category.id).length;
    return `<a class="card category-summary-card" data-category-count="${count}" data-category-id="${esc(category.id)}" href="/${language}/${category.path}/"><span class="arrow" aria-hidden="true">↗</span><span class="card-icon">${esc(categoryIcons[category.id] || category.id.slice(0, 3).toUpperCase())}</span><h3>${esc(category.name[language])}</h3><p>${esc(category.description?.[language] || '')}</p><span class="category-count">${esc(currentLabel(language, `${count} 件`, `${count} articles`))}</span></a>`;
  }).join('');
  const personaLinks = [
    {label: currentLabel(language, 'はじめて導入する', 'First-time buyer'), text: currentLabel(language, '使いやすさと初期費用から選ぶ', 'Prioritize ease of use and setup cost'), url: `/${language}/topics/website-builders/`},
    {label: currentLabel(language, '法人・チームで使う', 'Business and teams'), text: currentLabel(language, '権限、管理、サポートを確認', 'Check administration, permissions, and support'), url: `/${language}/business-software/`},
    {label: currentLabel(language, '店舗・ECを作る', 'Storefront and ecommerce'), text: currentLabel(language, '予約、決済、運用負荷を比較', 'Compare booking, payments, and operating effort'), url: `/${language}/topics/ecommerce-platforms/`},
    {label: currentLabel(language, '集客を強化する', 'Grow acquisition'), text: currentLabel(language, 'SEO、メール、分析ツールを探す', 'Explore SEO, email, and analytics tools'), url: `/${language}/seo-marketing/`}
  ].map(item => `<a class="persona-card" href="${item.url}"><strong>${esc(item.label)}</strong><span>${esc(item.text)}</span><i aria-hidden="true">→</i></a>`).join('');
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
    articleCountLabel: currentLabel(language, '公開中の記事', 'published articles'),
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
    personaEyebrow: currentLabel(language, '利用目的', 'Your goal'),
    personaTitle: currentLabel(language, '自分に近い入口から選ぶ', 'Choose the path that matches your situation'),
    personaLead: currentLabel(language, '製品名が決まっていなくても、導入目的から比較記事へ進めます。', 'You can start from your goal even when you have not chosen a product.'),
    personaLinks,
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
  const pageTitle = currentLabel(language, '記事一覧・ツールレビュー検索 | Luqevora.com', 'All Comparisons and Tool Reviews | Luqevora.com');
  const description = currentLabel(language, `公開中の${records.length}件の比較記事・個別レビュー・ガイドを、カテゴリ・記事種別・キーワードで探せます。`, `Search ${records.length} published Luqevora.com comparisons, product reviews, and guides by category, content type, topic, or keyword.`);
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


function productCategoryLabel(product, language) {
  return product.categoryName?.[language] || product.category;
}

function productFlagBadges(product, language) {
  const labels = {
    freeOption: currentLabel(language, '無料枠あり', 'Free option'),
    business: currentLabel(language, '法人・チーム', 'Business / team'),
    ecommerce: currentLabel(language, 'EC対応', 'Ecommerce'),
    wordpress: 'WordPress',
    seo: 'SEO',
    integrations: currentLabel(language, '外部連携', 'Integrations'),
    mobile: currentLabel(language, 'モバイル対応', 'Mobile')
  };
  return Object.entries(product.flags || {}).filter(([, enabled]) => enabled).slice(0, 5).map(([key]) => `<span>${esc(labels[key])}</span>`).join('');
}

function renderProductCard(product, language) {
  const related = (product.relatedArticles || []).filter(item => item.language === language).slice(0, 3);
  const official = (product.sources || []).slice(0, 2);
  const search = [product.name, product.positioning?.[language], product.pricing?.[language], product.bestFor?.[language], ...(product.strengths?.[language] || []), ...(product.limits?.[language] || [])].filter(Boolean).join(' ');
  const relatedLinks = related.map(item => `<a href="${esc(item.url)}">${esc(item.title)}</a>`).join('');
  const officialLinks = official.map(item => `<a href="${esc(item.url)}" rel="noopener noreferrer">${esc(item.label)}</a>`).join('');
  return `<article id="${esc(product.id)}" class="product-data-card" data-product-card data-category="${esc(product.category)}" data-pricing="${esc(product.pricingModel)}" data-search="${esc(search)}"><div class="product-data-head"><div><span class="eyebrow">${esc(productCategoryLabel(product, language))}</span><h2>${esc(product.name)}</h2></div><div class="product-data-badges">${productFlagBadges(product, language)}</div></div><p>${esc(product.positioning?.[language] || '')}</p><dl class="product-data-list"><div><dt>${esc(currentLabel(language, '料金概要', 'Pricing'))}</dt><dd>${esc(product.pricing?.[language] || '')}</dd></div><div><dt>${esc(currentLabel(language, '向いている用途', 'Best for'))}</dt><dd>${esc(product.bestFor?.[language] || '')}</dd></div><div><dt>${esc(currentLabel(language, '主な強み', 'Strengths'))}</dt><dd>${esc((product.strengths?.[language] || []).join('・'))}</dd></div><div><dt>${esc(currentLabel(language, '確認事項', 'Caveats'))}</dt><dd>${esc((product.limits?.[language] || []).join('・'))}</dd></div></dl><div class="product-data-links">${relatedLinks}${officialLinks}</div><p class="product-source-note">${esc(currentLabel(language, `公式出典 ${product.sources?.length || 0}件・最終確認 ${product.lastVerified}`, `${product.sources?.length || 0} official sources · verified ${product.lastVerified}`))}</p></article>`;
}

for (const language of site.languages) {
  const canonical = `${site.baseUrl}/${language}/compare/`;
  const products = productCatalog.products || [];
  const categoryOptions = [`<option value="">${esc(currentLabel(language, 'すべてのカテゴリ', 'All categories'))}</option>`, ...categories.map(category => `<option value="${esc(category.id)}">${esc(category.name[language])}</option>`)].join('');
  const pricingOptions = language === 'ja'
    ? '<option value="">すべての料金体系</option><option value="freemium">無料枠あり</option><option value="subscription">定額制</option><option value="usage">従量課金</option><option value="contact-or-variable">要確認・変動</option>'
    : '<option value="">All pricing models</option><option value="freemium">Free option</option><option value="subscription">Subscription</option><option value="usage">Usage based</option><option value="contact-or-variable">Variable / contact</option>';
  const graph = {'@context':'https://schema.org','@graph':[
    {'@type':'CollectionPage','@id':`${canonical}#webpage`,url:canonical,name:currentLabel(language,'製品比較データベース','Product comparison database'),description:currentLabel(language,'AI・SaaS・Webサービスの料金、用途、制約、公式出典を共通項目で比較できます。','Compare pricing, use cases, constraints, and official sources for AI, SaaS, and web services.'),inLanguage:language,isPartOf:{'@id':`${site.baseUrl}/#website`}},
    {'@type':'ItemList',numberOfItems:products.length,itemListElement:products.map((product,index)=>({'@type':'ListItem',position:index+1,name:product.name,url:canonical+`#${product.id}`}))},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Luqevora.com',item:`${site.baseUrl}/${language}/`},{'@type':'ListItem',position:2,name:currentLabel(language,'製品比較DB','Product Database'),item:canonical}]}
  ]};
  const page = render(templates.compare, {
    lang: language,
    metaTitle: esc(currentLabel(language, '製品比較データベース｜料金・用途・制約を一覧比較 | Luqevora.com', 'Product Comparison Database: Pricing, Use Cases and Limits | Luqevora.com')),
    description: esc(currentLabel(language, `${products.length}製品の料金概要、対象用途、強み、制約、公式出典を共通項目で比較できます。`, `Compare pricing, best-fit use cases, strengths, constraints, and official sources across ${products.length} products.`)),
    canonical,
    hreflang: localizedHreflang('compare'),
    ogImage: `${site.baseUrl}/assets/images/og-default.png`,
    structuredData: JSON.stringify(graph),
    header: header(language, 'compare', `/${language === 'ja' ? 'en' : 'ja'}/compare/`),
    breadcrumbAriaLabel: currentLabel(language, 'パンくずリスト', 'Breadcrumb'),
    breadcrumbCurrent: currentLabel(language, '製品比較DB', 'Product Database'),
    eyebrow: currentLabel(language, '共通データモデル v3.0', 'Shared data model v3.0'),
    title: currentLabel(language, '製品比較データベース', 'Product comparison database'),
    lead: currentLabel(language, '料金概要、利用目的、強み、制約、公式出典を同じ項目で確認できます。数値の性能評価ではなく、契約前の候補整理に使うデータベースです。', 'Review pricing summaries, use cases, strengths, constraints, and official sources using consistent fields. This database supports shortlisting rather than claiming performance scores.'),
    stats: `<div class="catalog-stat"><strong>${products.length}</strong><span>${esc(currentLabel(language,'登録製品','products'))}</span></div><div class="catalog-stat"><strong>${categories.length}</strong><span>${esc(currentLabel(language,'カテゴリ','categories'))}</span></div><div class="catalog-stat"><strong>${products.reduce((sum,p)=>sum+(p.sources?.length||0),0)}</strong><span>${esc(currentLabel(language,'公式出典','official sources'))}</span></div>`,
    searchLabel: currentLabel(language, '製品・用途・機能を検索', 'Search products, use cases, or features'),
    searchPlaceholder: currentLabel(language, '例：WordPress、店舗、無料、AI', 'Example: WordPress, ecommerce, free, AI'),
    categoryLabel: currentLabel(language, 'カテゴリ', 'Category'),
    categoryOptions,
    pricingLabel: currentLabel(language, '料金体系', 'Pricing model'),
    pricingOptions,
    resetLabel: currentLabel(language, '条件をリセット', 'Reset filters'),
    productCount: products.length,
    resultLabel: currentLabel(language, '件を表示', 'products shown'),
    productCards: products.map(product => renderProductCard(product, language)).join(''),
    emptyLabel: currentLabel(language, '条件に一致する製品がありません。', 'No products match these filters.'),
    methodEyebrow: currentLabel(language, 'データの読み方', 'How to use the data'),
    methodTitle: currentLabel(language, '公式情報の確認を前提に候補を絞る', 'Shortlist first, then verify official terms'),
    methodText: currentLabel(language, '料金と機能は変更されるため、このページは比較軸を揃えるために使用し、契約直前には各公式ページで最新条件を確認してください。', 'Pricing and features change. Use this page to normalize comparison criteria, then confirm current terms on each official site before purchase.'),
    methodChecks: [currentLabel(language,'料金概要は一元管理','Pricing summaries are centralized'),currentLabel(language,'強み・制約を同じ項目で表示','Strengths and caveats use shared fields'),currentLabel(language,'性能スコアや利用体験は捏造しない','No invented performance or experience scores')].map(item=>`<li>${esc(item)}</li>`).join(''),
    footer: footer(language)
  });
  await writeFile(path.join(outputRoot, language, 'compare', 'index.html'), page);
}


const productById = new Map((productCatalog.products || []).map(product => [product.id, product]));
const diagnosisGoalOptions = language => categories.map(category => `<label><input type="radio" name="goal" value="${esc(category.id)}">${esc(category.name[language])}</label>`).join('');
const diagnosisBudgetOptions = language => [
  ['any', currentLabel(language, '指定なし', 'Any')],
  ['free', currentLabel(language, '無料から試したい', 'Start free')],
  ['paid', currentLabel(language, '有料前提で比較', 'Paid options')]
].map(([value,label]) => `<label><input type="radio" name="budget" value="${value}"${value==='any'?' checked':''}>${esc(label)}</label>`).join('');
const diagnosisPriorityOptions = language => [
  ['support', currentLabel(language, 'サポート', 'Support')],
  ['easy', currentLabel(language, '使いやすさ', 'Ease of use')],
  ['team', currentLabel(language, 'チーム運用', 'Team workflow')],
  ['seo', 'SEO']
].map(([value,label]) => `<label><input type="radio" name="priority" value="${value}">${esc(label)}</label>`).join('');
const diagnosisSwitches = language => [
  ['freeOption', currentLabel(language, '無料枠が必要', 'Free option required')],
  ['wordpress', 'WordPress'], ['ecommerce', 'EC / Ecommerce'],
  ['business', currentLabel(language, '法人・チーム向け', 'Business / team')],
  ['integrations', currentLabel(language, '外部連携', 'Integrations')],
  ['mobile', currentLabel(language, 'モバイル対応', 'Mobile support')]
].map(([value,label]) => `<label><input type="checkbox" name="${value}" value="1">${esc(label)}</label>`).join('');

for (const language of site.languages) {
  const canonical = `${site.baseUrl}/${language}/diagnosis/`;
  const title = currentLabel(language, 'サービス選び診断｜用途と条件から候補を絞る | Luqevora.com', 'Product Finder: Shortlist Services by Need | Luqevora.com');
  const description = currentLabel(language, '用途、予算、必要機能からLuqevora.comの製品データベースを絞り込み、候補と注意点を表示します。', 'Use goals, budget, and required features to shortlist products from the Luqevora.com database.');
  const graph = {'@context':'https://schema.org','@type':'WebApplication',name:title,url:canonical,description,inLanguage:language,applicationCategory:'BusinessApplication',isAccessibleForFree:true};
  const page = render(templates.diagnosis, {
    lang:language, metaTitle:esc(title), description:esc(description), canonical,
    hreflang:localizedHreflang('diagnosis'), ogImage:`${site.baseUrl}/assets/images/og-default.png`, structuredData:JSON.stringify(graph),
    header:header(language,'diagnosis',`/${language==='ja'?'en':'ja'}/diagnosis/`), footer:footer(language),
    eyebrow:currentLabel(language,'比較データベース連動 v3.1','Database-powered v3.1'),
    title:currentLabel(language,'用途と条件からサービス候補を絞る','Find products that match your needs'),
    lead:currentLabel(language,'結果は契約を保証するランキングではありません。共通データを基に候補を整理し、公式条件を確認するための診断です。','Results are a shortlist, not a guaranteed ranking. Verify current terms with each provider.'),
    goalLabel:currentLabel(language,'主な目的・カテゴリ','Primary goal or category'), goalOptions:diagnosisGoalOptions(language),
    budgetLabel:currentLabel(language,'予算の考え方','Budget preference'), budgetOptions:diagnosisBudgetOptions(language),
    priorityLabel:currentLabel(language,'重視する要素','Main priority'), priorityOptions:diagnosisPriorityOptions(language), switches:diagnosisSwitches(language),
    submitLabel:currentLabel(language,'候補を表示','Show recommendations'), resetLabel:currentLabel(language,'リセット','Reset'),
    resultTitle:currentLabel(language,'条件に近い候補','Closest matches'), resultLead:currentLabel(language,'推奨理由と注意点を確認し、製品詳細と公式情報で最終判断してください。','Review the rationale and cautions, then verify details and official terms.'),
    catalog:JSON.stringify(productCatalog).replace(/</g,'\\u003c')
  });
  await writeFile(path.join(outputRoot, language, 'diagnosis', 'index.html'), page);

  for (const product of productCatalog.products || []) {
    const pCanonical = `${site.baseUrl}/${language}/products/${product.id}/`;
    const pTitle = `${product.name}${currentLabel(language,'の料金・用途・注意点',' pricing, use cases and cautions')} | Luqevora.com`;
    const pDescription = `${product.positioning?.[language] || product.name}。${product.pricing?.[language] || ''}`;
    const related = (product.relatedArticles || []).filter(article => article.language === language).slice(0,8);
    const productGraph = {'@context':'https://schema.org','@graph':[
      {'@type':'Product','@id':`${pCanonical}#product`,name:product.name,description:product.positioning?.[language],category:product.categoryName?.[language],url:pCanonical},
      {'@type':'WebPage','@id':`${pCanonical}#webpage`,url:pCanonical,name:pTitle,description:pDescription,inLanguage:language,mainEntity:{'@id':`${pCanonical}#product`}},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Luqevora.com',item:`${site.baseUrl}/${language}/`},{'@type':'ListItem',position:2,name:currentLabel(language,'製品比較DB','Product Database'),item:`${site.baseUrl}/${language}/compare/`},{'@type':'ListItem',position:3,name:product.name,item:pCanonical}]}
    ]};
    const facts = `<dl class="product-facts"><div><dt>${currentLabel(language,'カテゴリ','Category')}</dt><dd>${esc(product.categoryName?.[language] || product.category)}</dd></div><div><dt>${currentLabel(language,'料金体系','Pricing model')}</dt><dd>${esc(product.pricingModel)}</dd></div><div><dt>${currentLabel(language,'最終確認','Last verified')}</dt><dd>${esc(product.lastVerified)}</dd></div><div><dt>${currentLabel(language,'公式出典','Official sources')}</dt><dd>${product.sources?.length || 0}</dd></div></dl>`;
    const page = render(templates.product, {
      lang:language,metaTitle:esc(pTitle),description:esc(pDescription),canonical:pCanonical,hreflang:localizedHreflang(`products/${product.id}`),ogImage:`${site.baseUrl}/assets/images/og-default.png`,structuredData:JSON.stringify(productGraph),
      header:header(language,'compare',`/${language==='ja'?'en':'ja'}/products/${product.id}/`),footer:footer(language),databaseLabel:currentLabel(language,'製品比較DB','Product Database'),eyebrow:esc(product.categoryName?.[language] || product.category),name:esc(product.name),positioning:esc(product.positioning?.[language] || ''),
      stats:`<div class="catalog-stat"><strong>${product.sources?.length || 0}</strong><span>${currentLabel(language,'公式出典','official sources')}</span></div><div class="catalog-stat"><strong>${related.length}</strong><span>${currentLabel(language,'関連記事','related articles')}</span></div>`,
      overviewTitle:currentLabel(language,'製品概要','Overview'),workflow:esc(product.workflow?.[language] || ''),pricingTitle:currentLabel(language,'料金の確認ポイント','Pricing'),pricingDetail:esc(product.pricingDetail?.[language] || product.pricing?.[language] || ''),bestForTitle:currentLabel(language,'向いている用途','Best fit'),bestFor:esc(product.bestFor?.[language] || ''),strengthsTitle:currentLabel(language,'確認できる強み','Documented strengths'),limitsTitle:currentLabel(language,'契約前の注意点','Cautions before purchase'),strengths:(product.strengths?.[language]||[]).map(x=>`<li>${esc(x)}</li>`).join(''),limits:(product.limits?.[language]||[]).map(x=>`<li>${esc(x)}</li>`).join(''),factsTitle:currentLabel(language,'共通データ','Shared data'),facts,compareLabel:currentLabel(language,'比較データで確認','Open comparison data'),diagnosisLabel:currentLabel(language,'用途診断を使う','Use product finder'),id:esc(product.id),articlesTitle:currentLabel(language,'関連する比較・レビュー','Related comparisons and reviews'),articles:related.map(a=>`<a class="related-article-card" href="${esc(a.url)}"><strong>${esc(a.title)}</strong><span>${esc(contentTypeLabel(a.type,language))}</span></a>`).join('') || `<p>${currentLabel(language,'関連記事は準備中です。','Related articles are being prepared.')}</p>`,sourcesTitle:currentLabel(language,'公式情報','Official sources'),sources:(product.sources||[]).map(src=>`<li><a href="${esc(src.url)}" rel="noopener noreferrer" target="_blank">${esc(src.label)}</a></li>`).join('')
    });
    await writeFile(path.join(outputRoot, language, 'products', product.id, 'index.html'), page);
  }
}


const comparisonLandings = [
  {id:'free', test:p=>p.flags?.freeOption, ja:'無料から試せるWeb・SaaSサービス', en:'Web and SaaS products with free options'},
  {id:'wordpress', test:p=>p.flags?.wordpress, ja:'WordPress対応サービス比較', en:'WordPress-compatible services'},
  {id:'ecommerce', test:p=>p.flags?.ecommerce, ja:'EC・ネットショップ対応サービス比較', en:'Ecommerce-capable services'},
  {id:'business', test:p=>p.flags?.business, ja:'法人・チーム向けサービス比較', en:'Business and team products'},
  {id:'integrations', test:p=>p.flags?.integrations, ja:'外部連携に対応するサービス比較', en:'Products with integrations'},
  {id:'mobile', test:p=>p.flags?.mobile, ja:'モバイル対応サービス比較', en:'Mobile-capable services'}
];
for (const language of site.languages) {
  for (const landing of comparisonLandings) {
    const products=(productCatalog.products||[]).filter(landing.test);
    const canonical=`${site.baseUrl}/${language}/compare/${landing.id}/`;
    const title=`${landing[language]} | Luqevora.com`;
    const description=currentLabel(language,`${products.length}製品を共通データで比較。料金、用途、制約、公式出典を確認できます。`,`Compare ${products.length} products using shared fields for pricing, use cases, constraints, and official sources.`);
    const graph={'@context':'https://schema.org','@type':'CollectionPage',url:canonical,name:title,description,inLanguage:language,mainEntity:{'@type':'ItemList',numberOfItems:products.length,itemListElement:products.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:`${site.baseUrl}/${language}/products/${p.id}/`}))}};
    const page=render(templates.compare,{lang:language,metaTitle:esc(title),description:esc(description),canonical,hreflang:localizedHreflang(`compare/${landing.id}`),ogImage:`${site.baseUrl}/assets/images/og-default.png`,structuredData:JSON.stringify(graph),header:header(language,'compare',`/${language==='ja'?'en':'ja'}/compare/${landing.id}/`),breadcrumbAriaLabel:currentLabel(language,'パンくずリスト','Breadcrumb'),breadcrumbCurrent:esc(landing[language]),eyebrow:currentLabel(language,'条件別比較 v3.1','Curated comparison v3.1'),title:esc(landing[language]),lead:esc(description),stats:`<div class="catalog-stat"><strong>${products.length}</strong><span>${currentLabel(language,'対象製品','matching products')}</span></div>`,searchLabel:currentLabel(language,'製品・用途・機能を検索','Search products, use cases, or features'),searchPlaceholder:currentLabel(language,'製品名や用途','Product or use case'),categoryLabel:currentLabel(language,'カテゴリ','Category'),categoryOptions:`<option value="">${currentLabel(language,'すべてのカテゴリ','All categories')}</option>`,pricingLabel:currentLabel(language,'料金体系','Pricing model'),pricingOptions:`<option value="">${currentLabel(language,'すべての料金体系','All pricing models')}</option>`,resetLabel:currentLabel(language,'条件をリセット','Reset filters'),productCount:products.length,resultLabel:currentLabel(language,'件を表示','products shown'),productCards:products.map(product=>renderProductCard(product,language)).join(''),emptyLabel:currentLabel(language,'条件に一致する製品がありません。','No products match these filters.'),methodEyebrow:currentLabel(language,'確認方法','How to verify'),methodTitle:currentLabel(language,'公式条件で最終確認','Verify current official terms'),methodText:currentLabel(language,'掲載条件は共通データから抽出しています。契約前に公式料金・機能・利用条件を再確認してください。','These pages are generated from shared data. Recheck official pricing, features, and terms before purchase.'),methodChecks:[currentLabel(language,'共通項目で比較','Consistent fields'),currentLabel(language,'製品詳細へ接続','Links to product hubs'),currentLabel(language,'公式出典を明示','Official sources shown')].map(x=>`<li>${esc(x)}</li>`).join(''),footer:footer(language)});
    await writeFile(path.join(outputRoot,language,'compare',landing.id,'index.html'),page);
  }
}

await writeFile(path.join(outputRoot, 'product-catalog.json'), `${JSON.stringify(productCatalog, null, 2)}\n`);

await generateStoreDxPlatform({root, outputRoot, site, productCatalog, articleRecords, renderDirectoryCard, header, footer, currentLabel, esc, writeFile});

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
  const records = articleRecords.filter(record => record.language === language).slice(0, 100);
  const title = currentLabel(language, 'Luqevora.com 最新記事', 'Luqevora.com Latest Articles');
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
  productCatalogCount: productCatalog.productCount,
  productCatalogSources: productCatalog.products.reduce((sum, product) => sum + (product.sources?.length || 0), 0),
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
