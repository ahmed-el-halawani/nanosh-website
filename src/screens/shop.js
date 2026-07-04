import { getProducts } from '../api.js';
import { addConfigured } from '../store.js';
import { fmt, waLink, ACCENT } from '../config.js';
import { openProduct } from './product.js';
import { openOptions } from './options.js';
import { logoBox } from './logo.js';
import { isDesktop } from '../responsive.js';

// ponytail: native aspect-ratio replaces fixed height; portrait 3/4 so height > width on all breakpoints
const img = (src, alt) =>
  `<img src="${src}" alt="${alt}" loading="lazy" style="width:100%; aspect-ratio:3/4; object-fit:cover; display:block; background:#f3ede2;">`;

function card(p) {
  const sale = p.on_sale && p.old_price
    ? `<span style="position:absolute; top:8px; right:8px; background:${ACCENT}; color:#fff; font-size:11px; font-weight:700; padding:3px 8px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,.12);">خصم</span>` : '';
  const old = p.on_sale && p.old_price
    ? `<span style="font-size:11px; color:#b6ab9a; text-decoration:line-through;">${fmt(p.old_price)}</span>` : '';
  return `<div data-open="${p.id}" style="background:#fff; border-radius:18px; overflow:hidden; border:1px solid #f0e8db; box-shadow:0 2px 8px rgba(60,40,20,.05); cursor:pointer; animation:nn-rise .4s ease both;">
    <div style="position:relative;">${img(p.images[0] || '', p.name_ar)}${sale}</div>
    <div style="padding:9px 10px 11px;">
      <div style="font-size:13.5px; font-weight:500; line-height:1.35; height:37px; overflow:hidden; color:#2c3f3b;">${p.name_ar}</div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-top:7px;">
        <div style="display:flex; align-items:baseline; gap:5px;">
          <span style="font-size:16px; font-weight:800; color:#1B695E;">${fmt(p.price_egp)}</span>${old}
        </div>
        <button data-add="${p.id}" style="width:32px; height:32px; border-radius:10px; background:#1B695E; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

export default async function shop(root, ctx) {
  if (!ctx.products) ctx.products = await getProducts();
  const products = ctx.products;
  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const genders = ['الكل', ...new Set(products.map((p) => p.gender).filter(Boolean))];
  const typesFor = (g) => ['الكل', ...new Set(products.filter((p) => g === 'الكل' || p.gender === g).map((p) => p.type).filter(Boolean))];
  let gender = 'الكل', type = 'الكل', q = ctx.searchQuery || '';

  root.innerHTML = `
  <div class="nn-page" style="height:100%; display:flex; flex-direction:column; background:#FBF6EE;">
    <div class="nn-pagehead nn-shop-head" style="padding:max(14px, env(safe-area-inset-top)) 16px 10px; background:#FBF6EE; position:relative; z-index:5;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="nn-hide-desktop" style="display:contents">${logoBox(46, 13)}</span>
        <div style="position:relative; flex:1;">
          <div style="display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #ece2d3; border-radius:14px; padding:11px 14px;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9a8f80" stroke-width="2"/><path d="m20 20-3-3" stroke="#9a8f80" stroke-width="2" stroke-linecap="round"/></svg>
            <input id="q" autocomplete="off" placeholder="ابحثي عن قطعة كروشيه…" style="flex:1; border:none; outline:none; background:none; font-size:14px; color:#2c3f3b;">
          </div>
          <div id="q-dropdown" class="nn-search-dropdown" style="display:none; position:absolute; top:calc(100% + 6px); left:0; right:0; max-height:240px; overflow-y:auto; background:#fff; border:1px solid #ece2d3; border-radius:12px; box-shadow:0 8px 24px rgba(60,40,20,.12); z-index:50;"></div>
        </div>
      </div>
    </div>
    <div class="nn-scroll nn-catbar" style="display:flex; align-items:center; gap:8px; padding:4px 16px 12px; overflow-x:auto; flex-shrink:0;">
      <div id="cats" style="display:flex; gap:8px; flex-shrink:0;"></div>
      <span id="fdiv" style="width:1.5px; height:22px; background:#d9cdb9; border-radius:2px; flex-shrink:0; margin:0 3px;"></span>
      <div id="subcats" style="display:flex; gap:7px; flex-shrink:0;"></div>
    </div>
    <div class="nn-scroll nn-body" style="flex:1; overflow-y:auto; padding:0 12px 120px;">
      <div id="grid" class="nn-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;"></div>
      <div id="empty" style="display:none; text-align:center; padding:60px 20px; color:#a99e8e; font-size:14px;">لا توجد نتائج مطابقة</div>
    </div>
    <a id="wa" class="nn-fab" target="_blank" style="position:absolute; bottom:104px; left:18px; z-index:20; width:56px; height:56px; border-radius:18px; background:#25D366; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(37,211,102,.42); text-decoration:none; animation:nn-pop .3s ease both;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" style="display:block;"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.42 1.27 4.86L2 22l5.28-1.24A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.13c-1.55 0-3-.44-4.23-1.2l-.3-.18-3.13.74.74-3.05-.2-.31A8.09 8.09 0 0 1 3.87 12 8.14 8.14 0 0 1 12 3.87 8.14 8.14 0 0 1 20.13 12 8.14 8.14 0 0 1 12 20.13Zm4.5-5.73c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z"/></svg>
    </a>
  </div>`;

  root.querySelector('#wa').href = waLink('مرحبًا نانوش، أود الاستفسار عن قطع الكروشيه 🌿');

  const grid = root.querySelector('#grid');
  const empty = root.querySelector('#empty');
  const catsEl = root.querySelector('#cats');
  const subEl = root.querySelector('#subcats');
  const divEl = root.querySelector('#fdiv');

  // main filter = gender (filled), sub filter = type (outline)
  const chipStyle = (on) => `flex-shrink:0; padding:8px 16px; border-radius:20px; border:1px solid ${on ? '#1B695E' : '#e7ddce'}; background:${on ? '#1B695E' : '#fff'}; color:${on ? '#fff' : '#6a6155'}; font-size:13px; font-weight:700; cursor:pointer;`;
  const subChipStyle = (on) => `flex-shrink:0; padding:6px 13px; border-radius:16px; border:1px solid ${on ? '#1B695E' : '#e7ddce'}; background:${on ? '#e8f0ec' : 'transparent'}; color:${on ? '#1B695E' : '#8a7f6f'}; font-size:12px; font-weight:700; cursor:pointer;`;

  function renderGenders() {
    catsEl.innerHTML = genders.map((g) => `<button data-g="${g}" style="${chipStyle(g === gender)}">${g}</button>`).join('');
    catsEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      gender = b.dataset.g; type = 'الكل'; renderGenders(); renderSub(); renderGrid();
    }));
  }
  function renderSub() {
    const types = typesFor(gender);
    const show = types.length > 1;                  // hide sub group + divider when no sub-choices
    subEl.style.display = show ? 'flex' : 'none';
    divEl.style.display = show ? 'block' : 'none';
    subEl.innerHTML = types.map((t) => `<button data-t="${t}" style="${subChipStyle(t === type)}">${t}</button>`).join('');
    subEl.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      type = b.dataset.t; renderSub(); renderGrid();
    }));
  }
  function filtered() {
    return products.filter((p) =>
      (gender === 'الكل' || p.gender === gender) &&
      (type === 'الكل' || p.type === type) &&
      (!q || p.name_ar.includes(q) || (p.name_en || '').toLowerCase().includes(q.toLowerCase())));
  }
  function renderGrid() {
    const list = filtered();
    empty.style.display = list.length ? 'none' : 'block';
    grid.innerHTML = list.map(card).join('');
    grid.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('click', (e) => {
      if (e.target.closest('[data-add]')) return;
      const p = byId[el.dataset.open];
      if (isDesktop()) ctx.navigate('#/product/' + p.id);   // full page on desktop
      else openProduct(root, p);                             // bottom sheet on mobile
    }));
    grid.querySelectorAll('[data-add]').forEach((el) => el.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = byId[el.dataset.add];
      openOptions(root,
        { name: p.name_ar, image: (p.images || [])[0] || '', price: p.price_egp },
        { size: '', note: '', qty: 1 },
        (opts) => addConfigured(p, opts),
        'أضيفي إلى السلة');
    }));
  }

  const qInput = root.querySelector('#q');
  const qDropdown = root.querySelector('#q-dropdown');
  const closeQDropdown = () => { qDropdown.style.display = 'none'; };
  const renderQDropdown = (list) => {
    if (!list.length) { closeQDropdown(); return; }
    qDropdown.innerHTML = list.map((p) => `<div class="nn-search-item" data-name="${p.name_ar}">${p.name_ar}</div>`).join('');
    qDropdown.style.display = 'block';
  };

  qInput.value = q;
  qInput.addEventListener('input', (e) => {
    q = e.target.value;
    renderGrid();
    if (!q) closeQDropdown();
    else renderQDropdown(products.filter((p) => p.name_ar.includes(q)).slice(0, 8));
  });
  qInput.addEventListener('keydown', (e) => {
    if (qDropdown.style.display === 'none') return;
    const active = qDropdown.querySelector('.nn-search-item.on');
    let next = null;
    if (e.key === 'ArrowDown') { e.preventDefault(); next = active ? active.nextElementSibling : qDropdown.firstElementChild; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); next = active ? active.previousElementSibling : qDropdown.lastElementChild; }
    else if (e.key === 'Enter') { e.preventDefault(); active ? active.click() : closeQDropdown(); }
    else if (e.key === 'Escape') { closeQDropdown(); }
    if (next) { active?.classList.remove('on'); next.classList.add('on'); }
  });
  qDropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.nn-search-item');
    if (!item) return;
    q = item.dataset.name;
    qInput.value = q;
    renderGrid();
    closeQDropdown();
  });
  root.addEventListener('click', (e) => { if (!qInput.contains(e.target) && !qDropdown.contains(e.target)) closeQDropdown(); });
  window.addEventListener('nanosh-search', (e) => { q = e.detail || ''; qInput.value = q; renderGrid(); closeQDropdown(); });
  renderGenders();
  renderSub();
  renderGrid();
  ctx.searchQuery = ''; // ponytail: consumed; don't leak into next shop visit
}
