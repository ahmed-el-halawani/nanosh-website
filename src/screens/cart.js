import { getCart, setQty, updateItem, removeItem, clearCart, cartTotal, cartCount } from '../store.js';
import { createOrder } from '../api.js';
import { fmt } from '../config.js';
import { openOptions } from './options.js';
import { backBtn } from '../ui.js';

function itemRow(c) {
  const sizeChip = c.size
    ? `<span style="font-size:11.5px; color:#5a5245; background:#f6f0e6; border:1px solid #eadfce; padding:3px 10px; border-radius:20px;">مقاس ${c.size}</span>` : '';
  return `<div style="display:flex; gap:11px; background:#fff; border:1px solid #f0e8db; border-radius:18px; padding:11px; margin-bottom:12px; box-shadow:0 2px 8px rgba(60,40,20,.05); animation:nn-rise .35s ease both;">
    <img src="${c.image}" alt="${c.name}" style="width:70px; height:70px; border-radius:12px; object-fit:cover; background:#f3ede2; flex-shrink:0;">
    <div style="flex:1; min-width:0;">
      <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
        <div style="font-size:14px; font-weight:600; color:#2c3f3b; line-height:1.35;">${c.name}</div>
        <button data-remove="${c.id}" style="background:none; border:none; cursor:pointer; padding:2px; flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5h6v2m-8 0 1 12h8l1-12" stroke="#c0a999" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
        ${sizeChip}
        <button data-edit="${c.id}" style="font-size:11.5px; color:#1B695E; background:#e8f0ec; border:1px solid #d5e5df; padding:3px 10px; border-radius:20px; cursor:pointer; font-weight:700;">تعديل الخيارات</button>
      </div>
      <div style="display:flex; align-items:flex-start; gap:6px; margin-top:7px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0; margin-top:6px;"><path d="M4 7h16M4 12h16M4 17h10" stroke="#b6ab9a" stroke-width="1.8" stroke-linecap="round"/></svg>
        <input data-note="${c.id}" value="${c.note || ''}" placeholder="ملاحظة لهذه القطعة (لون، تفاصيل…)" style="flex:1; min-width:0; height:34px; border-radius:10px; border:1px solid #ece2d3; background:#fdfaf4; padding:0 10px; font-size:12px; color:#5a5245;"/>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-top:9px;">
        <span style="font-size:15px; font-weight:800; color:#1B695E;">${fmt(c.price * c.qty)}</span>
        <div style="display:flex; align-items:center; gap:12px; background:#f6f0e6; border-radius:11px; padding:4px 6px;">
          <button data-minus="${c.id}" style="width:26px; height:26px; border-radius:8px; background:#fff; border:1px solid #e7ddce; display:flex; align-items:center; justify-content:center; cursor:pointer;"><svg width="13" height="13" viewBox="0 0 24 24"><path d="M5 12h14" stroke="#1B695E" stroke-width="2.6" stroke-linecap="round"/></svg></button>
          <span style="font-size:14px; font-weight:700; min-width:16px; text-align:center;">${c.qty}</span>
          <button data-plus="${c.id}" style="width:26px; height:26px; border-radius:8px; background:#fff; border:1px solid #e7ddce; display:flex; align-items:center; justify-content:center; cursor:pointer;"><svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#1B695E" stroke-width="2.6" stroke-linecap="round"/></svg></button>
        </div>
      </div>
    </div>
  </div>`;
}

export default async function cart(root, ctx) {
  const confirmBtnHtml = (cls) => `<button data-confirm class="${cls}" style="width:100%; height:52px; border-radius:15px; background:#1B695E; color:#fff; border:none; font-size:16px; font-weight:700; cursor:pointer; box-shadow:0 6px 16px rgba(27,105,94,.3); display:flex; align-items:center; justify-content:center; gap:8px;">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="display:block;"><path d="m5 12 5 5 9-11" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span data-confirm-label>تأكيد وإرسال الطلب</span>
  </button>`;

  const summaryHtml = () => `
    <div style="background:#fff; border:1px solid #f0e8db; border-radius:18px; padding:14px 16px;">
      <div style="display:flex; justify-content:space-between; font-size:14px; color:#5a5245;"><span>عدد القطع</span><span style="font-weight:600;">${cartCount()}</span></div>
      <div style="display:flex; justify-content:space-between; margin-top:9px; padding-top:11px; border-top:1px dashed #eadfce;"><span style="font-size:15px; font-weight:700; color:#243b37;">الإجمالي التقريبي</span><span style="font-size:18px; font-weight:800; color:#1B695E;">${fmt(cartTotal())}</span></div>
    </div>
    <div style="display:flex; gap:8px; align-items:flex-start; background:#e8f0ec; border:1px solid #d5e5df; border-radius:14px; padding:11px 13px; margin-top:12px;">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="9" stroke="#1B695E" stroke-width="1.7"/><path d="M12 8h.01M11 12h1v4h1" stroke="#1B695E" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span style="font-size:12.5px; color:#356057; line-height:1.55;">الأسعار تقديرية — بعد تأكيد الطلب نتواصل معك لتحديد المقاسات والألوان وموعد التسليم.</span>
    </div>
    <div class="nn-desktop-only" style="margin-top:14px;">${confirmBtnHtml('')}</div>`;

  const render = () => {
    const items = getCart();
    const has = items.length > 0;
    root.innerHTML = `
    <div class="nn-page" style="height:100%; display:flex; flex-direction:column; background:#FBF6EE;">
      <div class="nn-pagehead" style="padding:max(14px, env(safe-area-inset-top)) 16px 14px; display:flex; align-items:center; gap:12px;">
        ${backBtn}
        <div>
          <div style="font-size:20px; font-weight:800; color:#243b37;">سلة الطلب</div>
          <div style="font-size:12.5px; color:#8a7f6f; margin-top:2px;">راجعي قطعك قبل تأكيد الحجز</div>
        </div>
      </div>
      <div class="nn-scroll nn-body" style="flex:1; overflow-y:auto; padding:2px 16px 20px;">
        ${has ? `<div class="nn-cart-wrap">
          <div class="nn-cart-main">${items.map(itemRow).join('')}</div>
          <div class="nn-cart-aside">${summaryHtml()}</div>
        </div>`
        : `<div style="text-align:center; padding:70px 30px; color:#a99e8e;">
            <div style="font-size:15px; font-weight:700; color:#8a7f6f;">سلتك فارغة</div>
            <div style="font-size:13.5px; margin-top:6px; line-height:1.6;">أضيفي قطعك المفضلة ثم أكّدي الطلب من هنا.</div>
            <button data-shop style="margin-top:18px; height:46px; padding:0 26px; border-radius:14px; background:#1B695E; color:#fff; border:none; font-size:15px; font-weight:700; cursor:pointer;">تصفّح المتجر</button>
          </div>`}
      </div>
      ${has ? `<div class="nn-hide-desktop" style="padding:12px 16px calc(96px + env(safe-area-inset-bottom)); border-top:1px solid #efe6d8; background:#FBF6EE;">
        ${confirmBtnHtml('')}
      </div>` : ''}
    </div>`;

    root.querySelector('[data-shop]')?.addEventListener('click', () => ctx.navigate('#/shop'));
    root.querySelectorAll('[data-plus]').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.plus; setQty(id, (getCart().find((i) => i.id === id).qty) + 1); render(); }));
    root.querySelectorAll('[data-minus]').forEach((b) => b.addEventListener('click', () => { const id = b.dataset.minus; setQty(id, (getCart().find((i) => i.id === id).qty) - 1); render(); }));
    root.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => { removeItem(b.dataset.remove); render(); }));
    root.querySelectorAll('[data-note]').forEach((inp) => inp.addEventListener('change', () => updateItem(inp.dataset.note, { note: inp.value })));
    root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
      const c = getCart().find((i) => i.id === b.dataset.edit);
      openOptions(root,
        { name: c.name, image: c.image, price: c.price },
        { size: c.size, note: c.note, qty: c.qty },
        (opts) => { updateItem(c.id, { size: opts.size, note: opts.note }); setQty(c.id, opts.qty); render(); },
        'حفظ الخيارات');
    }));

    root.querySelectorAll('[data-confirm]').forEach((btn) => btn.addEventListener('click', async () => {
      if (!ctx.user) { ctx.navigate('#/account'); return; }
      const all = [...root.querySelectorAll('[data-confirm]')];
      const label = btn.querySelector('[data-confirm-label]');
      all.forEach((b) => (b.disabled = true));
      label.textContent = 'جارٍ الإرسال…';
      try {
        const order = await createOrder(ctx.user.id, getCart());
        clearCart();
        ctx.navigate('#/order/' + order.id);
      } catch (e) {
        all.forEach((b) => (b.disabled = false));
        label.textContent = 'تعذّر الإرسال — حاولي مجددًا';
        console.error(e);
      }
    }));
  };
  render();
}
