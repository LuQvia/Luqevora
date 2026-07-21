import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './lib.mjs';

const read = rel => fs.readFile(path.join(root, rel), 'utf8');
const json = async rel => JSON.parse(await read(rel));
const results = [];
const check = (name, pass, detail = '') => results.push({name, pass: Boolean(pass), detail: String(detail ?? '')});

const pkg = await json('package.json');
const affiliates = await json('content/config/affiliates.json');
const prospects = await json('content/config/affiliate-prospects.json');
const translations = await json('content/article-batches/english-translations.json');
const referral = 'https://referworkspace.app.goo.gl/GNVm';
const mailto = 'mailto:info@luqvia.com?subject=Google%20Workspace%20US%20promo%20code%20request';
const structured = [
  'google-workspace-pricing-small-business',
  'google-workspace-vs-microsoft-365-small-business',
  'gmail-vs-google-workspace-business-email',
  'google-workspace-domain-email-setup'
];
const batch = [
  'custom-domain-email-guide',
  'google-chat-guide',
  'google-meet-guide',
  'google-workspace-guide',
  'slack-vs-google-chat'
];
const all = [...structured, ...batch];

check('package version', /^4\.3\.[3-9]$/.test(pkg.version), pkg.version);
check('US referral configured', affiliates.links?.['google-workspace-us']?.url === referral, JSON.stringify(affiliates.links?.['google-workspace-us'] || null));
check('US referral English market', affiliates.links?.['google-workspace-us']?.language === 'en' && affiliates.links?.['google-workspace-us']?.market === 'United States', JSON.stringify(affiliates.links?.['google-workspace-us'] || null));
check('promo request mailto configured', affiliates.links?.['google-workspace-us-promo-request']?.destination === mailto, JSON.stringify(affiliates.links?.['google-workspace-us-promo-request'] || null));
check('Japan referral remains separate', affiliates.links?.['google-workspace']?.url === 'https://referworkspace.app.goo.gl/ewLM' && affiliates.links?.['google-workspace']?.language === 'ja', JSON.stringify(affiliates.links?.['google-workspace'] || null));
const prospect = prospects.programs?.find(item => item.key === 'google-workspace');
check('multi-region prospect active', prospect?.status === 'active-referral-multi-region', prospect?.status);
check('regional keys registered', prospect?.regionalReferralKeys?.includes('google-workspace') && prospect?.regionalReferralKeys?.includes('google-workspace-us'), JSON.stringify(prospect?.regionalReferralKeys || []));
check('promotion codes excluded from public config', prospect?.publicPromotionCodesStored === false, prospect?.publicPromotionCodesStored);

for (const slug of structured) {
  const source = await json(`content/articles/en/${slug}.json`);
  check(`structured source affiliate disclosure: ${slug}`, source.affiliateDisclosure === true, source.affiliateDisclosure);
  check(`structured source US referral CTA: ${slug}`, source.ctas?.some(cta => cta.affiliateKey === 'google-workspace-us'), JSON.stringify(source.ctas || []));
  check(`structured source promo request CTA: ${slug}`, source.ctas?.some(cta => cta.affiliateKey === 'google-workspace-us-promo-request' && cta.officialUrl === mailto), JSON.stringify(source.ctas || []));
  check(`structured source promo section: ${slug}`, source.sections?.some(section => section.heading === 'US referral link and first-year promotion codes'), source.sections?.map(section => section.heading).join(' | '));
}

for (const slug of batch) {
  const record = translations.find(item => item.slug === slug);
  check(`batch record exists: ${slug}`, Boolean(record), record?.slug || 'missing');
  check(`batch US referral CTA: ${slug}`, record?.ctas?.some(cta => cta.affiliateKey === 'google-workspace-us'), JSON.stringify(record?.ctas || []));
  check(`batch promo request CTA: ${slug}`, record?.ctas?.some(cta => cta.affiliateKey === 'google-workspace-us-promo-request' && cta.officialUrl === mailto), JSON.stringify(record?.ctas || []));
  check(`batch promo content flag: ${slug}`, record?.workspaceUsPromoOffer === true, record?.workspaceUsPromoOffer);
}

for (const slug of all) {
  const html = await read(`public/en/business-software/${slug}/index.html`);
  check(`public US referral URL: ${slug}`, html.includes(referral));
  check(`public affiliate key: ${slug}`, html.includes('data-affiliate-key="google-workspace-us"') && html.includes('data-affiliate-link="true"'));
  check(`public sponsored rel: ${slug}`, html.includes('rel="sponsored nofollow noopener"'));
  check(`public affiliate disclosure: ${slug}`, html.includes('Contains affiliate links'));
  check(`public promo request: ${slug}`, html.includes(mailto) && html.includes('Request a 10% first-year promo code'));
  check(`public private distribution wording: ${slug}`, html.includes('codes are not published on this website') && html.includes('one customer account only'));
  check(`public US billing timing: ${slug}`, html.includes('before entering billing information') || html.includes('before completing trial signup'));
  check(`no promotion-code-looking token in page: ${slug}`, !/[A-Z0-9]{15}/.test(html));
  check(`Japanese referral absent from English page: ${slug}`, !html.includes('https://referworkspace.app.goo.gl/ewLM'));
}

const publicFiles = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(html|json|xml|txt|js|css)$/i.test(entry.name)) publicFiles.push(full);
  }
}
await walk(path.join(root, 'public'));
let suspicious = [];
for (const file of publicFiles) {
  const text = await fs.readFile(file, 'utf8');
  if (/promotion\s*code\s*[:：]\s*[A-Z0-9]{12,}/i.test(text)) suspicious.push(path.relative(root, file));
}
check('no published promotion code assignment', suspicious.length === 0, suspicious.join(', '));
check('release document present', (await read('docs/GOOGLE_WORKSPACE_US_REFERRAL_V4.3.3.md')).includes('公開ZIPには保存しません'));

const failures = results.filter(item => !item.pass);
const report = {version: '4.3.3', generatedAt: new Date().toISOString(), total: results.length, passed: results.length - failures.length, failed: failures.length, results};
await fs.writeFile(path.join(root, 'reports/v4.3.3-google-workspace-us-referral-qa.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`v4.3.3 Google Workspace US referral QA: ${report.passed}/${report.total} passed`);
if (failures.length) {
  for (const item of failures.slice(0, 50)) console.error(`FAIL ${item.name}: ${item.detail}`);
  process.exitCode = 1;
}
