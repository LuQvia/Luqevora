const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
if(menuButton&&nav){menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.classList.toggle('open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuButton.classList.remove('open');menuButton.setAttribute('aria-expanded','false');}));}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(!id||id==='#')return;const t=document.querySelector(id);if(!t)return;e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}));
const revealTargets=document.querySelectorAll('.card,.service-card,.process-grid>div,.sample-highlight>div,.notice-box,.seo-box');
if('IntersectionObserver'in window){revealTargets.forEach(el=>el.classList.add('reveal'));const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.08});revealTargets.forEach(el=>observer.observe(el));}

(function(){
  function emit(name,params){
    params=params||{};
    if(typeof window.gtag==='function') window.gtag('event',name,params);
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(Object.assign({event:name},params));
  }
  var type=document.querySelector('meta[name="luqvia:content_type"]');
  if(type&&type.content==='area'){
    var area=document.querySelector('meta[name="luqvia:area"]');
    var pref=document.querySelector('meta[name="luqvia:prefecture"]');
    emit('area_page_view',{area_name:area?area.content:'',prefecture:pref?pref.content:'',page_path:location.pathname});
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[data-cta]'); if(!a)return;
    var area=document.querySelector('meta[name="luqvia:area"]');
    emit('lead_cta_click',{cta_type:a.dataset.cta||'unknown',area_name:area?area.content:'',link_url:a.href,page_path:location.pathname});
  });
})();

// LuQvia Revenue Foundation v3.1
(function(){
  function pushEvent(name,params){
    params=params||{};
    if(typeof window.gtag==='function') window.gtag('event',name,params);
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(Object.assign({event:name},params));
  }
  var content=document.querySelector('meta[name="luqvia:content_type"]');
  if(content&&content.content==='article'){
    pushEvent('article_view',{page_title:document.title,page_path:location.pathname});
  }
  if(location.pathname.indexOf('/works/')===0&&location.pathname!=='/works/'){
    pushEvent('case_study_view',{page_title:document.title,page_path:location.pathname});
  }
  if(location.pathname==='/price/'||location.pathname==='/price/index.html'){
    pushEvent('pricing_view',{page_path:location.pathname});
  }
})();


// Phase2 cross-brand and global service analytics

(function(){
  function emit(name,params){if(typeof window.gtag==='function')window.gtag('event',name,params);window.dataLayer=window.dataLayer||[];window.dataLayer.push(Object.assign({event:name},params||{}));}
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href]');if(!a)return;
    var u;try{u=new URL(a.href,location.href);}catch(_){return;}
    if(/(^|\.)luqevora\.com$/.test(u.hostname)||/(^|\.)solqvia\.com$/.test(u.hostname))emit('cross_brand_click',{source_brand:'luqvia',destination_brand:u.hostname.indexOf('luqevora')>=0?'luqevora':'solqvia',link_url:u.href,page_path:location.pathname});
    if(location.pathname.indexOf('/global/')===0||location.pathname.indexOf('/en/')===0||location.pathname.indexOf('/japan-market-entry/')===0||location.pathname.indexOf('/japanese-localization/')===0||location.pathname.indexOf('/ai-workflow-automation/')===0)emit('global_service_cta_click',{link_url:u.href,page_path:location.pathname,cta_text:(a.textContent||'').trim().slice(0,80)});
  });
})();


/* Phase3 attribution and conversion measurement 2026-07-25 */

(()=>{const KEY='luqvia-attribution-v1';const clean=v=>(v||'').toString().slice(0,160);const emit=(n,p={})=>{if(typeof window.gtag==='function')window.gtag('event',n,p);window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:n,...p});};const params=new URLSearchParams(location.search);let stored={};try{stored=JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch(_){stored={}}const ref=(()=>{try{return new URL(document.referrer).hostname}catch(_){return''}})();const incoming={utm_source:clean(params.get('utm_source')),utm_medium:clean(params.get('utm_medium')),utm_campaign:clean(params.get('utm_campaign')),utm_content:clean(params.get('utm_content')),referrer_domain:clean(ref),source_brand:/luqevora/.test(ref)?'luqevora':(/solqvia/.test(ref)?'solqvia':'')};const attribution={...stored,...Object.fromEntries(Object.entries(incoming).filter(([,v])=>v))};try{sessionStorage.setItem(KEY,JSON.stringify(attribution))}catch(_){}const context=()=>({brand:'luqvia',page_path:location.pathname,service_area:document.body?.dataset.serviceArea||'',...attribution});document.addEventListener('DOMContentLoaded',()=>{emit('brand_page_context',context());const seen=new WeakSet();if('IntersectionObserver'in window){const ob=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting||seen.has(e.target))return;seen.add(e.target);emit('lead_cta_impression',{...context(),cta_type:e.target.dataset.cta||'',cta_text:clean(e.target.textContent),link_url:e.target.href||''});ob.unobserve(e.target)}),{threshold:.5});document.querySelectorAll('a[data-cta]').forEach(x=>ob.observe(x));}let started=false;document.querySelectorAll('form').forEach(f=>{f.addEventListener('focusin',()=>{if(started)return;started=true;emit('lead_form_start',context())},{once:true});f.addEventListener('submit',()=>emit('lead_form_submit_attempt',context()));});document.querySelectorAll('[data-checklist-print]').forEach(b=>b.addEventListener('click',()=>{emit('readiness_checklist_print',context());window.print()}));document.addEventListener('click',e=>{const a=e.target.closest('a[data-cta],a[data-track-event]');if(!a)return;emit(a.dataset.trackEvent||'lead_interest_click',{...context(),cta_type:a.dataset.cta||'',service:a.dataset.service||'',link_url:a.href||'',link_text:clean(a.textContent)});});});window.LuQviaAttribution=Object.freeze({get:()=>({...attribution})});})();



/* LuQvia v3.6.0 package analytics */
(function(){function emit(n,p){if(typeof window.gtag==='function')window.gtag('event',n,p||{});window.dataLayer=window.dataLayer||[];window.dataLayer.push(Object.assign({event:n},p||{}));}if(location.pathname==='/price/'||location.pathname==='/price/index.html')emit('package_view',{page_path:location.pathname});document.addEventListener('click',function(e){var a=e.target.closest('a[data-cta="package"]');if(!a)return;emit('package_interest_click',{service:a.dataset.service||'',link_url:a.href,page_path:location.pathname});});})();
