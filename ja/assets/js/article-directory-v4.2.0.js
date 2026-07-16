(() => {
  'use strict';
  const list = document.querySelector('[data-article-list]');
  if (!list) return;
  const cards = [...list.querySelectorAll('.article-directory-card')];
  const search = document.querySelector('[data-article-search]');
  const category = document.querySelector('[data-article-category]');
  const type = document.querySelector('[data-article-type]');
  const count = document.querySelector('[data-article-count]');
  const empty = document.querySelector('[data-article-empty]');
  const reset = document.querySelector('[data-article-reset]');
  const params = new URLSearchParams(location.search);
  if (params.get('category') && category?.querySelector(`option[value="${CSS.escape(params.get('category'))}"]`)) category.value = params.get('category');
  if (params.get('type') && type?.querySelector(`option[value="${CSS.escape(params.get('type'))}"]`)) type.value = params.get('type');
  const topic = params.get('topic') || '';
  let timer;
  function apply(track = false) {
    const q = (search?.value || '').trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const match = (!q || card.dataset.search.includes(q)) && (!category?.value || card.dataset.category === category.value) && (!type?.value || card.dataset.type === type.value) && (!topic || card.dataset.topic === topic);
      card.hidden = !match; if (match) visible += 1;
    });
    if (count) count.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
    if (track && window.LuqevoraAnalytics?.track) window.LuqevoraAnalytics.track('article_filter', { search_used: Boolean(q), category_filter: category?.value || '', type_filter: type?.value || '', result_count: visible });
  }
  search?.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => apply(true), 450); });
  category?.addEventListener('change', () => apply(true)); type?.addEventListener('change', () => apply(true));
  reset?.addEventListener('click', () => { if (search) search.value=''; if (category) category.value=''; if (type) type.value=''; history.replaceState(null,'',location.pathname); apply(true); search?.focus(); });
  apply(false);
})();
