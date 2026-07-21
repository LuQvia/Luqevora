import fs from 'node:fs/promises';
import path from 'node:path';
import {root, writeFile} from './lib.mjs';

// One-time, reproducible migration batch selected from the end of the current
// Japanese article directory. Existing public routes are intentionally kept.
const selectedRoutes = [
  'ja/hosting-security/cloudways-guide/index.html',
  'ja/hosting-security/domain-registrar-comparison/index.html',
  'ja/hosting-security/com-vs-jp-domain/index.html',
  'ja/business-software/custom-domain-email-guide/index.html',
  'ja/business-software/google-workspace-guide/index.html',
  'ja/business-software/google-drive-guide/index.html',
  'ja/business-software/google-meet-guide/index.html',
  'ja/business-software/google-calendar-guide/index.html',
  'ja/business-software/google-chat-guide/index.html',
  'ja/business-software/slack-guide/index.html',
  'ja/business-software/slack-vs-google-chat/index.html',
  'ja/business-software/business-chat-tools-comparison/index.html',
  'ja/business-software/task-management-tools-comparison/index.html',
  'ja/business-software/asana-guide/index.html'
];

const entities = {
  amp: '&', quot: '"', apos: "'", '#39': "'", lt: '<', gt: '>', nbsp: ' '
};

function decodeHtml(value = '') {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, key) => {
    const normalized = key.toLowerCase();
    if (normalized in entities) return entities[normalized];
    if (normalized.startsWith('#x')) return String.fromCodePoint(parseInt(normalized.slice(2), 16));
    if (normalized.startsWith('#')) return String.fromCodePoint(parseInt(normalized.slice(1), 10));
    return match;
  });
}

function text(value = '') {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function first(source, expression) {
  return (source.match(expression) || [])[1] || '';
}

function meta(source, key, value) {
  for (const match of source.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const keyValue = first(tag, new RegExp(`${key}=["']([^"']+)["']`, 'i'));
    if (keyValue !== value) continue;
    return decodeHtml(first(tag, /content=["']([^"']*)["']/i));
  }
  return '';
}

function links(source = '') {
  return [...source.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(match => ({label: text(match[2]), url: decodeHtml(match[1])}));
}

function articleType(badge) {
  if (badge.includes('比較')) return 'comparison';
  if (badge.includes('ガイド')) return 'guide';
  return 'review';
}

for (const legacyRoute of selectedRoutes) {
  const file = path.join(root, 'legacy', legacyRoute);
  const source = await fs.readFile(file, 'utf8');
  const [, language, category, slug] = legacyRoute.match(/^([^/]+)\/([^/]+)\/([^/]+)\//) || [];
  if (!language || !category || !slug) throw new Error(`Invalid selected route: ${legacyRoute}`);

  const badge = text(first(source, /<span class=["']badge["']>([\s\S]*?)<\/span>/i));
  const articleMeta = text(first(source, /<div class=["']article-meta["']>([\s\S]*?)<\/div>/i));
  const sectionMatches = [...source.matchAll(/<section id=["']section-[^"']+["']>([\s\S]*?)<\/section>/gi)];
  const faqBlock = first(source, /<section id=["']faq["']>([\s\S]*?)<\/section>/i);
  const sourcesBlock = first(source, /<section id=["']sources["']>([\s\S]*?)<\/section>/i);

  const article = {
    id: slug,
    translationKey: slug,
    language,
    type: articleType(badge),
    status: 'published',
    slug,
    category,
    topic: meta(source, 'name', 'luqevora-topic'),
    badge,
    title: text(first(source, /<h1[^>]*>([\s\S]*?)<\/h1>/i)),
    metaTitle: text(first(source, /<title>([\s\S]*?)<\/title>/i)),
    description: meta(source, 'name', 'description'),
    lead: text(first(source, /<p class=["']article-lead["']>([\s\S]*?)<\/p>/i)),
    publishedAt: meta(source, 'property', 'article:published_time'),
    updatedAt: meta(source, 'property', 'article:modified_time'),
    verifiedAt: meta(source, 'property', 'article:modified_time'),
    author: articleMeta.match(/執筆：([^/]+)/)?.[1]?.trim() || 'Luqevora.com編集部',
    featured: false,
    affiliateDisclosure: false,
    sources: links(sourcesBlock),
    sections: sectionMatches.map(match => ({
      heading: text(first(match[1], /<h2[^>]*>([\s\S]*?)<\/h2>/i)),
      body: [...match[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(item => text(item[1]))
    })),
    faqs: [...faqBlock.matchAll(/<div class=["']faq-item["']>\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/gi)]
      .map(match => ({question: text(match[1]), answer: text(match[2])}))
  };

  const required = ['title', 'description', 'publishedAt', 'updatedAt', 'verifiedAt'];
  for (const field of required) {
    if (!article[field]) throw new Error(`${legacyRoute}: missing ${field}`);
  }
  if (!article.sections.length) throw new Error(`${legacyRoute}: no article sections found`);
  if (!article.sources.length) throw new Error(`${legacyRoute}: no official sources found`);

  await writeFile(
    path.join(root, 'content', 'articles', language, `${slug}.json`),
    `${JSON.stringify(article, null, 2)}\n`
  );
}

console.log(`Migrated ${selectedRoutes.length} selected legacy articles.`);
