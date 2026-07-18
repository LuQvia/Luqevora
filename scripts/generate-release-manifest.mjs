import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {root, readJson, writeFile, walk} from './lib.mjs';

const site = await readJson(path.join(root, 'content/config/site.json'));
const outputRoot = path.join(root, site.outputDirectory);

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match?.[2] || '';
}

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

function linkHref(html, relation) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attribute(match[0], 'rel').split(/\s+/).includes(relation)) return decodeHtml(attribute(match[0], 'href'));
  }
  return '';
}

function metaContent(html, key, value) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (attribute(match[0], key).toLowerCase() === String(value).toLowerCase()) return decodeHtml(attribute(match[0], 'content'));
  }
  return '';
}

function noindex(html) {
  return metaContent(html, 'name', 'robots').toLowerCase().split(/[\s,]+/).includes('noindex');
}

function digest(parts) {
  const hash = crypto.createHash('sha256');
  for (const part of parts) hash.update(part);
  return hash.digest('hex');
}

const allFiles = await walk(outputRoot);
const globalAssetFiles = allFiles
  .filter(file => file.startsWith(path.join(outputRoot, 'assets') + path.sep))
  .filter(file => !file.includes(`${path.sep}images${path.sep}articles${path.sep}`))
  .sort();

const globalAssetParts = [];
for (const file of globalAssetFiles) {
  globalAssetParts.push(path.relative(outputRoot, file).replaceAll('\\', '/'));
  globalAssetParts.push(await fs.readFile(file));
}
const assetFingerprint = digest(globalAssetParts);

const pages = [];
for (const file of allFiles.filter(file => file.endsWith('.html')).sort()) {
  const html = await fs.readFile(file, 'utf8');
  const url = linkHref(html, 'canonical');
  if (!url.startsWith(site.baseUrl) || noindex(html)) continue;

  const relative = path.relative(outputRoot, file).replaceAll('\\', '/');
  const language = (relative.match(/^(ja|en)\//) || [])[1] || '';
  const articleMatch = relative.match(/^(ja|en)\/([^/]+)\/([^/]+)\/index\.html$/);
  const topicMatch = relative.match(/^(ja|en)\/topics(?:\/([^/]+))?\/index\.html$/);
  const type = topicMatch ? 'topic' : articleMatch ? 'article' : 'page';
  const lastmod = (metaContent(html, 'property', 'article:modified_time') || site.defaultVerifiedAt).slice(0, 10);
  const imageUrl = metaContent(html, 'property', 'og:image');
  let imageFingerprint = '';
  try {
    const parsed = new URL(imageUrl);
    if (parsed.origin === new URL(site.baseUrl).origin) {
      const localImage = path.join(outputRoot, decodeURIComponent(parsed.pathname).replace(/^\//, ''));
      imageFingerprint = digest([await fs.readFile(localImage)]);
    }
  } catch {
    // Non-local or missing images are validated by the main validator.
  }

  pages.push({
    url,
    path: relative,
    language,
    type,
    lastmod,
    hash: digest([html, assetFingerprint, imageFingerprint])
  });
}

pages.sort((a, b) => a.url.localeCompare(b.url));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  site: site.baseUrl,
  hashAlgorithm: 'sha256(html+global-assets+page-image)',
  assetFingerprint,
  pageCount: pages.length,
  pages
};
const body = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(outputRoot, 'release-manifest.json'), body);
await writeFile(path.join(root, 'reports/release-manifest.json'), body);
console.log(`Generated release manifest for ${pages.length} indexable pages.`);
