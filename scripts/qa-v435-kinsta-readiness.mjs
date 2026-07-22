import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './lib.mjs';

const read = rel => fs.readFile(path.join(root, rel), 'utf8');
const json = async rel => JSON.parse(await read(rel));
const results = [];
const check = (name, pass, detail='') => results.push({name, pass:Boolean(pass), detail:String(detail || '')});

async function htmlFiles(dirRel) {
  const out = [];
  async function walk(abs, rel) {
    for (const entry of await fs.readdir(abs, {withFileTypes:true})) {
      const nextAbs = path.join(abs, entry.name);
      const nextRel = path.join(rel, entry.name);
      if (entry.isDirectory()) await walk(nextAbs, nextRel);
      else if (entry.isFile() && entry.name.endsWith('.html')) out.push(nextRel.replaceAll('\\', '/'));
    }
  }
  await walk(path.join(root, dirRel), dirRel);
  return out;
}

const pkg = await json('package.json');
const site = await json('content/config/site.json');
check('package version', pkg.version === '4.3.5', pkg.version);
check('public brand configuration', site.siteName === 'Luqevora.com', site.siteName);
check('operator configuration', site.organization?.name === 'LuQvia', site.organization?.name);

const requiredPages = [
  'public/en/about/index.html',
  'public/ja/about/index.html',
  'public/en/editorial-policy/index.html',
  'public/ja/editorial-policy/index.html',
  'public/en/affiliate-disclosure/index.html',
  'public/ja/affiliate-disclosure/index.html',
  'public/en/privacy/index.html',
  'public/ja/privacy/index.html',
  'public/en/terms/index.html',
  'public/ja/terms/index.html',
  'public/en/contact/index.html',
  'public/ja/contact/index.html',
  'public/en/hosting-security/kinsta-review/index.html',
  'public/ja/hosting-security/kinsta-review/index.html'
];
for (const rel of requiredPages) {
  try {
    const html = await read(rel);
    check(`required page: ${rel}`, html.length > 500, `${html.length} bytes`);
  } catch (error) {
    check(`required page: ${rel}`, false, error.message);
  }
}

const enAbout = await read('public/en/about/index.html');
const jaAbout = await read('public/ja/about/index.html');
check('English brand display', enAbout.includes('Luqevora.com'));
check('English operator display', enAbout.includes('Operated by LuQvia'));
check('English relationship wording', enAbout.includes('Luqevora.com is operated by LuQvia'));
check('Japanese brand display', jaAbout.includes('Luqevora.com'));
check('Japanese operator display', jaAbout.includes('運営：LuQvia') || jaAbout.includes('<strong>運営</strong><p>LuQvia</p>'));
check('Japanese relationship wording', jaAbout.includes('Luqevora.comは、LuQviaが運営する'));

const operatorFormPattern = /(LuQvia.{0,160}(sole proprietorship|independent business|個人事業|個人事業主)|(sole proprietorship|independent business|個人事業|個人事業主).{0,160}LuQvia)/is;
for (const scope of ['public', 'legacy']) {
  const files = await htmlFiles(scope);
  const matches = [];
  for (const rel of files) {
    const html = await read(rel);
    if (operatorFormPattern.test(html)) matches.push(rel);
  }
  check(`${scope} operator legal-form wording removed`, matches.length === 0, matches.join(', '));
}

for (const language of ['en', 'ja']) {
  const rel = `public/${language}/hosting-security/kinsta-review/index.html`;
  const html = await read(rel);
  check(`${language} Kinsta article uses official sources`, /https:\/\/kinsta\.com\//.test(html));
  check(`${language} Kinsta article has disclosure`, html.includes(language === 'en' ? 'Affiliate disclosure:' : '広告開示：'));
  check(`${language} Kinsta article contains no unapproved tracking parameters`, !/kinsta\.com[^"'<>\s]*(affiliate|aff=|ref=|partner=|utm_source=affiliate)/i.test(html));
}

const enDisclosure = await read('public/en/affiliate-disclosure/index.html');
const jaDisclosure = await read('public/ja/affiliate-disclosure/index.html');
check('English affiliate disclosure identifies commercial links', /affiliate|commission|compensation/i.test(enDisclosure));
check('Japanese affiliate disclosure identifies advertising relationships', /広告|アフィリエイト|報酬/.test(jaDisclosure));

const failures = results.filter(result => !result.pass);
const report = {
  version: '4.3.5',
  generatedAt: new Date().toISOString(),
  total: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  results
};
await fs.writeFile(path.join(root, 'reports/v4.3.5-kinsta-application-readiness-qa.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`v4.3.5 Kinsta application readiness QA: ${report.passed}/${report.total} passed`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure.name}: ${failure.detail}`);
  process.exitCode = 1;
}
