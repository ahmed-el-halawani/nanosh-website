import { getMyOrders } from '../api.js';
import { fmt, waLink, STATUS_LABEL, statusStyle } from '../config.js';
import { stepsHtml, orderProgress } from './steps.js';
import { loginPrompt } from './account.js';
import { backBtn } from '../ui.js';

export default async function orders(root, ctx) {
  if (!ctx.user) { loginPrompt(root, ctx, 'سجّلي الدخول لعرض ومتابعة طلباتك.'); return; }

  root.innerHTML = `<div style="padding:80px 24px; text-align:center; color:#a99e8e;">جارٍ التحميل…</div>`;
  const list = await getMyOrders();

  const dateFmt = (iso) => new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });

  const cards = list.map((o) => {
    const thumbs = (o.order_items || []).slice(0, 4).map((it) => {
      const src = it.products?.images?.[0];
      return src
        ? `<img src="${src}" alt="${it.name}" style="width:52px; height:52px; border-radius:10px; object-fit:cover; background:#f3ede2; flex-shrink:0;">`
        : `<div style="width:52px; height:52px; border-radius:10px; background:#f3ede2; flex-shrink:0;"></div>`;
    }).join('');
    const count = (o.order_items || []).reduce((n, i) => n + i.qty, 0);
    const progress = orderProgress(o);
    return `<div style="background:#fff; border:1px solid #f0e8db; border-radius:20px; padding:16px; margin-bottom:14px; box-shadow:0 2px 8px rgba(60,40,20,.05); animation:nn-rise .4s ease both;">
      <div data-detail="${o.id}" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
        <div>
          <div style="font-size:14.5px; font-weight:800; color:#243b37;">طلب #${o.id}</div>
          <div style="font-size:12px; color:#a99e8e; margin-top:1px;">${dateFmt(o.created_at)} · ${count} قطعة</div>
        </div>
        <div style="font-size:12px; font-weight:700; color:${statusStyle(progress.currentKey).color}; background:${statusStyle(progress.currentKey).bg}; padding:5px 11px; border-radius:11px;">${progress.label}</div>
      </div>
      <div class="nn-scroll" style="display:flex; gap:7px; overflow-x:auto; margin:13px 0 3px;">${thumbs}</div>
      <div style="margin-top:12px; padding-top:6px; border-top:1px solid #f3ece0;">${stepsHtml(o)}</div>
      <div style="display:flex; gap:8px; margin-top:6px;">
        <button data-detail="${o.id}" style="flex:1; height:44px; border-radius:13px; background:#fff; border:1px solid #dbe7e2; color:#1B695E; font-size:13.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
          تفاصيل الطلب
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="m14 6-6 6 6 6" stroke="#1B695E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <a href="${waLink('استفسار عن الطلب رقم #' + o.id)}" target="_blank" style="flex:1; height:44px; border-radius:13px; background:#25D366; color:#fff; text-decoration:none; font-size:13.5px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:7px;">
          متابعة عبر واتساب
        </a>
      </div>
    </div>`;
  }).join('');

  root.innerHTML = `
  <div class="nn-page" style="height:100%; display:flex; flex-direction:column; background:#FBF6EE;">
    <div class="nn-pagehead" style="padding:max(14px, env(safe-area-inset-top)) 16px 14px; display:flex; align-items:center; gap:12px;">
      ${backBtn}
      <div>
        <div style="font-size:20px; font-weight:800; color:#243b37;">طلباتي</div>
        <div style="font-size:12.5px; color:#8a7f6f; margin-top:2px;">تتبعي مراحل تنفيذ الحجز</div>
      </div>
    </div>
    <div class="nn-scroll nn-body nn-narrow" style="flex:1; overflow-y:auto; padding:4px 16px 110px;">
      ${list.length ? cards : `<div style="text-align:center; padding:70px 30px; color:#a99e8e;">
        <div style="font-size:15px; font-weight:700; color:#8a7f6f;">لا توجد طلبات بعد</div>
        <div style="font-size:13.5px; margin-top:6px; line-height:1.6;">أضيفي قطعك إلى السلة ثم أكّدي الطلب لتتبّعه هنا.</div>
        <button data-shop style="margin-top:18px; height:46px; padding:0 26px; border-radius:14px; background:#1B695E; color:#fff; border:none; font-size:15px; font-weight:700; cursor:pointer;">تصفّح المتجر</button>
      </div>`}
    </div>
  </div>`;

  root.querySelector('[data-shop]')?.addEventListener('click', () => ctx.navigate('#/shop'));
  root.querySelectorAll('[data-detail]').forEach((b) => b.addEventListener('click', () => ctx.navigate('#/order/' + b.dataset.detail)));
}
