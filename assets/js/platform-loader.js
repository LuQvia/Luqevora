/* LuQvia consent-aware analytics loader */
(function () {
  'use strict';
  var cfg = window.LUQVIA_CONFIG || {};
  var key = cfg.consentKey || 'luqvia-consent-v1';
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = window.gtag || gtag;
  gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});

  function safeGet(){try{return localStorage.getItem(key);}catch(e){return null;}}
  function safeSet(v){try{localStorage.setItem(key,v);}catch(e){}}
  function loadScript(src,id){if(id&&document.getElementById(id))return;var s=document.createElement('script');if(id)s.id=id;s.async=true;s.src=src;document.head.appendChild(s);}
  function loadAnalytics(){
    var mode=cfg.analyticsMode||((cfg.gtmId&&/^GTM-[A-Z0-9]+$/.test(cfg.gtmId))?'gtm':'ga4');
    /* Load exactly one analytics transport. GTM is primary when both IDs exist. */
    if(mode==='gtm' && cfg.gtmId && /^GTM-[A-Z0-9]+$/.test(cfg.gtmId)){
      window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js',ga4_measurement_id:cfg.ga4Id||''});
      loadScript('https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(cfg.gtmId),'luqvia-gtm');
    } else if(mode==='ga4' && cfg.ga4Id && /^G-[A-Z0-9]+$/.test(cfg.ga4Id)){
      loadScript('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(cfg.ga4Id),'luqvia-ga4');
      gtag('js',new Date());gtag('config',cfg.ga4Id,{anonymize_ip:true});
    }
    if(cfg.clarityId && /^[a-z0-9]+$/i.test(cfg.clarityId)){
      (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script',cfg.clarityId);
    }
  }
  function apply(value){
    var granted=value==='granted';
    gtag('consent','update',{analytics_storage:granted?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    if(granted)loadAnalytics();
    document.documentElement.dataset.analyticsConsent=value;
  }
  function banner(){
    if(document.querySelector('.privacy-consent'))return;
    var el=document.createElement('aside');el.className='privacy-consent';el.setAttribute('role','dialog');el.setAttribute('aria-label','プライバシー設定');
    el.innerHTML='<div><strong>アクセス解析の設定</strong><p>サイト改善のため、許可された場合のみアクセス解析サービスを読み込みます。広告目的のCookieは設定しません。</p><a href="/privacy/">詳しく見る</a></div><div class="privacy-consent-actions"><button type="button" data-consent="denied">必要な機能のみ</button><button type="button" class="primary" data-consent="granted">分析を許可</button></div>';
    document.body.appendChild(el);
    el.querySelectorAll('[data-consent]').forEach(function(btn){btn.addEventListener('click',function(){var before=safeGet();var v=btn.getAttribute('data-consent');safeSet(v);apply(v);el.remove();if(before==='granted'&&v==='denied')location.reload();});});
  }
  function isConfigured(){return !!((cfg.gtmId&&/^GTM-[A-Z0-9]+$/.test(cfg.gtmId))||(cfg.ga4Id&&/^G-[A-Z0-9]+$/.test(cfg.ga4Id))||(cfg.clarityId&&/^[a-z0-9]+$/i.test(cfg.clarityId)));}
  function openSettings(){if(!isConfigured())return;var current=safeGet();if(current){safeSet('');}banner();}
  document.addEventListener('click',function(e){if(e.target.closest('[data-open-privacy-settings]')){e.preventDefault();openSettings();}});
  if(!isConfigured()){document.documentElement.dataset.analyticsConsent='not-configured';return;}
  var choice=safeGet();if(choice==='granted'||choice==='denied')apply(choice);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',banner);else banner();
})();
