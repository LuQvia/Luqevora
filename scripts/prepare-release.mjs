import fs from 'node:fs/promises';
import path from 'node:path';
import {root, readJson, writeFile} from './lib.mjs';

function argument(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

const site = await readJson(path.join(root, 'content/config/site.json'));
const currentFile = path.resolve(root, argument('--current-file', `${site.outputDirectory}/release-manifest.json`));
const outputFile = path.resolve(root, argument('--output', 'reports/changed-urls.json'));
const baselineFileArg = argument('--baseline-file');
const baselineUrl = argument('--baseline-url', `${site.baseUrl}/release-manifest.json`);
const current = JSON.parse(await fs.readFile(currentFile, 'utf8'));

if (current.site !== site.baseUrl || !Array.isArray(current.pages)) {
  throw new Error(`Current release manifest is invalid: ${currentFile}`);
}

let baseline = null;
let baselineSource = '';
let fallbackReason = '';

if (baselineFileArg) {
  const baselineFile = path.resolve(root, baselineFileArg);
  try {
    baseline = JSON.parse(await fs.readFile(baselineFile, 'utf8'));
    baselineSource = baselineFile;
  } catch (error) {
    fallbackReason = `Could not read baseline file: ${error.message}`;
  }
} else if (baselineUrl) {
  try {
    const response = await fetch(baselineUrl, {
      headers: {'cache-control': 'no-cache', accept: 'application/json'},
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    baseline = await response.json();
    baselineSource = baselineUrl;
  } catch (error) {
    fallbackReason = `Could not fetch live baseline: ${error.message}`;
  }
}

if (baseline && (baseline.site !== site.baseUrl || !Array.isArray(baseline.pages))) {
  fallbackReason = 'Baseline manifest schema or site does not match the current site.';
  baseline = null;
}

const currentMap = new Map(current.pages.map(page => [page.url, page]));
const baselineMap = new Map((baseline?.pages || []).map(page => [page.url, page]));
const changes = [];

for (const page of current.pages) {
  const previous = baselineMap.get(page.url);
  if (!previous) changes.push({url: page.url, change: 'added', currentHash: page.hash, previousHash: ''});
  else if (previous.hash !== page.hash) changes.push({url: page.url, change: 'updated', currentHash: page.hash, previousHash: previous.hash || ''});
}
for (const page of baseline?.pages || []) {
  if (!currentMap.has(page.url)) changes.push({url: page.url, change: 'deleted', currentHash: '', previousHash: page.hash || ''});
}

const siteHost = new URL(site.baseUrl).host;
const validChanges = changes
  .filter(item => {
    try {
      return new URL(item.url).host === siteHost;
    } catch {
      return false;
    }
  })
  .sort((a, b) => a.url.localeCompare(b.url) || a.change.localeCompare(b.change));

const summary = {
  added: validChanges.filter(item => item.change === 'added').length,
  updated: validChanges.filter(item => item.change === 'updated').length,
  deleted: validChanges.filter(item => item.change === 'deleted').length,
  unchanged: baseline ? current.pages.filter(page => baselineMap.get(page.url)?.hash === page.hash).length : 0
};
const result = {
  generatedAt: new Date().toISOString(),
  site: site.baseUrl,
  currentManifest: path.relative(root, currentFile).replaceAll('\\', '/'),
  baselineSource: baselineSource || null,
  baselineAvailable: Boolean(baseline),
  fallbackReason: fallbackReason || null,
  summary,
  urls: validChanges.map(item => item.url),
  changes: validChanges
};

await writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Prepared release delta: ${summary.added} added, ${summary.updated} updated, ${summary.deleted} deleted, ${summary.unchanged} unchanged.`);
if (fallbackReason) console.warn(fallbackReason);
