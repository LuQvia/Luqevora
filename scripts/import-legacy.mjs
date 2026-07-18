import fs from 'node:fs/promises';
import path from 'node:path';
import {root, walk, writeFile} from './lib.mjs';

const legacy = path.join(root, 'legacy');
const htmlFiles = (await walk(legacy).catch(() => [])).filter(file => file.endsWith('.html'));
const manifest = [];

function attribute(tag, name) {
  return (tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i')) || [])[1] || '';
}

function metaContent(source, key, value) {
  for (const match of source.matchAll(/<meta\b[^>]*>/gi)) {
    if (attribute(match[0], key) === value) return attribute(match[0], 'content');
  }
  return '';
}

function canonicalFrom(source) {
  for (const match of source.matchAll(/<link\b[^>]*>/gi)) {
    if (attribute(match[0], 'rel').split(/\s+/).includes('canonical')) return attribute(match[0], 'href');
  }
  return '';
}

function text(value = '') {
  return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

for (const file of htmlFiles) {
  const relative = path.relative(legacy, file).replaceAll('\\', '/');
  const source = await fs.readFile(file, 'utf8');
  const htmlTag = (source.match(/<html\b[^>]*>/i) || [])[0] || '';
  manifest.push({
    legacyFile: relative,
    language: attribute(htmlTag, 'lang') || relative.split('/')[0] || 'ja',
    title: text((source.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ''),
    description: metaContent(source, 'name', 'description').trim(),
    canonical: canonicalFrom(source).trim(),
    h1: text((source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || ''),
    status: 'needs-content-migration'
  });
}

manifest.sort((a, b) => a.legacyFile.localeCompare(b.legacyFile));
await writeFile(path.join(root, 'content/legacy-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Imported metadata from ${manifest.length} HTML files.`);
