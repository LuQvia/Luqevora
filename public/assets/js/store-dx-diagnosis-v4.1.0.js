(() => {
  const root = document.querySelector('[data-store-dx-diagnosis]');
  if (!root) return;
  const form = root.querySelector('[data-store-dx-form]');
  const results = root.querySelector('[data-store-dx-results]');
  const roadmapNode = root.querySelector('[data-store-dx-roadmap]');
  const productsNode = root.querySelector('[data-store-dx-products]');
  const guidesNode = root.querySelector('[data-store-dx-guides]');
  const titleNode = root.querySelector('[data-store-dx-result-title]');
  const summaryNode = root.querySelector('[data-store-dx-result-summary]');
  const data = JSON.parse(root.querySelector('[data-store-dx-data]').textContent);
  const lang = root.dataset.lang || 'ja';
  const ja = lang === 'ja';
  const esc = value => String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const track = (event, params = {}) => { window.dataLayer = window.dataLayer || []; window.dataLayer.push({event, ...params}); };

  const industryName = {
    restaurant: ja ? '飲食店' : 'restaurant', salon: ja ? '美容サロン' : 'salon',
    retail: ja ? '小売店' : 'retail business', service: ja ? 'サービス店舗' : 'service business'
  };
  const painMap = {
    checkout: {group:'payments', title:ja?'POS・決済を整える':'Align POS and payments', text:ja?'会計金額、支払方法、取消、現金差額を同じルールで記録します。':'Use one rule for checkout amounts, payment methods, cancellation, and cash differences.'},
    orders: {group:'pos', title:ja?'注文・受付を省力化する':'Improve order and intake flow', text:ja?'受付から提供完了までのボトルネックを確認します。':'Measure the complete path from intake to service completion.'},
    booking: {group:'reservations', title:ja?'予約・スタッフ枠を統合する':'Consolidate booking and capacity', text:ja?'予約経路、スタッフ、設備、変更期限を一つの台帳で管理します。':'Manage channels, staff, resources, and change deadlines in one schedule.'},
    inventory: {group:'pos', title:ja?'商品・在庫の基準を作る':'Standardize products and inventory', text:ja?'商品コードと在庫が動く操作を先に定義します。':'Define product identifiers and every inventory movement.'},
    retention: {group:'retention', title:ja?'顧客・LINE導線を設計する':'Design customer and LINE journeys', text:ja?'予約確認、来店後フォロー、再来店案内の目的と同意を整理します。':'Define consent and purposes for confirmation, follow-up, and retention.'},
    accounting: {group:'accounting', title:ja?'会計・入金を連携する':'Connect accounting and settlements', text:ja?'POS売上、決済入金、銀行、会計の重複入力を減らします。':'Reduce duplicate entry across POS, settlements, banks, and accounting.'},
    website: {group:'retention', title:ja?'Web・予約・問い合わせ導線を整える':'Improve web, booking, and inquiry journeys', text:ja?'検索、SNS、LINEから予約・問い合わせまでの離脱を確認します。':'Review drop-off from search and social channels to booking or inquiry.'},
    staffing: {group:'accounting', title:ja?'勤怠・人員配置を可視化する':'Connect attendance and staffing', text:ja?'時間帯別売上と勤務時間を比較できる基準を作ります。':'Create consistent data for comparing sales by time with labor hours.'}
  };
  const defaultPains = {restaurant:['checkout','orders','accounting'], salon:['booking','retention','checkout'], retail:['inventory','checkout','accounting'], service:['booking','checkout','retention']};

  function selected(formData, key) { return formData.getAll(key); }
  function unique(list) { return [...new Set(list)]; }
  function roadmap(pains, industry) {
    const ordered = unique([...(defaultPains[industry] || []), ...pains]);
    return ordered.slice(0, 5).map((key, index) => ({...painMap[key], key, index:index+1})).filter(item => item.title);
  }
  function scoreProducts(pains, industry, budget, locations) {
    const targetGroups = new Set(pains.map(pain => painMap[pain]?.group).filter(Boolean));
    if (industry === 'restaurant') targetGroups.add('pos');
    if (industry === 'salon' || industry === 'service') targetGroups.add('reservations');
    if (industry === 'retail') targetGroups.add('pos');
    const targetIds = new Set([...targetGroups].flatMap(group => data.productGroups[group] || []));
    return data.products.map(product => {
      let score = targetIds.has(product.id) ? 8 : 0;
      if (budget === 'test' && product.flags?.freeOption) score += 4;
      if (budget === 'support' && /support|サポート|相談|見積/.test(`${product.bestFor} ${(product.strengths||[]).join(' ')}`.toLowerCase())) score += 2;
      if (locations === 'multi' && /multi|複数|法人|business|team/.test(`${product.bestFor} ${(product.strengths||[]).join(' ')}`.toLowerCase())) score += 2;
      pains.forEach(pain => {
        const group = painMap[pain]?.group;
        if ((data.productGroups[group] || []).includes(product.id)) score += 3;
      });
      return {product, score};
    }).filter(item => item.score > 0).sort((a,b) => b.score - a.score || a.product.name.localeCompare(b.product.name)).slice(0, 8);
  }
  function guideCards(industry) {
    const routes = data.articleRoutes;
    const items = [
      [routes.roadmap, ja?'店舗DX導入ロードマップ':'Store DX implementation roadmap', ja?'導入順序、担当、30日単位の確認方法':'Sequence, ownership, and thirty-day validation'],
      [routes.stack, ja?'店舗DXツール構成比較':'Store DX stack comparison', ja?'POS・決済・予約・LINE・会計の組み合わせ':'Combinations of POS, payments, booking, LINE, and accounting']
    ];
    if (industry === 'salon' || industry === 'service') items.push([routes.salon, ja?'美容サロンの店舗DXガイド':'Salon Store DX guide', ja?'予約・顧客カルテ・再来店を設計':'Design booking, customer records, and retention']);
    if (industry === 'retail') items.push([routes.retail, ja?'小売店の店舗DXガイド':'Retail Store DX guide', ja?'商品・在庫・決済・会計を接続':'Connect products, inventory, payments, and accounting']);
    if (industry === 'restaurant') items.push([`/${lang}/store-dx/small-restaurant-dx-guide/`, ja?'小規模飲食店のDX入門':'Small restaurant DX guide', ja?'少人数営業で優先する仕組み':'Priorities for a small operating team']);
    return items;
  }

  track('store_dx_diagnosis_start');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const fd = new FormData(form);
    const industry = fd.get('industry') || 'restaurant';
    const locations = fd.get('locations') || 'one';
    const budget = fd.get('budget') || 'balanced';
    const timing = fd.get('timing') || 'research';
    let pains = selected(fd, 'pain');
    if (!pains.length) pains = defaultPains[industry] || ['checkout','accounting'];
    const current = selected(fd, 'current');
    const steps = roadmap(pains, industry);
    const shortlist = scoreProducts(pains, industry, budget, locations);
    titleNode.textContent = ja ? `${industryName[industry]}向けの優先ロードマップ` : `Priority roadmap for a ${industryName[industry]}`;
    summaryNode.textContent = ja
      ? `${pains.length}件の課題と現在利用中の${current.length}種類の仕組みを基に、${steps.length}段階で整理しました。`
      : `The result uses ${pains.length} selected problems and ${current.length} current system types to create ${steps.length} stages.`;
    roadmapNode.innerHTML = steps.map(step => `<article><span>${step.index}</span><div><h4>${esc(step.title)}</h4><p>${esc(step.text)}</p></div></article>`).join('');
    productsNode.innerHTML = shortlist.map(({product}, index) => `<article class="store-dx-product-card"><span>${index + 1}</span><h4>${esc(product.name)}</h4><p>${esc(product.bestFor)}</p><ul>${(product.strengths||[]).slice(0,2).map(item=>`<li>${esc(item)}</li>`).join('')}</ul><p><strong>${ja?'確認点':'Caution'}:</strong> ${esc((product.limits||[])[0]||'')}</p><div class="store-dx-card-actions"><a class="text-link" data-track-event="store_dx_product_open" href="/${lang}/products/${encodeURIComponent(product.id)}/">${ja?'製品データ':'Product data'}</a><a class="text-link" href="/${lang}/compare/?q=${encodeURIComponent(product.id)}">${ja?'比較DB':'Compare'}</a></div></article>`).join('') || `<p>${ja?'条件に近い製品データがありません。比較DBで条件を広げてください。':'No close catalog match was found. Broaden the filters in the product database.'}</p>`;
    guidesNode.innerHTML = guideCards(industry).map(([url,title,text]) => `<a class="store-dx-article-card" href="${esc(url)}"><strong>${esc(title)}</strong><span>${esc(text)}</span></a>`).join('');
    results.hidden = false;
    results.scrollIntoView({behavior:'smooth', block:'start'});
    track('store_dx_diagnosis_complete', {industry, locations, budget, timing, pains:pains.join(','), current_count:current.length, result_count:shortlist.length});
  });
  form.addEventListener('reset', () => { results.hidden = true; roadmapNode.innerHTML = ''; productsNode.innerHTML = ''; guidesNode.innerHTML = ''; });
  root.querySelector('[data-store-dx-print]')?.addEventListener('click', () => { track('store_dx_diagnosis_print'); window.print(); });
  root.addEventListener('click', event => { const link = event.target.closest('[data-track-event]'); if (link) track(link.dataset.trackEvent, {href:link.href || ''}); });
})();
