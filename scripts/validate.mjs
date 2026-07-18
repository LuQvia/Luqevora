import fs from 'node:fs/promises';
import path from 'node:path';
import {root, walk, readJson, writeFile} from './lib.mjs';
import {loadArticleEntries} from './load-articles.mjs';
import {buildIndexDecisions} from './seo.mjs';

const site = await readJson(path.join(root, 'content/config/site.json'));
const categories = await readJson(path.join(root, 'content/config/categories.json'));
const affiliates = await readJson(path.join(root, 'content/config/affiliates.json'));
const homeConfig = await readJson(path.join(root, 'content/config/home.json'));
const topics = await readJson(path.join(root, 'content/config/topics.json'));
const seoConfig = await readJson(path.join(root, 'content/config/seo.json'));
const outputRoot = path.join(root, site.outputDirectory);
const htmlFiles = (await walk(outputRoot)).filter(file => file.endsWith('.html'));
const allPublicFiles = new Set((await walk(outputRoot)).map(file => path.resolve(file)));
const errors = [];
const warnings = [];
const canonicals = new Map();
const indexableCanonicals = new Set();
const htmlCache = new Map();
const indexableArticleImages = new Map();

if (!/^\d{4}-\d{2}-\d{2}$/.test(site.defaultVerifiedAt || '')) {
  addError('content/config/site.json', 'defaultVerifiedAt must use YYYY-MM-DD');
}
for (const [key, expected] of [['featuredComparisons', 5], ['featuredReviews', 6]]) {
  const slugs = homeConfig[key];
  if (!Array.isArray(slugs) || slugs.length !== expected || new Set(slugs).size !== slugs.length) {
    addError('content/config/home.json', `${key} must contain ${expected} unique slugs`);
  }
}

for (const [key, entry] of Object.entries(affiliates.links || {})) {
  if (typeof entry === 'string') continue;
  if (entry?.type !== 'rawHtml') continue;
  const raw = String(entry.rawHtml || '');
  if (!entry.network || !entry.programId || !entry.destination) addError('content/config/affiliates.json', `${key}: raw affiliate material requires network, programId, and destination`);
  if (/<script\b|javascript:|\son[a-z]+\s*=/i.test(raw)) addError('content/config/affiliates.json', `${key}: unsafe raw affiliate markup`);
  if (!/<a\b[^>]*href=["']https:\/\/px\.a8\.net\/svt\/ejp\?[^"']+["'][^>]*rel=["'][^"']*nofollow[^"']*["'][^>]*>/i.test(raw)) addError('content/config/affiliates.json', `${key}: missing A8 anchor or nofollow`);
  if (!/<img\b[^>]*src=["']https:\/\/www\d+\.a8\.net\/0\.gif\?[^"']+["'][^>]*>/i.test(raw)) addError('content/config/affiliates.json', `${key}: missing A8 tracking pixel`);
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match?.[2] || '';
}

function decodeHtml(value = '') {
  const named = {amp: '&', quot: '"', apos: "'", '#39': "'", lt: '<', gt: '>', nbsp: ' '};
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, key) => {
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

function metaContent(html, key, value) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attribute(match[0], key) === value) return decodeHtml(attribute(match[0], 'content'));
  }
  return '';
}

function linkHref(html, relation) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attribute(match[0], 'rel').split(/\s+/).includes(relation)) return attribute(match[0], 'href');
  }
  return '';
}

function hreflangHref(html, language) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attribute(match[0], 'hreflang').toLowerCase() === language.toLowerCase()) return decodeHtml(attribute(match[0], 'href'));
  }
  return '';
}

function addError(file, error) {
  errors.push({file: file.replaceAll('\\', '/'), error});
}

function isNoIndex(html) {
  return metaContent(html, 'name', 'robots').toLowerCase().split(/[\s,]+/).includes('noindex');
}

function localTarget(url) {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean || !clean.startsWith('/') || clean.startsWith('//')) return '';
  let relative = clean.replace(/^\/+/, '');
  if (!relative || clean.endsWith('/')) relative = path.join(relative, 'index.html');
  return path.resolve(outputRoot, relative);
}

for (const file of htmlFiles) {
  const relative = `/${path.relative(outputRoot, file).replaceAll('\\', '/')}`;
  const html = await fs.readFile(file, 'utf8');
  htmlCache.set(file, html);
  if (!/<!doctype html>/i.test(html)) addError(relative, 'Missing doctype');
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) addError(relative, 'Missing html lang');
  if (!/<title>\s*[\s\S]*?\S[\s\S]*?<\/title>/i.test(html)) addError(relative, 'Missing title');
  if (!metaContent(html, 'name', 'description').trim()) addError(relative, 'Missing meta description');
  const canonical = linkHref(html, 'canonical');
  if (!canonical) addError(relative, 'Missing canonical');
  if (!/<h1\b[^>]*>[\s\S]*?\S[\s\S]*?<\/h1>/i.test(html)) addError(relative, 'Missing H1');
  if (/{{[A-Za-z0-9_]+}}/.test(html)) addError(relative, 'Unresolved template placeholder');
  if (/<html\b[^>]*\blang=["']en["']/i.test(html) && html.includes('：')) addError(relative, 'English page contains a full-width Japanese colon');
  if (html.includes('https://px.a8.net/svt/ejp?')) {
    if (!/class=["'][^"']*hero-affiliate-disclosure/i.test(html)) addError(relative, 'A8 affiliate page is missing first-view advertising disclosure');
    if (!/https:\/\/www\d+\.a8\.net\/0\.gif\?/i.test(html)) addError(relative, 'A8 affiliate page is missing tracking pixel');
    if (!/data-affiliate-key=["'][^"']+["']/i.test(html)) addError(relative, 'A8 affiliate material is missing analytics wrapper');
  }

  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/gi)].map(match => match[1]);
  const seenIds = new Set();
  for (const id of ids) {
    if (seenIds.has(id)) addError(relative, `Duplicate id: ${id}`);
    seenIds.add(id);
  }

  if (canonical) {
    if (!canonical.startsWith(site.baseUrl)) addError(relative, 'Canonical outside base URL');
    if (canonicals.has(canonical)) addError(relative, `Duplicate canonical with ${canonicals.get(canonical)}`);
    canonicals.set(canonical, relative);
    if (!isNoIndex(html)) indexableCanonicals.add(canonical);
  }

  const localized = canonical.match(new RegExp(`^${site.baseUrl}/(ja|en)(/.*)$`));
  if (localized) {
    const expectedDefault = `${site.baseUrl}/${site.defaultLanguage}${localized[2]}`;
    const actualDefault = hreflangHref(html, 'x-default');
    if (actualDefault !== expectedDefault) addError(relative, `x-default is ${actualDefault || 'missing'}; expected ${expectedDefault}`);
  }

  const articleRoute = relative.match(/^\/(ja|en)\/([^/]+)\/([^/]+)\/index\.html$/);
  if (articleRoute && categories.some(category => category.id === articleRoute[2]) && !isNoIndex(html)) {
    const image = metaContent(html, 'property', 'og:image');
    if (!image.includes('/assets/images/articles/')) addError(relative, 'Indexable article must use its own article image');
    if (indexableArticleImages.has(image)) addError(relative, `Article image is reused by ${indexableArticleImages.get(image)}`);
    indexableArticleImages.set(image, relative);
    const target = image.startsWith(site.baseUrl) ? localTarget(image.slice(site.baseUrl.length)) : localTarget(image);
    if (!target || !allPublicFiles.has(target)) addError(relative, `Article image is missing: ${image}`);
    if (!html.includes('article-featured-image')) addError(relative, 'Indexable article is missing the featured image');
  }

  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(script[1]);
    } catch (error) {
      addError(relative, `Invalid JSON-LD: ${error.message}`);
    }
  }

  for (const match of html.matchAll(/<(?:a|link)\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const target = localTarget(match[1]);
    if (target && !allPublicFiles.has(target)) addError(relative, `Broken internal reference: ${match[1]}`);
  }
  for (const match of html.matchAll(/<(?:img|script)\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const target = localTarget(match[1]);
    if (target && !allPublicFiles.has(target)) addError(relative, `Missing asset: ${match[1]}`);
  }
}

const articleEntries = await loadArticleEntries();
const legacyManifest = await readJson(path.join(root, 'content/legacy-manifest.json'));
const indexDecisions = buildIndexDecisions(articleEntries, legacyManifest, seoConfig);
const routes = new Map();
const categoryIds = new Set(categories.map(category => category.id));
let publishedArticleCount = 0;
for (const entry of articleEntries) {
  const relative = entry.source;
  const article = entry.article;
  const required = [
    'id', 'translationKey', 'language', 'type', 'status', 'slug', 'category', 'title',
    'description', 'publishedAt', 'updatedAt', 'verifiedAt', 'sources', 'sections'
  ];
  for (const field of required) {
    if (article[field] === undefined || article[field] === null || article[field] === '') addError(relative, `Missing required article field: ${field}`);
  }
  if (!site.languages.includes(article.language)) addError(relative, `Unsupported language: ${article.language}`);
  if (!categoryIds.has(article.category)) addError(relative, `Unknown category: ${article.category}`);
  if (!['draft', 'published'].includes(article.status)) addError(relative, `Invalid status: ${article.status}`);
  if (!['review', 'comparison', 'guide'].includes(article.type)) addError(relative, `Invalid type: ${article.type}`);
  if (article.language === 'ja' && /を比較[｜|].*比較/.test(article.title || '')) addError(relative, 'Japanese title repeats 比較 on both sides of the separator');
  if (!entry.generated) {
    const file = path.join(root, relative);
    if (path.basename(file, '.json') !== article.slug) addError(relative, 'Filename must match slug');
    if (path.basename(path.dirname(file)) !== article.language) addError(relative, 'Language directory does not match article.language');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt || '')) addError(relative, 'publishedAt must use YYYY-MM-DD');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(article.updatedAt || '')) addError(relative, 'updatedAt must use YYYY-MM-DD');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(article.verifiedAt || '')) addError(relative, 'verifiedAt must use YYYY-MM-DD');
  if ((article.updatedAt || '') < (article.publishedAt || '')) addError(relative, 'updatedAt precedes publishedAt');
  if ((article.verifiedAt || '') < (article.publishedAt || '')) addError(relative, 'verifiedAt precedes publishedAt');
  if (!Array.isArray(article.sections) || !article.sections.length) addError(relative, 'Article must contain sections');
  if (entry.generated) {
    const articleText = [
      article.title,
      article.description,
      article.lead,
      ...(article.sections || []).flatMap(section => [
        section.heading,
        ...(section.body || []),
        ...(section.bullets || []),
        section.callout,
        ...(section.table?.headers || []),
        ...(section.table?.rows || []).flat()
      ]),
      ...(article.faqs || []).flatMap(faq => [faq.question, faq.answer]),
      ...(article.ctas || []).map(cta => cta.label),
      ...(article.relatedLinks || []).flatMap(link => [link.label, link.description])
    ].filter(Boolean).join(' ');
    const minimumLength = article.language === 'ja' ? 1000 : 2500;
    if (articleText.length < minimumLength) addError(relative, `Generated article text is ${articleText.length} characters; expected at least ${minimumLength}`);
    if ((article.sections || []).length < 6) addError(relative, 'Generated article must contain at least six sections');
    if (article.language === 'en' && /(?<!\.)\b(?:ai|seo|wordpress|microsoft 365|google workspace|google one|english|smbs|cms|vpn)\b/.test(articleText)) {
      addError(relative, 'English article contains a lowercased brand, language name, or acronym');
    }
  }
  for (const [index, section] of (article.sections || []).entries()) {
    if (!section.heading || !Array.isArray(section.body) || !section.body.length || section.body.some(item => !String(item).trim())) {
      addError(relative, `Invalid section at index ${index}`);
    }
    if (section.bullets !== undefined && (!Array.isArray(section.bullets) || !section.bullets.length || section.bullets.some(item => !String(item).trim()))) {
      addError(relative, `Invalid bullets at section index ${index}`);
    }
    if (section.table !== undefined) {
      const headers = section.table?.headers;
      const rows = section.table?.rows;
      if (!Array.isArray(headers) || headers.length < 2 || headers.some(item => !String(item).trim()) || !Array.isArray(rows) || !rows.length || rows.some(row => !Array.isArray(row) || row.length !== headers.length || row.some(item => !String(item).trim()))) {
        addError(relative, `Invalid table at section index ${index}`);
      }
    }
  }
  if (!Array.isArray(article.sources) || !article.sources.length) addError(relative, 'Article must contain official sources');
  for (const [index, source] of (article.sources || []).entries()) {
    try {
      const parsed = new URL(source.url);
      if (parsed.protocol !== 'https:' || !source.label) throw new Error('Official source requires an HTTPS URL and label');
    } catch (error) {
      addError(relative, `Invalid official source at index ${index}: ${error.message}`);
    }
  }
  for (const [index, cta] of (article.ctas || []).entries()) {
    try {
      const parsed = new URL(cta.officialUrl);
      if (parsed.protocol !== 'https:' || !cta.label || !/^[a-z0-9][a-z0-9-]*$/.test(cta.affiliateKey || '')) throw new Error('CTA requires a label, HTTPS officialUrl, and lowercase affiliateKey');
    } catch (error) {
      addError(relative, `Invalid CTA at index ${index}: ${error.message}`);
    }
  }
  for (const [index, related] of (article.relatedLinks || []).entries()) {
    if (!related.label || !/^\/[a-z0-9][a-z0-9\-/]*\/$/.test(related.url || '')) addError(relative, `Invalid related link at index ${index}`);
  }
  const route = `${article.language}:${article.category}:${article.slug}`;
  if (routes.has(route)) addError(relative, `Duplicate route with ${routes.get(route)}`);
  routes.set(route, relative);
  if (article.status === 'published') {
    publishedArticleCount += 1;
    const output = path.join(outputRoot, article.language, article.category, article.slug, 'index.html');
    if (!allPublicFiles.has(path.resolve(output))) addError(relative, 'Published article output is missing');
    else {
      const html = htmlCache.get(output) || await fs.readFile(output, 'utf8');
      const expectedIndexable = Boolean(indexDecisions.get(article.id)?.indexable);
      if (expectedIndexable === isNoIndex(html)) addError(relative, `Indexing decision mismatch; expected ${expectedIndexable ? 'index' : 'noindex'}`);
      if (expectedIndexable) {
        const relatedCards = (html.match(/class=["'][^"']*\brelated-article-card\b[^"']*["']/g) || []).length;
        if (relatedCards < (seoConfig.relatedArticles?.count || 5)) addError(relative, `Expected at least ${seoConfig.relatedArticles?.count || 5} semantic related-article links but found ${relatedCards}`);
      }
    }
  }
}

for (const [key, entry] of Object.entries(affiliates.links || {})) {
  const url = typeof entry === 'string' ? entry : entry?.url || entry?.destination;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !/^[a-z0-9][a-z0-9-]*$/.test(key)) throw new Error('Affiliate keys must be lowercase and URLs must use HTTPS');
  } catch (error) {
    addError('content/config/affiliates.json', `Invalid affiliate entry ${key}: ${error.message}`);
  }
}

const sitemapFile = path.join(outputRoot, 'sitemap.xml');
let sitemapUrlCount = 0;
if (!allPublicFiles.has(path.resolve(sitemapFile))) {
  addError('/sitemap.xml', 'Missing sitemap');
} else {
  const sitemap = await fs.readFile(sitemapFile, 'utf8');
  if (!/<sitemapindex\b/i.test(sitemap)) addError('/sitemap.xml', 'Root sitemap must be a sitemap index');
  const childUrls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map(match => match[1].replace(/&amp;/g, '&'));
  const sitemapUrls = new Set();
  for (const childUrl of childUrls) {
    let pathname = '';
    try {
      const parsed = new URL(childUrl);
      if (parsed.origin !== site.baseUrl) throw new Error('outside site');
      pathname = parsed.pathname;
    } catch {
      addError('/sitemap.xml', `Invalid child sitemap URL: ${childUrl}`);
      continue;
    }
    const childFile = path.join(outputRoot, pathname.replace(/^\/+/, ''));
    if (!allPublicFiles.has(path.resolve(childFile))) {
      addError('/sitemap.xml', `Missing child sitemap: ${pathname}`);
      continue;
    }
    const child = await fs.readFile(childFile, 'utf8');
    if (!/<urlset\b/i.test(child)) addError(pathname, 'Child sitemap must contain a urlset');
    for (const match of child.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
      const url = match[1].replace(/&amp;/g, '&');
      if (sitemapUrls.has(url)) addError(pathname, `Duplicate sitemap URL: ${url}`);
      sitemapUrls.add(url);
    }
    const urlBlocks = [...child.matchAll(/<url>[\s\S]*?<\/url>/g)].map(match => match[0]);
    for (const block of urlBlocks) {
      if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(block)) addError(pathname, 'Every sitemap URL must have a YYYY-MM-DD lastmod');
    }
  }
  sitemapUrlCount = sitemapUrls.size;
  for (const canonical of indexableCanonicals) {
    if (!sitemapUrls.has(canonical)) addError('/sitemap.xml', `Missing indexable canonical: ${canonical}`);
  }
  for (const url of sitemapUrls) {
    if (!indexableCanonicals.has(url)) addError('/sitemap.xml', `URL has no matching indexable HTML: ${url}`);
  }
}

let releaseManifestPageCount = 0;
try {
  const releaseManifest = await readJson(path.join(outputRoot, 'release-manifest.json'));
  if (releaseManifest.site !== site.baseUrl) addError('/release-manifest.json', 'Site URL does not match content/config/site.json');
  if (releaseManifest.hashAlgorithm !== 'sha256(html+global-assets+page-image)') {
    addError('/release-manifest.json', 'Unexpected hash algorithm');
  }
  const releasePages = Array.isArray(releaseManifest.pages) ? releaseManifest.pages : [];
  if (!Array.isArray(releaseManifest.pages)) addError('/release-manifest.json', 'Pages must be an array');
  const releaseUrls = new Set();
  for (const page of releasePages) {
    const url = String(page?.url || '');
    const pagePath = String(page?.path || '');
    if (!url.startsWith(site.baseUrl)) addError('/release-manifest.json', `Invalid page URL: ${url || '(empty URL)'}`);
    if (releaseUrls.has(url)) addError('/release-manifest.json', `Duplicate page URL: ${url}`);
    releaseUrls.add(url);
    if (!/^[a-f0-9]{64}$/.test(String(page?.hash || ''))) addError('/release-manifest.json', `Invalid SHA-256 hash: ${url || pagePath}`);
    const localFile = path.resolve(outputRoot, pagePath);
    if (!pagePath.endsWith('.html') || !allPublicFiles.has(localFile)) {
      addError('/release-manifest.json', `Missing HTML path: ${pagePath || '(empty path)'}`);
      continue;
    }
    const html = htmlCache.get(localFile) || await fs.readFile(localFile, 'utf8');
    if (linkHref(html, 'canonical') !== url) addError('/release-manifest.json', `Canonical mismatch for ${pagePath}`);
    if (isNoIndex(html)) addError('/release-manifest.json', `Noindex page is present: ${url}`);
  }
  releaseManifestPageCount = releaseUrls.size;
  if (releaseManifest.pageCount !== releaseManifestPageCount) {
    addError('/release-manifest.json', `pageCount is ${releaseManifest.pageCount}; expected ${releaseManifestPageCount}`);
  }
  for (const canonical of indexableCanonicals) {
    if (!releaseUrls.has(canonical)) addError('/release-manifest.json', `Missing indexable canonical: ${canonical}`);
  }
  for (const url of releaseUrls) {
    if (!indexableCanonicals.has(url)) addError('/release-manifest.json', `URL has no matching indexable HTML: ${url}`);
  }
} catch (error) {
  addError('/release-manifest.json', `Unable to read release manifest: ${error.message}`);
}

const indexNow = await readJson(path.join(root, 'content/config/indexnow.json'));
for (const requiredFile of [
  'CNAME', '.nojekyll', 'release-manifest.json', 'assets/css/style.css', 'assets/images/og-default.png',
  'assets/js/analytics-v4.7.0.js', 'assets/js/main-v4.7.0.js', 'assets/js/article-directory-v4.7.0.js',
  'feed-ja.xml', 'feed-en.xml', `${indexNow.key}.txt`
]) {
  if (!allPublicFiles.has(path.resolve(outputRoot, requiredFile))) addError(`/${requiredFile}`, 'Required GitHub Pages file is missing');
}

function isArticleFile(file, language = '') {
  const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
  const route = relative.match(/^(ja|en)\/([^/]+)\/[^/]+\/index\.html$/);
  return Boolean(route && (!language || route[1] === language) && categoryIds.has(route[2]));
}

function isIndexableFile(file) {
  return !isNoIndex(htmlCache.get(file) || '');
}

const publicArticleFiles = htmlFiles.filter(file => isArticleFile(file));
const indexableArticleFiles = publicArticleFiles.filter(isIndexableFile);

let searchIndexArticles = 0;
let searchIndexRecords = [];
try {
  const searchIndex = await readJson(path.join(outputRoot, 'search-index.json'));
  if (!Array.isArray(searchIndex)) throw new Error('Search index must be an array');
  searchIndexRecords = searchIndex;
  searchIndexArticles = searchIndex.length;
  const expectedSearchCount = indexableArticleFiles.length;
  if (searchIndexArticles !== expectedSearchCount) addError('/search-index.json', `Expected ${expectedSearchCount} indexable articles but found ${searchIndexArticles}`);
  for (const item of searchIndex) {
    const target = localTarget(item.url || '');
    if (!target || !allPublicFiles.has(target)) {
      addError('/search-index.json', `Missing article for search entry: ${item.url || '(empty URL)'}`);
      continue;
    }
    const html = await fs.readFile(target, 'utf8');
    if (isNoIndex(html)) addError('/search-index.json', `Noindex article is present in search: ${item.url}`);
    const expectedDescription = metaContent(html, 'name', 'description');
    if (item.description !== expectedDescription) addError('/search-index.json', `Description mismatch for ${item.url}`);
    const minimumDescriptionLength = item.language === 'ja' ? 35 : 65;
    if (String(item.description || '').length < minimumDescriptionLength) addError('/search-index.json', `Description is too short for ${item.url}`);
  }
} catch (error) {
  addError('/search-index.json', `Invalid search index: ${error.message}`);
}

for (const language of site.languages) {
  const publicArticleCount = publicArticleFiles.filter(file => isArticleFile(file, language)).length;
  const indexableArticleCount = indexableArticleFiles.filter(file => isArticleFile(file, language)).length;
  if (publicArticleCount < (site.minimumArticlesPerLanguage || 0)) {
    addError(`/${language}/`, `Expected at least ${site.minimumArticlesPerLanguage} public articles but found ${publicArticleCount}`);
  }
  if (indexableArticleCount < (site.minimumIndexableArticlesPerLanguage || 0)) {
    addError(`/${language}/`, `Expected at least ${site.minimumIndexableArticlesPerLanguage} indexable articles but found ${indexableArticleCount}`);
  }
  const directoryFile = path.join(outputRoot, language, 'articles', 'index.html');
  if (!allPublicFiles.has(path.resolve(directoryFile))) {
    addError(`/${language}/articles/`, 'Article directory is missing');
    continue;
  }
  const directory = await fs.readFile(directoryFile, 'utf8');
  const cardCount = (directory.match(/class=["'][^"']*\barticle-directory-card\b[^"']*["']/g) || []).length;
  const displayedCount = Number((directory.match(/data-article-count[^>]*>\s*(\d+)/i) || [])[1]);
  if (cardCount !== indexableArticleCount) addError(`/${language}/articles/`, `Expected ${indexableArticleCount} indexable article cards but found ${cardCount}`);
  if (displayedCount !== indexableArticleCount) addError(`/${language}/articles/`, `Displayed count is ${displayedCount}; expected ${indexableArticleCount}`);
}

for (const language of site.languages) {
  for (const category of categories) {
    const expected = indexableArticleFiles.filter(file => {
      const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
      return new RegExp(`^${language}/${category.id}/[^/]+/index\\.html$`).test(relative);
    }).length;
    const categoryFile = path.join(outputRoot, language, category.path, 'index.html');
    if (!allPublicFiles.has(path.resolve(categoryFile))) {
      addError(`/${language}/${category.path}/`, 'Category page is missing');
      continue;
    }
    const categoryHtml = await fs.readFile(categoryFile, 'utf8');
    const cards = (categoryHtml.match(/class=["'][^"']*\barticle-directory-card\b[^"']*["']/g) || []).length;
    if (cards !== expected) addError(`/${language}/${category.path}/`, `Expected ${expected} article cards but found ${cards}`);
  }
}

for (const language of site.languages) {
  const indexableArticleCount = indexableArticleFiles.filter(file => isArticleFile(file, language)).length;
  const homeFile = path.join(outputRoot, language, 'index.html');
  if (!allPublicFiles.has(path.resolve(homeFile))) {
    addError(`/${language}/`, 'Language home page is missing');
    continue;
  }
  const homeHtml = await fs.readFile(homeFile, 'utf8');
  const displayedCount = Number((homeHtml.match(/data-home-article-count[^>]*>\s*(\d+)/i) || [])[1]);
  if (displayedCount !== indexableArticleCount) addError(`/${language}/`, `Home page count is ${displayedCount}; expected ${indexableArticleCount}`);
  for (const category of categories) {
    const expected = indexableArticleFiles.filter(file => {
      const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
      return new RegExp(`^${language}/${category.id}/[^/]+/index\\.html$`).test(relative);
    }).length;
    const cardPattern = new RegExp(`<a\\b[^>]*data-category-count=["'](\\d+)["'][^>]*data-category-id=["']${category.id}["'][^>]*>`, 'i');
    const displayed = Number((homeHtml.match(cardPattern) || [])[1]);
    if (displayed !== expected) addError(`/${language}/`, `${category.id} home card count is ${displayed}; expected ${expected}`);
  }
}

if (site.requireArticleTranslationParity && site.languages.length > 1) {
  const routeSets = new Map(site.languages.map(language => [language, new Set()]));
  for (const file of htmlFiles) {
    const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
    const route = relative.match(/^([^/]+)\/([^/]+)\/([^/]+)\/index\.html$/);
    if (route && routeSets.has(route[1]) && categoryIds.has(route[2])) routeSets.get(route[1]).add(`${route[2]}/${route[3]}`);
  }
  const [referenceLanguage, ...otherLanguages] = site.languages;
  const referenceRoutes = routeSets.get(referenceLanguage);
  for (const language of otherLanguages) {
    const candidateRoutes = routeSets.get(language);
    for (const route of referenceRoutes) {
      if (!candidateRoutes.has(route)) addError(`/${language}/${route}/`, `Missing translation for ${referenceLanguage} article`);
    }
    for (const route of candidateRoutes) {
      if (!referenceRoutes.has(route)) addError(`/${referenceLanguage}/${route}/`, `Missing translation for ${language} article`);
    }
  }
}

if (site.requireArticleTranslationParity && site.languages.length > 1) {
  const indexableRouteSets = new Map(site.languages.map(language => [language, new Set()]));
  for (const file of indexableArticleFiles) {
    const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
    const route = relative.match(/^(ja|en)\/([^/]+)\/([^/]+)\/index\.html$/);
    if (route) indexableRouteSets.get(route[1]).add(`${route[2]}/${route[3]}`);
  }
  const [referenceLanguage, ...otherLanguages] = site.languages;
  for (const language of otherLanguages) {
    const reference = indexableRouteSets.get(referenceLanguage);
    const candidate = indexableRouteSets.get(language);
    for (const route of reference) if (!candidate.has(route)) addError(`/${language}/${route}/`, 'Indexable translation pair is missing');
    for (const route of candidate) if (!reference.has(route)) addError(`/${referenceLanguage}/${route}/`, 'Indexable translation pair is missing');
  }
}

for (const language of site.languages) {
  const languageRecords = searchIndexRecords.filter(record => record.language === language);
  const availableTopics = topics.filter(topic => languageRecords.some(record => record.topic === topic.id));
  const indexFile = path.join(outputRoot, language, 'topics', 'index.html');
  if (!allPublicFiles.has(path.resolve(indexFile))) {
    addError(`/${language}/topics/`, 'Topic index is missing');
  } else {
    const indexHtml = htmlCache.get(indexFile) || await fs.readFile(indexFile, 'utf8');
    const cards = (indexHtml.match(/class=["'][^"']*\btopic-link-card\b[^"']*["']/g) || []).length;
    if (cards !== availableTopics.length) addError(`/${language}/topics/`, `Expected ${availableTopics.length} topic cards but found ${cards}`);
  }
  for (const topic of availableTopics) {
    const expected = languageRecords.filter(record => record.topic === topic.id).length;
    const topicFile = path.join(outputRoot, language, 'topics', topic.id, 'index.html');
    if (!allPublicFiles.has(path.resolve(topicFile))) {
      addError(`/${language}/topics/${topic.id}/`, 'Topic page is missing');
      continue;
    }
    const topicHtml = htmlCache.get(topicFile) || await fs.readFile(topicFile, 'utf8');
    const cards = (topicHtml.match(/class=["'][^"']*\barticle-directory-card\b[^"']*["']/g) || []).length;
    if (cards !== expected) addError(`/${language}/topics/${topic.id}/`, `Expected ${expected} article cards but found ${cards}`);
  }
}

const titleOwners = new Map();
const descriptionOwners = new Map();
for (const file of indexableArticleFiles) {
  const relative = `/${path.relative(outputRoot, file).replaceAll('\\', '/')}`;
  const html = htmlCache.get(file) || await fs.readFile(file, 'utf8');
  const title = plainText((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const description = metaContent(html, 'name', 'description').trim();
  if (titleOwners.has(title)) addError(relative, `Duplicate indexable title with ${titleOwners.get(title)}`);
  titleOwners.set(title, relative);
  if (descriptionOwners.has(description)) warnings.push({file: relative, warning: `Duplicate indexable description with ${descriptionOwners.get(description)}`});
  descriptionOwners.set(description, relative);
  const language = relative.split('/')[1];
  const titleLimit = language === 'ja' ? 55 : 75;
  const descriptionLimit = language === 'ja' ? 130 : 180;
  if (title.length > titleLimit) warnings.push({file: relative, warning: `Title is ${title.length} characters; review truncation risk`});
  if (description.length > descriptionLimit) warnings.push({file: relative, warning: `Description is ${description.length} characters; review truncation risk`});
}

if (seoConfig.indexing?.mode === 'priority' && indexableArticleFiles.length >= publicArticleFiles.length) {
  addError('content/config/seo.json', 'Priority indexing mode must leave lower-priority articles as noindex');
}

const report = {
  generatedAt: new Date().toISOString(),
  htmlFiles: htmlFiles.length,
  publishedArticleDataFiles: publishedArticleCount,
  searchIndexArticles,
  publicArticles: publicArticleFiles.length,
  indexableArticles: indexableArticleFiles.length,
  noindexArticles: publicArticleFiles.length - indexableArticleFiles.length,
  uniqueArticleImages: indexableArticleImages.size,
  sitemapUrls: sitemapUrlCount,
  releaseManifestPages: releaseManifestPageCount,
  indexableCanonicals: indexableCanonicals.size,
  errorCount: errors.length,
  warningCount: warnings.length,
  errors,
  warnings
};
await writeFile(path.join(root, 'reports/validation.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(`Validation passed: ${htmlFiles.length} HTML files, ${publishedArticleCount} data articles, ${warnings.length} warnings.`);
