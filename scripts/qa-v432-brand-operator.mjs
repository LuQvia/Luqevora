import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './lib.mjs';

const read = rel => fs.readFile(path.join(root, rel), 'utf8');
const json = async rel => JSON.parse(await read(rel));
const results = [];
const check = (name, pass, detail='') => results.push({name, pass:Boolean(pass), detail:String(detail||'')});
const pkg = await json('package.json');
const site = await json('content/config/site.json');
check('package version', /^4\.3\.[2-9]$/.test(pkg.version), pkg.version);
check('site name', site.siteName === 'Luqevora.com', site.siteName);
check('operator organization', site.organization?.name === 'LuQvia', site.organization?.name);

const pages = [
  'public/ja/index.html',
  'public/en/index.html',
  'public/ja/about/index.html',
  'public/en/about/index.html',
  'public/ja/privacy/index.html',
  'public/en/privacy/index.html',
  'public/ja/articles/index.html',
  'public/en/articles/index.html'
];
for (const rel of pages) {
  const html = await read(rel);
  check(`brand displayed: ${rel}`, html.includes('Luqevora.com'));
  check(`operator status removed: ${rel}`, !/(LuQvia.{0,100}(個人事業|sole proprietorship|independent business)|個人事業.{0,100}LuQvia)/is.test(html));
}
const jaAbout = await read('public/ja/about/index.html');
const enAbout = await read('public/en/about/index.html');
check('Japanese operator display', jaAbout.includes('運営：LuQvia') || jaAbout.includes('<strong>運営</strong><p>LuQvia</p>'));
check('English operator display', enAbout.includes('Operated by LuQvia'));
check('Japanese relationship wording', jaAbout.includes('Luqevora.comは、LuQviaが運営する'));
check('English relationship wording', enAbout.includes('Luqevora.com is operated by LuQvia'));
check('organization structured data', jaAbout.includes('"name":"LuQvia"') && jaAbout.includes('"name":"Luqevora.com"'));

const manifest = await json('public/site.webmanifest');
check('webmanifest name', manifest.name === 'Luqevora.com', manifest.name);
check('webmanifest short name', manifest.short_name === 'Luqevora.com', manifest.short_name);
const referralPage = await read('public/ja/business-software/google-workspace-guide/index.html');
check('dotted brand not truncated in summaries', referralPage.includes('Luqevora.com運営者') && !referralPage.includes('Luqevora.</li>'));

const failures = results.filter(r => !r.pass);
const report = {version:'4.3.2', generatedAt:new Date().toISOString(), total:results.length, passed:results.length-failures.length, failed:failures.length, results};
await fs.writeFile(path.join(root,'reports/v4.3.2-brand-operator-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`v4.3.2 brand/operator QA: ${report.passed}/${report.total} passed`);
if (failures.length) { for (const f of failures) console.error(`FAIL ${f.name}: ${f.detail}`); process.exitCode=1; }
