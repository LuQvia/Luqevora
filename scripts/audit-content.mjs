import fs from 'node:fs/promises';
import path from 'node:path';
import {root, readJson, writeFile, urlPath} from './lib.mjs';
import {loadArticleEntries} from './load-articles.mjs';
import {buildIndexDecisions} from './seo.mjs';

const site = await readJson(path.join(root, 'content/config/site.json'));
const seoConfig = await readJson(path.join(root, 'content/config/seo.json'));
const legacyManifest = await readJson(path.join(root, 'content/legacy-manifest.json'));
const entries = await loadArticleEntries();
const decisions = buildIndexDecisions(entries, legacyManifest, seoConfig);

const defaults = {
  hardMinimumSources: 1,
  recommendedSources: 2,
  hardMinimumUnits: {ja: 300, en: 300},
  recommendedUnits: {ja: 600, en: 500},
  staleWarningDays: 180,
  staleCriticalDays: 365,
  minimumSections: 4,
  minimumFaqs: 2,
  promotionScore: 82,
  promotionCandidatePairLimit: 25
};
const quality = {
  ...defaults,
  ...(seoConfig.quality || {}),
  hardMinimumUnits: {...defaults.hardMinimumUnits, ...(seoConfig.quality?.hardMinimumUnits || {})},
  recommendedUnits: {...defaults.recommendedUnits, ...(seoConfig.quality?.recommendedUnits || {})}
};

const auditDateText = process.env.AUDIT_DATE || new Date().toISOString().slice(0, 10);
const auditDate = new Date(`${auditDateText}T00:00:00Z`);
if (Number.isNaN(auditDate.getTime())) throw new Error(`Invalid AUDIT_DATE: ${auditDateText}`);

const errors = [];
const warnings = [];

function addIssue(collection, article, code, message, details = {}) {
  collection.push({
    code,
    message,
    articleId: article?.id || '',
    language: article?.language || '',
    route: article ? urlPath(article.language, article.category, article.slug) : '',
    ...details
  });
}

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function ageDays(value) {
  if (!validDate(value)) return null;
  return Math.floor((auditDate.getTime() - new Date(`${value}T00:00:00Z`).getTime()) / 86400000);
}

function collectText(article) {
  const sections = (article.sections || []).flatMap(section => [
    section.heading,
    ...(section.body || []),
    ...(section.bullets || []),
    section.callout || '',
    ...(section.table?.headers || []),
    ...(section.table?.rows || []).flat()
  ]);
  const faqs = (article.faqs || []).flatMap(item => [item.question, item.answer]);
  return [article.title, article.description, article.lead, ...sections, ...faqs]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentUnits(article, text) {
  if (article.language === 'ja') return text.replace(/\s/g, '').length;
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function normalize(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/20\d{2}/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hostOf(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function scoreArticle(article, metrics) {
  let score = 100;
  if (metrics.sourceCount < quality.recommendedSources) score -= 10;
  if (metrics.units < quality.recommendedUnits[article.language]) score -= 15;
  if (metrics.sectionCount < quality.minimumSections) score -= 10;
  if (metrics.faqCount < quality.minimumFaqs) score -= 5;
  if (metrics.staleDays !== null && metrics.staleDays > quality.staleWarningDays) score -= 15;
  if (metrics.staleDays !== null && metrics.staleDays > quality.staleCriticalDays) score -= 15;
  if (!article.lead) score -= 5;
  if (!article.description) score -= 10;
  if (!article.translationKey) score -= 10;
  return Math.max(0, score);
}

const records = [];
for (const entry of entries) {
  const article = entry.article;
  if (article.status !== 'published') continue;

  const text = collectText(article);
  const sourceUrls = (article.sources || []).map(source => source.url).filter(Boolean);
  const sourceHosts = [...new Set(sourceUrls.map(hostOf).filter(Boolean))];
  const metrics = {
    units: contentUnits(article, text),
    sourceCount: sourceUrls.length,
    sourceHostCount: sourceHosts.length,
    sectionCount: (article.sections || []).length,
    faqCount: (article.faqs || []).length,
    staleDays: ageDays(article.verifiedAt)
  };
  const indexable = Boolean(decisions.get(article.id)?.indexable);
  const score = scoreArticle(article, metrics);

  records.push({
    id: article.id,
    translationKey: article.translationKey || '',
    language: article.language,
    category: article.category,
    slug: article.slug,
    route: urlPath(article.language, article.category, article.slug),
    sourceFile: entry.source,
    generated: Boolean(entry.generated),
    indexable,
    score,
    verifiedAt: article.verifiedAt || '',
    ...metrics,
    sourceHosts
  });

  for (const field of ['id', 'translationKey', 'language', 'category', 'slug', 'title', 'description', 'publishedAt', 'updatedAt', 'verifiedAt']) {
    if (!article[field]) addIssue(errors, article, 'missing-required-field', `Required field is empty: ${field}`, {field});
  }

  for (const field of ['publishedAt', 'updatedAt', 'verifiedAt']) {
    if (article[field] && !validDate(article[field])) addIssue(errors, article, 'invalid-date', `Invalid YYYY-MM-DD date in ${field}`, {field, value: article[field]});
  }
  if (validDate(article.publishedAt) && validDate(article.updatedAt) && article.updatedAt < article.publishedAt) {
    addIssue(errors, article, 'date-order', 'updatedAt is earlier than publishedAt');
  }
  if (validDate(article.updatedAt) && validDate(article.verifiedAt) && article.verifiedAt < article.updatedAt) {
    addIssue(warnings, article, 'verification-before-update', 'verifiedAt is earlier than updatedAt');
  }

  for (const source of article.sources || []) {
    try {
      const url = new URL(source.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
      if (url.protocol !== 'https:') addIssue(warnings, article, 'non-https-source', `Source is not HTTPS: ${source.url}`);
    } catch {
      addIssue(errors, article, 'invalid-source-url', `Invalid source URL: ${source.url || '(empty)'}`);
    }
  }

  if (indexable) {
    if (metrics.sourceCount < quality.hardMinimumSources) {
      addIssue(errors, article, 'insufficient-sources', `Indexable article has ${metrics.sourceCount} source(s); minimum is ${quality.hardMinimumSources}`);
    } else if (metrics.sourceCount < quality.recommendedSources) {
      addIssue(warnings, article, 'source-depth', `Indexable article has ${metrics.sourceCount} source(s); recommended is ${quality.recommendedSources}`);
    }
    if (metrics.units < quality.hardMinimumUnits[article.language]) {
      addIssue(errors, article, 'thin-content', `Indexable article has ${metrics.units} content units; hard minimum is ${quality.hardMinimumUnits[article.language]}`);
    } else if (metrics.units < quality.recommendedUnits[article.language]) {
      addIssue(warnings, article, 'content-depth', `Indexable article has ${metrics.units} content units; recommended is ${quality.recommendedUnits[article.language]}`);
    }
    if (metrics.sectionCount < quality.minimumSections) {
      addIssue(warnings, article, 'section-depth', `Indexable article has ${metrics.sectionCount} section(s); recommended is ${quality.minimumSections}`);
    }
    if (metrics.faqCount < quality.minimumFaqs) {
      addIssue(warnings, article, 'faq-depth', `Indexable article has ${metrics.faqCount} FAQ item(s); recommended is ${quality.minimumFaqs}`);
    }
    if (metrics.staleDays !== null && metrics.staleDays > quality.staleCriticalDays) {
      addIssue(warnings, article, 'critically-stale', `Article verification is ${metrics.staleDays} days old`);
    } else if (metrics.staleDays !== null && metrics.staleDays > quality.staleWarningDays) {
      addIssue(warnings, article, 'stale', `Article verification is ${metrics.staleDays} days old`);
    }
  }
}

function duplicateGroups(field, selector) {
  const groups = new Map();
  for (const entry of entries) {
    const article = entry.article;
    if (article.status !== 'published' || !decisions.get(article.id)?.indexable) continue;
    const key = `${article.language}:${normalize(selector(article))}`;
    if (!key.split(':')[1]) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(article);
  }
  for (const [key, articles] of groups) {
    if (articles.length < 2) continue;
    for (const article of articles) {
      addIssue(errors, article, `duplicate-${field}`, `Duplicate ${field} among indexable articles`, {
        duplicateKey: key,
        conflictingRoutes: articles.map(item => urlPath(item.language, item.category, item.slug))
      });
    }
  }
}

duplicateGroups('title', article => article.metaTitle || article.title);
duplicateGroups('description', article => article.description);

const translationGroups = new Map();
for (const entry of entries) {
  const article = entry.article;
  if (article.status !== 'published' || !article.translationKey) continue;
  if (!translationGroups.has(article.translationKey)) translationGroups.set(article.translationKey, []);
  translationGroups.get(article.translationKey).push(article);
}
for (const [translationKey, articles] of translationGroups) {
  const languages = new Set(articles.map(article => article.language));
  for (const language of site.languages) {
    if (languages.has(language)) continue;
    const article = articles[0];
    addIssue(errors, article, 'missing-translation', `Translation group ${translationKey} is missing language ${language}`, {translationKey, missingLanguage: language});
  }
  const indexed = articles.filter(article => decisions.get(article.id)?.indexable);
  if (indexed.length > 0 && indexed.length !== articles.length) {
    for (const article of articles) {
      addIssue(errors, article, 'index-parity', `Translation group ${translationKey} mixes indexable and noindex states`, {translationKey});
    }
  }
}

const indexableRecords = records.filter(record => record.indexable);
const noindexRecords = records.filter(record => !record.indexable);
const promotionEligible = noindexRecords
  .filter(record => record.score >= quality.promotionScore && record.sourceCount >= quality.recommendedSources)
  .sort((a, b) => b.score - a.score || a.route.localeCompare(b.route));
const eligibleByTranslation = new Map();
for (const record of promotionEligible) {
  if (!eligibleByTranslation.has(record.translationKey)) eligibleByTranslation.set(record.translationKey, []);
  eligibleByTranslation.get(record.translationKey).push(record);
}
const promotionEligiblePairs = [...eligibleByTranslation.entries()]
  .map(([translationKey, pairRecords]) => ({
    translationKey,
    score: Math.min(...pairRecords.map(record => record.score)),
    records: pairRecords.sort((a, b) => site.languages.indexOf(a.language) - site.languages.indexOf(b.language))
  }))
  .filter(pair => pair.translationKey && site.languages.every(language => pair.records.some(record => record.language === language)))
  .sort((a, b) => b.score - a.score || a.translationKey.localeCompare(b.translationKey));
const promotionCandidatePairs = promotionEligiblePairs.slice(0, quality.promotionCandidatePairLimit);
const promotionCandidates = promotionCandidatePairs.flatMap(pair => pair.records);

const sourceHostCounts = new Map();
for (const record of records) {
  for (const host of record.sourceHosts) sourceHostCounts.set(host, (sourceHostCounts.get(host) || 0) + 1);
}

const average = values => values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : 0;
const report = {
  generatedAt: new Date().toISOString(),
  auditDate: auditDateText,
  thresholds: quality,
  summary: {
    publishedDataArticles: records.length,
    indexableDataArticles: indexableRecords.length,
    noindexDataArticles: noindexRecords.length,
    averageIndexableScore: average(indexableRecords.map(record => record.score)),
    minimumIndexableScore: indexableRecords.length ? Math.min(...indexableRecords.map(record => record.score)) : 0,
    promotionEligible: promotionEligible.length,
    promotionEligiblePairs: promotionEligiblePairs.length,
    promotionCandidatePairs: promotionCandidatePairs.length,
    promotionCandidates: promotionCandidates.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    byLanguage: Object.fromEntries(site.languages.map(language => [language, {
      published: records.filter(record => record.language === language).length,
      indexable: indexableRecords.filter(record => record.language === language).length,
      averageScore: average(indexableRecords.filter(record => record.language === language).map(record => record.score))
    }]))
  },
  topSourceHosts: [...sourceHostCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 30)
    .map(([host, articleCount]) => ({host, articleCount})),
  promotionCandidatePairs: promotionCandidatePairs.map(pair => ({
    translationKey: pair.translationKey,
    score: pair.score,
    articles: pair.records
  })),
  promotionCandidates,
  errors,
  warnings,
  records: records.sort((a, b) => a.language.localeCompare(b.language) || a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug))
};

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
const csvColumns = ['id', 'language', 'category', 'slug', 'route', 'indexable', 'score', 'units', 'sourceCount', 'sourceHostCount', 'sectionCount', 'faqCount', 'verifiedAt', 'staleDays', 'generated', 'sourceFile', 'sourceHosts'];
const csv = [
  csvColumns.join(','),
  ...report.records.map(record => csvColumns.map(column => csvEscape(record[column])).join(','))
].join('\n') + '\n';

await writeFile(path.join(root, 'reports/content-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(path.join(root, 'reports/content-audit.csv'), csv);

console.log(`Audited ${records.length} published data articles: ${errors.length} error(s), ${warnings.length} warning(s), ${promotionEligiblePairs.length} promotion-eligible pair(s); top ${promotionCandidatePairs.length} pair(s) / ${promotionCandidates.length} articles written to the queue.`);
if (errors.length) {
  for (const issue of errors.slice(0, 20)) console.error(`[${issue.code}] ${issue.route || issue.articleId}: ${issue.message}`);
  process.exitCode = 1;
}
