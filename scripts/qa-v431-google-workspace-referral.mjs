import fs from 'node:fs/promises';
import path from 'node:path';
import {root} from './lib.mjs';
const read=rel=>fs.readFile(path.join(root,rel),'utf8');
const json=async rel=>JSON.parse(await read(rel));
const results=[]; const check=(name,pass,detail='')=>results.push({name,pass:Boolean(pass),detail:String(detail||'')});
const pkg=await json('package.json');
const affiliates=await json('content/config/affiliates.json');
const prospects=await json('content/config/affiliate-prospects.json');
const referral='https://referworkspace.app.goo.gl/ewLM';
const slugs=['google-workspace-pricing-small-business','google-workspace-vs-microsoft-365-small-business','gmail-vs-google-workspace-business-email','google-workspace-domain-email-setup','google-workspace-guide','custom-domain-email-guide'];
check('package version',/^4\.3\.[1-9]$/.test(pkg.version),pkg.version);
check('referral URL configured',affiliates.links?.['google-workspace']?.url===referral,affiliates.links?.['google-workspace']?.url);
check('Japanese-only referral',affiliates.links?.['google-workspace']?.language==='ja',affiliates.links?.['google-workspace']?.language);
const prospect=prospects.programs?.find(p=>p.key==='google-workspace');
check('prospect active',['active-referral','active-referral-multi-region'].includes(prospect?.status),prospect?.status);
check('promo codes excluded from public config',prospect?.publicPromotionCodesStored===false,prospect?.publicPromotionCodesStored);
for(const slug of slugs){
  const source=await json(`content/articles/ja/${slug}.json`);
  const html=await read(`public/ja/business-software/${slug}/index.html`);
  check(`affiliate disclosure source: ${slug}`,source.affiliateDisclosure===true,source.affiliateDisclosure);
  check(`referral CTA source: ${slug}`,source.ctas?.some(c=>c.affiliateKey==='google-workspace'),JSON.stringify(source.ctas||[]));
  check(`private code request CTA source: ${slug}`,source.ctas?.some(c=>c.affiliateKey==='luqvia-store-dx-line'),JSON.stringify(source.ctas||[]));
  check(`referral URL public: ${slug}`,html.includes(referral));
  check(`sponsored rel: ${slug}`,html.includes('rel="sponsored nofollow noopener"'));
  check(`affiliate data attributes: ${slug}`,html.includes('data-affiliate-key="google-workspace"')&&html.includes('data-affiliate-link="true"'));
  check(`private distribution wording: ${slug}`,html.includes('公開していません')&&html.includes('個別に案内'));
  check(`no known promo-code pattern in HTML: ${slug}`,!/[A-Z0-9]{15}/.test(html));
}
for(const slug of ['google-workspace-pricing-small-business','google-workspace-vs-microsoft-365-small-business','gmail-vs-google-workspace-business-email','google-workspace-domain-email-setup']){
  const html=await read(`public/en/business-software/${slug}/index.html`);
  check(`Japanese referral not used on English page: ${slug}`,!html.includes(referral)&&!html.includes('data-affiliate-key="google-workspace"'));
}
check('public policy documents state codes are private',(await read('docs/GOOGLE_WORKSPACE_REFERRAL_V4.3.1.md')).includes('公開ZIPへ保存しません'));
const failures=results.filter(r=>!r.pass);
const report={version:'4.3.1',generatedAt:new Date().toISOString(),total:results.length,passed:results.length-failures.length,failed:failures.length,results};
await fs.writeFile(path.join(root,'reports/v4.3.1-google-workspace-referral-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`v4.3.1 Google Workspace referral QA: ${report.passed}/${report.total} passed`);
if(failures.length){for(const f of failures) console.error(`FAIL ${f.name}: ${f.detail}`);process.exitCode=1;}
