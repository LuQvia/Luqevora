(() => {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;
  const search = document.querySelector('[data-product-search]');
  const category = document.querySelector('[data-product-category]');
  const pricing = document.querySelector('[data-product-pricing]');
  const reset = document.querySelector('[data-product-reset]');
  const count = document.querySelector('[data-product-count]');
  const empty = document.querySelector('[data-product-empty]');
  const cards = [...grid.querySelectorAll('[data-product-card]')];
  const normalize = value => String(value || '').toLocaleLowerCase().normalize('NFKC');
  function apply() {
    const q = normalize(search?.value);
    const c = category?.value || '';
    const p = pricing?.value || '';
    let visible = 0;
    for (const card of cards) {
      const match = (!q || normalize(card.dataset.search).includes(q)) && (!c || card.dataset.category === c) && (!p || card.dataset.pricing === p);
      card.hidden = !match;
      if (match) visible += 1;
    }
    if (count) count.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
  }
  [search, category, pricing].forEach(control => control?.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', apply));
  reset?.addEventListener('click', () => { if (search) search.value = ''; if (category) category.value = ''; if (pricing) pricing.value = ''; apply(); search?.focus(); });
  apply();
})();
