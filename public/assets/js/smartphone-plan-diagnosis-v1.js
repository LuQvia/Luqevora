(function (root, factory) {
  const api = factory(root && root.LQV_PLAN_DATA);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LQVPlanDiagnosis = api;
})(typeof window !== 'undefined' ? window : globalThis, function (DATA) {
  'use strict';

  const DATA_USAGE = { '1': 1, '3': 3, '5': 5, '10': 10, '20': 20, '30': 30, '50': 50, '80': 80 };

  const WEIGHTS = {
    price:    { cost: 45, data: 25, calls: 10, support: 5,  lifestyle: 15 },
    data:     { cost: 25, data: 40, calls: 10, support: 5,  lifestyle: 20 },
    calls:    { cost: 25, data: 25, calls: 30, support: 5,  lifestyle: 15 },
    support:  { cost: 20, data: 20, calls: 10, support: 30, lifestyle: 20 },
    balanced: { cost: 35, data: 25, calls: 15, support: 10, lifestyle: 15 }
  };

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function yen(n) { return new Intl.NumberFormat('ja-JP').format(Math.round(n)) + '円'; }

  function effectivePrice(plan, answers) {
    let price = plan.price;
    if (answers && answers.home === 'softbank' && plan.brand === 'ymobile') price = Math.max(0, price - 1650);
    if (answers && answers.home === 'au' && plan.brand === 'uq' && plan.id.indexOf('uq-35') !== 0) price = Math.max(0, price - 1100);
    return price;
  }

  function costRatio(price) {
    if (price <= 1000) return 1;
    if (price <= 1500) return 0.92;
    if (price <= 2200) return 0.82;
    if (price <= 3000) return 0.72;
    if (price <= 4000) return 0.58;
    if (price <= 5000) return 0.42;
    return 0.25;
  }

  function dataRatio(plan, needed) {
    if (plan.unlimited) return 1;
    if (plan.dataGb >= needed) {
      const excess = plan.dataGb / Math.max(needed, 1);
      if (excess <= 1.2) return 1;
      if (excess <= 2) return 0.94;
      if (excess <= 4) return 0.86;
      return 0.78;
    }
    const coverage = plan.dataGb / Math.max(needed, 1);
    if (coverage >= 0.85) return 0.55;
    if (coverage >= 0.6) return 0.25;
    return 0;
  }

  function callRatio(plan, callPattern) {
    if (callPattern === 'none') return plan.price < 3500 ? 1 : 0.9;
    if (plan.calls === 'app-unlimited') return callPattern === 'long' ? 1 : 0.95;
    if (callPattern === 'short') return plan.callMinutes >= 5 ? 1 : 0.55;
    if (callPattern === 'medium') {
      if (plan.callMinutes >= 10) return 1;
      if (plan.calls === 'choice') return 0.88;
      if (plan.callMinutes >= 5) return 0.72;
      return 0.3;
    }
    if (callPattern === 'long') {
      if (plan.calls === 'choice') return 0.7;
      if (plan.callMinutes >= 10) return 0.6;
      if (plan.callMinutes >= 5) return 0.4;
      return 0.15;
    }
    return 0.5;
  }

  function supportRatio(brand, supportNeed, data) {
    const level = data.brands[brand].support;
    if (supportNeed === 'online') return clamp(1 - Math.max(level - 3, 0) * 0.03, 0.85, 1);
    if (supportNeed === 'some') return clamp(level / 4, 0.3, 1);
    return clamp(level / 5, 0.15, 1);
  }

  function networkRatio(brand, data) {
    const type = data.brands[brand].networkType;
    if (type === 'subbrand' || type === 'mno-online') return 1;
    if (type === 'mno') return 0.92;
    return 0.68;
  }

  function lifestyleRatio(plan, answers) {
    let points = 6;
    if (answers.lineHeavy === 'yes' && plan.brand === 'linemo') points += 5;
    if (answers.flexible === 'yes' && plan.brand === 'povo') points += 5;
    if (answers.flexible === 'no' && plan.brand === 'povo') points -= 4;
    if (answers.home === 'au' && plan.brand === 'uq') points += 5;
    if (answers.home === 'softbank' && plan.brand === 'ymobile') points += 7;
    if (answers.family !== 'one' && (plan.brand === 'uq' || plan.brand === 'ymobile')) points += 2;
    if (answers.priority === 'data' && (plan.unlimited || plan.dataGb >= 50)) points += 3;
    return clamp(points / 15, 0, 1);
  }

  function scorePlan(plan, answers, data) {
    const needed = DATA_USAGE[String(answers.data)] || Number(answers.data) || 10;
    const weights = WEIGHTS[answers.priority] || WEIGHTS.balanced;
    const ratios = {
      cost: costRatio(effectivePrice(plan, answers)),
      data: dataRatio(plan, needed),
      calls: callRatio(plan, answers.calls),
      support: supportRatio(plan.brand, answers.support, data),
      lifestyle: lifestyleRatio(plan, answers)
    };

    if (answers.priority === 'support') {
      ratios.lifestyle = (ratios.lifestyle + supportRatio(plan.brand, answers.support, data)) / 2;
    }
    if (answers.priority === 'data') {
      ratios.lifestyle = (ratios.lifestyle + networkRatio(plan.brand, data)) / 2;
    }

    const score = Object.keys(weights).reduce((sum, key) => sum + weights[key] * ratios[key], 0);
    return { plan: plan, score: Math.round(clamp(score, 0, 100)), ratios: ratios };
  }

  function reasonsFor(result, answers, data) {
    const plan = result.plan;
    const brand = data.brands[plan.brand];
    const reasons = [];
    const needed = DATA_USAGE[String(answers.data)] || Number(answers.data) || 10;

    if (plan.dataGb >= needed || plan.unlimited) reasons.push('普段のデータ利用量をカバーしやすい');
    if (plan.price <= 2200) reasons.push('月額料金を抑えやすい');
    if (answers.calls !== 'none' && (plan.callMinutes >= 5 || plan.calls === 'app-unlimited' || plan.calls === 'choice')) reasons.push('通話条件との相性が良い');
    if (answers.support === 'store' && brand.support >= 4) reasons.push('対面サポートを利用しやすい');
    if (answers.lineHeavy === 'yes' && plan.lineFree) reasons.push('対象のLINE利用がデータ消費対象外');
    if (answers.flexible === 'yes' && plan.flex >= 5) reasons.push('必要な分だけ追加する使い方に向く');
    if (answers.home === 'au' && plan.brand === 'uq') reasons.push('自宅セット割の対象になる可能性がある');
    if (answers.home === 'softbank' && plan.brand === 'ymobile') reasons.push('おうち割の対象になる可能性がある');
    if (!reasons.length) reasons.push('料金・容量・サポートの総合バランスが近い');
    return reasons.slice(0, 3);
  }

  function cautionsFor(result, answers, data) {
    const plan = result.plan;
    const brand = data.brands[plan.brand];
    const cautions = [];
    const needed = DATA_USAGE[String(answers.data)] || Number(answers.data) || 10;

    if (plan.dataGb < needed && !plan.unlimited) cautions.push('回答したデータ量より容量が少ないため、追加データ等の費用を要確認');
    if (brand.support <= 2 && answers.support !== 'online') cautions.push('オンライン中心のサポート。店頭対応を重視する場合は注意');
    if (plan.topping) cautions.push('トッピングの有効期間・継続利用条件を公式サイトで確認');
    if (plan.priceNote) cautions.push(plan.priceNote);
    if (plan.calls === 'app-unlimited') cautions.push('無料通話には専用アプリ利用や対象外番号などの条件あり');
    if (plan.callNote) cautions.push(plan.callNote);
    if (plan.brand === 'mineo' || plan.brand === 'nihontsushin') cautions.push('実効速度は時間帯・場所・混雑状況などで変動');
    if (brand.reviewBefore) cautions.push('2026年12月1日に月額基本料の改定予定。申込時の最新料金を確認');
    return cautions.slice(0, 3);
  }

  function diagnose(answers, data) {
    data = data || DATA;
    if (!data) throw new Error('LQV plan data is missing.');
    const scored = data.plans.map(p => scorePlan(p, answers, data));
    const bestByBrand = new Map();
    scored.forEach(r => {
      const old = bestByBrand.get(r.plan.brand);
      if (!old || r.score > old.score || (r.score === old.score && r.plan.price < old.plan.price)) bestByBrand.set(r.plan.brand, r);
    });
    return Array.from(bestByBrand.values())
      .sort((a, b) => b.score - a.score || a.plan.price - b.plan.price)
      .map(r => Object.assign({}, r, {
        brand: data.brands[r.plan.brand],
        reasons: reasonsFor(r, answers, data),
        cautions: cautionsFor(r, answers, data)
      }));
  }

  function track(name, params) {
    params = params || {};
    try {
      if (typeof window !== 'undefined' && typeof window.luqevoraTrack === 'function') {
        window.luqevoraTrack(name, params);
      } else if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', name, params);
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('luqevora:analytics', { detail: { name, params } }));
    } catch (_) {}
  }


  function normalizeCurrentCarrier(value) {
    const currentRaw = String(value || '').toLowerCase();
    const currentAliases = {
      docomo: 'docomo', ahamo: 'docomo', eximo: 'docomo', irumo: 'docomo',
      au: 'au', uq: 'au', uqmobile: 'au', 'uq-mobile': 'au', povo: 'au', 'povo2.0': 'au',
      softbank: 'softbank', ymobile: 'softbank', 'y-mobile': 'softbank', linemo: 'softbank',
      rakuten: 'rakuten', 'rakuten-mobile': 'rakuten',
      mineo: 'mvno', mvno: 'mvno', nihontsushin: 'mvno', 'japan-sim': 'mvno',
      other: 'other'
    };
    return currentAliases[currentRaw] || currentRaw;
  }

  function initBrowser() {
    if (typeof document === 'undefined' || !DATA) return;
    const app = document.querySelector('[data-lqv-plan-diagnosis]');
    if (!app) return;

    const form = app.querySelector('form');
    const steps = Array.from(app.querySelectorAll('[data-step]'));
    const progress = app.querySelector('[data-progress]');
    const progressText = app.querySelector('[data-progress-text]');
    const prevBtn = app.querySelector('[data-prev]');
    const nextBtn = app.querySelector('[data-next]');
    const results = app.querySelector('[data-results]');
    const restart = app.querySelector('[data-restart]');
    const currentBill = app.querySelector('#current-bill');
    let stepIndex = 0;
    let started = false;
    const viewedSteps = new Set();

    const params = new URLSearchParams(location.search);
    const currentRaw = (params.get('current') || '').toLowerCase();
    const currentPrefill = normalizeCurrentCarrier(currentRaw);
    if (currentPrefill) {
      const radio = form.querySelector('input[name="current"][value="' + CSS.escape(currentPrefill) + '"]');
      if (radio) radio.checked = true;
    }

    const source = params.get('utm_source') || params.get('src') || params.get('sq_source') || '';
    const bridge = params.get('sq_bridge') || '';
    if (source) {
      try { sessionStorage.setItem('lqv_diag_source', source.slice(0, 80)); } catch (_) {}
    }

    function showStep(index) {
      stepIndex = clamp(index, 0, steps.length - 1);
      steps.forEach((s, i) => { s.hidden = i !== stepIndex; });
      const pct = Math.round(((stepIndex + 1) / steps.length) * 100);
      progress.style.width = pct + '%';
      progressText.textContent = (stepIndex + 1) + ' / ' + steps.length;
      prevBtn.hidden = stepIndex === 0;
      nextBtn.textContent = stepIndex === steps.length - 1 ? '診断結果を見る' : '次へ';
      const first = steps[stepIndex].querySelector('input, button');
      if (first) first.focus({ preventScroll: true });
      if (!viewedSteps.has(stepIndex)) {
        viewedSteps.add(stepIndex);
        track('plan_diagnosis_step_view', { step: stepIndex + 1, total_steps: steps.length, source: source || 'direct', bridge: bridge || undefined });
      }
    }

    function currentStepValid() {
      const step = steps[stepIndex];
      const requiredNames = Array.from(new Set(Array.from(step.querySelectorAll('input[required]')).map(i => i.name)));
      for (const name of requiredNames) {
        if (!form.querySelector('input[name="' + CSS.escape(name) + '"]:checked')) return false;
      }
      return true;
    }

    function answersFromForm() {
      const fd = new FormData(form);
      return {
        current: fd.get('current') || 'other',
        data: fd.get('data') || '10',
        calls: fd.get('calls') || 'none',
        priority: fd.get('priority') || 'balanced',
        support: fd.get('support') || 'online',
        family: fd.get('family') || 'one',
        home: fd.get('home') || 'none',
        lineHeavy: fd.get('line-heavy') || 'no',
        flexible: fd.get('flexible') || 'no',
        device: fd.get('device') || 'keep',
        currentBill: Number(currentBill && currentBill.value) || 0
      };
    }

    function renderResultCard(result, rank, answers) {
      const p = result.plan;
      const b = result.brand;
      const application = b.application;
      const conditionalPrice = effectivePrice(p, answers);
      const hasConditionalDiscount = conditionalPrice < p.price;
      const savings = answers.currentBill > 0 ? Math.max(0, answers.currentBill - conditionalPrice) : 0;
      const affiliate = application.type === 'affiliate';
      const reasons = result.reasons.map(x => '<li>' + escapeHtml(x) + '</li>').join('');
      const cautions = result.cautions.map(x => '<li>' + escapeHtml(x) + '</li>').join('');
      const savingsHtml = savings > 0 ? '<p class="lqv-diag__savings">現在の入力額より月 <strong>' + yen(savings) + '</strong> 低い目安</p>' : '';
      const adLabel = affiliate ? '<span class="lqv-diag__ad-label">広告</span>' : '<span class="lqv-diag__official-label">公式</span>';
      const rel = affiliate ? 'nofollow sponsored noopener noreferrer' : 'noopener noreferrer';
      return '<article class="lqv-diag__result-card' + (rank === 1 ? ' is-first' : '') + '">' +
        '<div class="lqv-diag__rank">' + rank + '位</div>' +
        '<div class="lqv-diag__result-head"><div><h3>' + escapeHtml(b.name) + '</h3><p>' + escapeHtml(p.plan) + '</p></div><div class="lqv-diag__score"><strong>' + result.score + '</strong><span>/100</span></div></div>' +
        '<div class="lqv-diag__price"><strong>' + yen(p.price) + '</strong><span> / 月</span><small>端末代・通話超過・オプション・一時的キャンペーン等を除く</small>' + (hasConditionalDiscount ? '<small class="lqv-diag__conditional-price">回答した自宅回線条件が対象なら参考 ' + yen(conditionalPrice) + ' / 月。適用条件は公式で要確認。</small>' : '') + '</div>' +
        savingsHtml +
        '<div class="lqv-diag__result-grid"><div><h4>合いやすい理由</h4><ul>' + reasons + '</ul></div><div><h4>確認したい点</h4><ul>' + (cautions || '<li>契約前に最新条件・対応端末を公式で確認</li>') + '</ul></div></div>' +
        '<a class="lqv-diag__cta" href="' + escapeAttr(application.url) + '" target="_blank" rel="' + rel + '" data-result-cta data-brand="' + escapeAttr(p.brand) + '" data-route="' + escapeAttr(application.type) + '">' + adLabel + '<span>' + escapeHtml(application.label) + '</span></a>' +
        '</article>';
    }

    function renderResults() {
      const answers = answersFromForm();
      const list = diagnose(answers, DATA).slice(0, 3);
      form.hidden = true;
      results.hidden = false;
      results.querySelector('[data-results-cards]').innerHTML = list.map((r, i) => renderResultCard(r, i + 1, answers)).join('');
      const deviceOffer = results.querySelector('[data-device-offer]');
      if (deviceOffer) {
        if (answers.device === 'used' || answers.device === 'undecided') {
          deviceOffer.hidden = false;
          deviceOffer.innerHTML = '<strong>端末も見直すなら</strong><p>中古スマホを含めると総額を下げられる場合があります。購入前に保証・状態・バッテリー条件も確認してください。</p><a href="https://h.accesstrade.net/sp/cc?rk=0100q4ax00ox0v" target="_blank" rel="nofollow sponsored noopener noreferrer" data-device-cta>広告｜ダイワンテレコムの中古スマホを見る</a>';
        } else {
          deviceOffer.hidden = true;
          deviceOffer.innerHTML = '';
        }
      }
      const sourceEl = results.querySelector('[data-source-note]');
      const savedSource = (() => { try { return sessionStorage.getItem('lqv_diag_source') || ''; } catch (_) { return ''; } })();
      sourceEl.textContent = savedSource === 'solqvia' ? 'SolQviaからの診断条件を引き継いでいます。' : '';
      track('plan_diagnosis_complete', { top_brand: list[0] && list[0].plan.brand, source: savedSource || 'direct', bridge: bridge || undefined });
      track('plan_diagnosis_result_view', { top_score: list[0] && list[0].score });
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function escapeHtml(v) { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
    function escapeAttr(v) { return escapeHtml(v); }

    nextBtn.addEventListener('click', function () {
      if (!started) { started = true; track('plan_diagnosis_start', { source: source || 'direct', bridge: bridge || undefined, current: currentRaw || 'unknown' }); }
      if (!currentStepValid()) {
        const err = steps[stepIndex].querySelector('[data-error]');
        if (err) { err.hidden = false; err.focus(); }
        track('plan_diagnosis_validation_error', { step: stepIndex + 1, source: source || 'direct' });
        return;
      }
      const err = steps[stepIndex].querySelector('[data-error]');
      if (err) err.hidden = true;
      if (stepIndex === steps.length - 1) renderResults();
      else showStep(stepIndex + 1);
    });

    prevBtn.addEventListener('click', function () { showStep(stepIndex - 1); });
    restart.addEventListener('click', function () {
      results.hidden = true;
      form.hidden = false;
      form.reset();
      if (currentPrefill) {
        const radio = form.querySelector('input[name="current"][value="' + CSS.escape(currentPrefill) + '"]');
        if (radio) radio.checked = true;
      }
      showStep(0);
      track('plan_diagnosis_restart');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    results.addEventListener('click', function (e) {
      const device = e.target.closest('[data-device-cta]');
      if (device) { track('plan_diagnosis_cta_click', { brand: 'daiwan-used', route: 'affiliate-device' }); return; }
      const a = e.target.closest('[data-result-cta]');
      if (!a) return;
      track('plan_diagnosis_cta_click', { brand: a.dataset.brand, route: a.dataset.route });
    });

    showStep(0);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBrowser);
    else initBrowser();
  }

  return { diagnose, scorePlan, reasonsFor, cautionsFor, effectivePrice, yen, normalizeCurrentCarrier };
});
