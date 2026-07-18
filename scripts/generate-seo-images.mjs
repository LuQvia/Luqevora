import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {root, readJson, writeFile, walk} from './lib.mjs';
import {loadArticleEntries} from './load-articles.mjs';
import {buildIndexDecisions, deterministicNumber, slugDisplayTitle} from './seo.mjs';

const run = promisify(execFile);
const site = await readJson(path.join(root, 'content/config/site.json'));
const categories = await readJson(path.join(root, 'content/config/categories.json'));
const seoConfig = await readJson(path.join(root, 'content/config/seo.json'));
const topics = await readJson(path.join(root, 'content/config/topics.json'));
const legacyManifest = await readJson(path.join(root, 'content/legacy-manifest.json'));
const entries = await loadArticleEntries();
const decisions = buildIndexDecisions(entries, legacyManifest, seoConfig);
const categoryIds = new Set(categories.map(category => category.id));
const imageRoot = path.join(root, seoConfig.images.sourceDirectory);
const reportFile = path.join(root, 'reports/seo-images.json');
const targets = new Map();
const force = process.argv.includes('--force') || process.env.FORCE_SEO_IMAGES === '1';
const concurrency = Math.max(1, Math.min(16, Number(process.env.SEO_IMAGE_CONCURRENCY || 8)));
let imageToolPromise = null;

async function imageTool() {
  if (!imageToolPromise) {
    imageToolPromise = (async () => {
      for (const command of ['magick', 'convert']) {
        try {
          await run(command, ['-version'], {maxBuffer: 1024 * 1024});
          return command;
        } catch {
          // Try the next supported ImageMagick entry point.
        }
      }
      throw new Error('ImageMagick is required. Install either the magick or convert command.');
    })();
  }
  return imageToolPromise;
}

for (const entry of entries) {
  const article = entry.article;
  if (article.status !== 'published' || !decisions.get(article.id)?.indexable) continue;
  const key = `${article.language}/${article.category}/${article.slug}`;
  targets.set(key, {
    language: article.language,
    category: article.category,
    slug: article.slug,
    topic: article.topic,
    label: slugDisplayTitle(article.slug)
  });
}

for (const item of legacyManifest) {
  try {
    const pathname = new URL(item.canonical).pathname;
    const match = pathname.match(/^\/(ja|en)\/([^/]+)\/([^/]+)\/$/);
    if (!match || !categoryIds.has(match[2])) continue;
    const key = `${match[1]}/${match[2]}/${match[3]}`;
    if (!targets.has(key)) {
      targets.set(key, {
        language: match[1],
        category: match[2],
        slug: match[3],
        topic: '',
        label: slugDisplayTitle(match[3])
      });
    }
  } catch {
    // The legacy inventory is validated elsewhere; skip non-URL records here.
  }
}

function palette(seed) {
  const palettes = [
    ['#071B3A', '#0E7490', '#67E8F9'],
    ['#111827', '#4338CA', '#A5B4FC'],
    ['#172554', '#0369A1', '#7DD3FC'],
    ['#042F2E', '#0F766E', '#5EEAD4'],
    ['#1E1B4B', '#6D28D9', '#C4B5FD'],
    ['#082F49', '#0284C7', '#BAE6FD']
  ];
  return palettes[seed % palettes.length];
}

function safeLabel(value, limit) {
  const text = String(value).replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length <= limit ? text : `${text.slice(0, limit - 1).trim()}…`;
}

function routeFor(target) {
  return `/${target.language}/${target.category}/${target.slug}/`;
}

function outputFor(target) {
  return path.join(imageRoot, target.language, target.category, `${target.slug}.${seoConfig.images.format || 'png'}`);
}

function fingerprint(target) {
  return crypto.createHash('sha256').update(JSON.stringify({
    generatorVersion: 2,
    target,
    width: seoConfig.images.width,
    height: seoConfig.images.height,
    format: seoConfig.images.format || 'png',
    quality: seoConfig.images.quality || null
  })).digest('hex');
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

let previousReport = null;
try {
  previousReport = JSON.parse(await fs.readFile(reportFile, 'utf8'));
} catch {
  previousReport = null;
}
const previousByRoute = new Map((previousReport?.images || []).map(item => [item.route, item]));
const legacyReportCompatible = previousReport
  && previousReport.dimensions === `${seoConfig.images.width}x${seoConfig.images.height}`
  && previousReport.format === (seoConfig.images.format || 'png')
  && previousReport.quality === (seoConfig.images.quality || null);

async function generate(target) {
  const seed = deterministicNumber(`${target.language}:${target.category}:${target.slug}`);
  const [start, end, accent] = palette(seed);
  const topic = topics.find(item => item.id === target.topic || (item.aliases || []).includes(target.topic));
  const topicLabel = safeLabel(topic?.name?.en || target.category.replaceAll('-', ' '), 42).toUpperCase();
  const title = safeLabel(target.label, 42);
  const titleSize = title.length > 34 ? 36 : title.length > 26 ? 44 : 54;
  const x = 820 + (seed % 180);
  const y = 80 + (seed % 140);
  const radius = 150 + (seed % 90);
  const output = outputFor(target);
  await fs.mkdir(path.dirname(output), {recursive: true});
  const args = [
    '-size', `${seoConfig.images.width}x${seoConfig.images.height}`,
    `gradient:${start}-${end}`,
    '-fill', `${accent}22`, '-stroke', `${accent}88`, '-strokewidth', '2',
    '-draw', `circle ${x},${y} ${x + radius},${y}`,
    '-fill', '#FFFFFF18', '-stroke', '#FFFFFF44',
    '-draw', 'roundrectangle 58,50 1142,625 30,30',
    '-font', 'DejaVu-Sans', '-fill', accent, '-pointsize', '24',
    '-gravity', 'NorthWest', '-annotate', '+82+82', `LUQEVORA  /  ${target.language.toUpperCase()}`,
    '-fill', '#FFFFFF', '-pointsize', String(titleSize), '-gravity', 'West',
    '-annotate', '+82-18', title,
    '-fill', '#DCEBFF', '-pointsize', '24', '-gravity', 'SouthWest',
    '-annotate', '+84+82', `${topicLabel}  •  OFFICIAL-SOURCE GUIDE`,
    '-fill', accent, '-stroke', 'none',
    '-draw', 'roundrectangle 82,548 330,556 4,4',
    '-strip',
    '-quality', String(seoConfig.images.quality || 86),
    output
  ];
  await run(await imageTool(), args, {maxBuffer: 1024 * 1024});
}

const queue = [...targets.values()].sort((a, b) => `${a.language}/${a.category}/${a.slug}`.localeCompare(`${b.language}/${b.category}/${b.slug}`));
const records = [];
let generatedCount = 0;
let reusedCount = 0;

async function processTarget(target) {
  const route = routeFor(target);
  const output = outputFor(target);
  const currentFingerprint = fingerprint(target);
  const previous = previousByRoute.get(route);
  const canReuse = !force
    && await exists(output)
    && ((previous?.fingerprint && previous.fingerprint === currentFingerprint) || (!previous?.fingerprint && legacyReportCompatible));

  if (canReuse) {
    reusedCount += 1;
  } else {
    await generate(target);
    generatedCount += 1;
  }

  return {
    route,
    image: path.relative(root, output).replaceAll('\\', '/'),
    fingerprint: currentFingerprint,
    status: canReuse ? 'reused' : 'generated'
  };
}

for (let index = 0; index < queue.length; index += concurrency) {
  records.push(...await Promise.all(queue.slice(index, index + concurrency).map(processTarget)));
}

const expected = new Set(records.map(record => path.resolve(root, record.image)));
for (const file of await walk(imageRoot).catch(() => [])) {
  if (!expected.has(path.resolve(file))) await fs.rm(file, {force: true});
}

await writeFile(reportFile, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  generatorVersion: 2,
  dimensions: `${seoConfig.images.width}x${seoConfig.images.height}`,
  format: seoConfig.images.format || 'png',
  quality: seoConfig.images.quality || null,
  imageCount: records.length,
  generatedCount,
  reusedCount,
  images: records
}, null, 2)}\n`);
console.log(`Prepared ${records.length} unique article images (${generatedCount} generated, ${reusedCount} reused).`);
