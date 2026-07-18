import fs from 'node:fs/promises';
import path from 'node:path';
import {root, readJson, writeFile} from './lib.mjs';

const site = await readJson(path.join(root, 'content/config/site.json'));
const config = await readJson(path.join(root, 'content/config/indexnow.json'));
const remote = process.argv.includes('--remote');
const dryRun = process.argv.includes('--dry-run');

function argument(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function locations(xml) {
  return [...String(xml).matchAll(/<loc>([\s\S]*?)<\/loc>/g)]
    .map(match => match[1].replaceAll('&amp;', '&').trim())
    .filter(Boolean);
}

async function fetchText(url) {
  let lastStatus = 0;
  let lastBody = '';
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {'cache-control': 'no-cache'},
        signal: AbortSignal.timeout(20000)
      });
      lastStatus = response.status;
      if (response.ok) return response.text();
      lastBody = await response.text();
      if (attempt < 4 && (response.status === 429 || response.status >= 500)) {
        await new Promise(resolve => setTimeout(resolve, attempt * 3000));
        continue;
      }
      break;
    } catch (error) {
      lastBody = error.message;
      if (attempt < 4) {
        await new Promise(resolve => setTimeout(resolve, attempt * 3000));
        continue;
      }
    }
  }
  throw new Error(`Could not fetch ${url}: HTTP ${lastStatus || 'network error'} ${lastBody}`.trim());
}

async function remoteUrls() {
  const childUrls = locations(await fetchText(`${site.baseUrl}/sitemap.xml`));
  const bodies = await Promise.all(childUrls.map(fetchText));
  return [...new Set(bodies.flatMap(locations).filter(url => !url.includes('/sitemaps/')))];
}

async function localUrls() {
  const directory = path.join(root, site.outputDirectory, 'sitemaps');
  const files = (await fs.readdir(directory)).filter(file => file.endsWith('.xml'));
  const bodies = await Promise.all(files.map(file => fs.readFile(path.join(directory, file), 'utf8')));
  return [...new Set(bodies.flatMap(locations))];
}

async function fileUrls(file) {
  const payload = JSON.parse(await fs.readFile(path.resolve(root, file), 'utf8'));
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.urls)) return payload.urls;
  if (Array.isArray(payload.changes)) return payload.changes.map(item => typeof item === 'string' ? item : item.url);
  throw new Error(`URL file does not contain an array, urls, or changes: ${file}`);
}

if (!/^[A-Za-z0-9-]{8,128}$/.test(config.key || '')) throw new Error('IndexNow key must be 8-128 letters, numbers, or hyphens.');
const endpoint = new URL(config.endpoint);
if (endpoint.protocol !== 'https:') throw new Error('IndexNow endpoint must use HTTPS.');

const urlsFile = argument('--urls-file');
const source = urlsFile ? `file ${urlsFile}` : remote ? 'the live sitemap' : 'local sitemaps';
const candidateUrls = urlsFile ? await fileUrls(urlsFile) : remote ? await remoteUrls() : await localUrls();
const host = new URL(site.baseUrl).host;
const urls = [...new Set(candidateUrls.filter(Boolean).map(String))]
  .filter(url => {
    try {
      return new URL(url).host === host;
    } catch {
      return false;
    }
  })
  .sort();

if (!urls.length) {
  console.log(`No changed URLs to submit from ${source}.`);
  await writeFile(path.join(root, 'reports/indexnow-submission.json'), `${JSON.stringify({
    generatedAt: new Date().toISOString(), source, dryRun, urlCount: 0, batches: []
  }, null, 2)}\n`);
  process.exit(0);
}

const batches = [];
for (let index = 0; index < urls.length; index += 10000) {
  const urlList = urls.slice(index, index + 10000);
  const body = {
    host,
    key: config.key,
    keyLocation: `${site.baseUrl}/${config.key}.txt`,
    urlList
  };

  if (dryRun) {
    batches.push({index: batches.length + 1, urlCount: urlList.length, status: 'dry-run'});
    continue;
  }

  let accepted = false;
  let responseStatus = 0;
  let responseBody = '';
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {'content-type': 'application/json; charset=utf-8'},
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      });
      responseStatus = response.status;
      responseBody = await response.text();
      if (response.ok || response.status === 202) {
        accepted = true;
        break;
      }
      if (attempt < 4 && (response.status === 429 || response.status >= 500)) {
        await new Promise(resolve => setTimeout(resolve, attempt * 5000));
        continue;
      }
      break;
    } catch (error) {
      responseBody = error.message;
      if (attempt < 4) {
        await new Promise(resolve => setTimeout(resolve, attempt * 5000));
        continue;
      }
    }
  }
  if (!accepted) throw new Error(`IndexNow submission failed: HTTP ${responseStatus || 'network error'} ${responseBody}`.trim());
  batches.push({index: batches.length + 1, urlCount: urlList.length, status: responseStatus});
}

await writeFile(path.join(root, 'reports/indexnow-submission.json'), `${JSON.stringify({
  generatedAt: new Date().toISOString(), source, dryRun, urlCount: urls.length, batches
}, null, 2)}\n`);
console.log(`${dryRun ? 'Prepared' : 'Submitted'} ${urls.length} URL(s) to IndexNow from ${source}${dryRun ? ' (dry run)' : ''}.`);
