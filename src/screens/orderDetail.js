import { getOrder } from '../api.js';
import { fmt, waLink, STATUS_LABEL, statusStyle } from '../config.js';
import { stepsHtml, orderProgress, itemProgress } from './steps.js';

export default async function orderDetail(root, ctx, id) {
  if (!ctx.user) { ctx.navigate('#/account'); return; }
  root.innerHTML = `<div style="padding:80px 24px; text-align:center; color:#a99e8e;">جارٍ التحميل…</div>`;

  let o;
  try { o = await getOrder(id); }
  catch { root.innerHTML = `<div style="padding:80px 24px; text-align:center; color:#8a7f6f;">تعذّر العثور على الطلب. <a href="#/orders" style="color:#1B695E;">العودة لطلباتي</a></div>`; return; }

  const dateFmt = new Date(o.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  const count = (o.order_items || []).reduce((n, i) => n + i.qty, 0);
  const progress = orderProgress(o);

  const items = (o.order_items || []).map((it) => {
    const src = it.products?.images?.[0];
    const ip = itemProgress(it);
    const ipStyle = statusStyle(ip.currentKey);
    return `<div style="background:#fff; border:1px solid #f0e8db; border-radius:18px; padding:14px; margin-bottom:12px;" data-item-card>
      <div style="display:flex; gap:13px;">
        ${src
          ? `<img src="${src}" alt="${it.name}" style="width:80px; height:80px; border-radius:15px; object-fit:cover; background:#f3ede2; flex-shrink:0;">`
          : `<div style="width:80px; height:80px; border-radius:15px; background:#f3ede2; flex-shrink:0;"></div>`}
        <div style="flex:1; min-width:0;">
          <div style="font-size:16px; font-weight:800; color:#243b37; line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${it.name}</div>
          <div style="font-size:15px; font-weight:800; color:#1B695E; margin-top:5px;">${fmt(it.price * it.qty)}</div>

          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:11px;">
            ${it.size ? `<span style="font-size:14px; font-weight:800; color:#5a5245; background:#f3ede2; padding:6px 12px; border-radius:10px;">المقاس: ${esc(it.size)}</span>` : ''}
            <span style="font-size:14px; font-weight:800; color:#243b37; background:#e8f0ec; padding:6px 12px; border-radius:10px;">الكمية: ${it.qty}</span>
          </div>
        </div>
      </div>

      <div style="margin-top:13px; padding-top:12px; border-top:1px solid #f7f2e9; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span style="font-size:13px; font-weight:800; color:${ipStyle.color}; background:${ipStyle.bg}; padding:6px 13px; border-radius:10px;">${ip.currentLabel}</span>
        <span style="font-size:13px; font-weight:700; color:#8a7f6f;">${ip.done} من ${ip.total} خطوات</span>
      </div>

      ${it.note ? `<div style="margin-top:12px; background:#FBF6EE; border:1px solid #efe6d8; border-radius:12px; padding:11px 13px;">
        <div style="font-size:12px; font-weight:800; color:#8a7f6f; margin-bottom:4px;">ملاحظة</div>
        <div style="font-size:14px; font-weight:600; color:#5a5245; line-height:1.6;">${esc(it.note)}</div>
      </div>` : ''}
    </div>`;
  }).join('');

  // ponytail: one helper so mobile + desktop WhatsApp CTAs stay identical
  const waBtnHtml = () => `<a href="${waLink('متابعة الطلب رقم #' + o.id)}" target="_blank" style="width:100%; height:52px; border-radius:15px; background:#25D366; color:#fff; text-decoration:none; font-size:16px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:9px;">
    متابعة الطلب عبر واتساب
  </a>`;

  root.innerHTML = `
  <div class="nn-page" style="height:100%; display:flex; flex-direction:column; background:#FBF6EE;">
    <div class="nn-pagehead" style="padding:max(14px, env(safe-area-inset-top)) 16px 14px; display:flex; align-items:center; gap:12px;">
      <button data-back style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #ece2d3; display:flex; align-items:center; justify-content:center; cursor:pointer;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="#1B695E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div style="flex:1;">
        <div style="font-size:19px; font-weight:800; color:#243b37;">طلب #${o.id}</div>
        <div style="font-size:12.5px; color:#8a7f6f; margin-top:1px;">${dateFmt} · ${count} قطعة</div>
      </div>
      <div style="font-size:12px; font-weight:700; color:${statusStyle(progress.currentKey).color}; background:${statusStyle(progress.currentKey).bg}; padding:6px 12px; border-radius:11px;">${progress.label}</div>
    </div>
    <div class="nn-scroll nn-body" style="flex:1; overflow-y:auto; padding:4px 16px 120px;">
      <div class="nn-order-wrap">
        <div class="nn-order-main">
          <div style="font-size:13.5px; font-weight:700; color:#3a4a45; margin:4px 0 10px;">القطع</div>
          ${items}
          <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid #f0e8db; border-radius:16px; padding:13px 16px; margin:6px 0 20px;">
            <span style="font-size:15px; font-weight:700; color:#243b37;">الإجمالي التقريبي</span>
            <span style="font-size:18px; font-weight:800; color:#1B695E;">${fmt(o.total_estimate)}</span>
          </div>
        </div>
        <div class="nn-order-aside">
          <div style="font-size:13.5px; font-weight:700; color:#3a4a45; margin:4px 0 12px;">مراحل التنفيذ</div>
          <div style="background:#fff; border:1px solid #f0e8db; border-radius:18px; padding:16px 16px 4px;">${stepsHtml(o, true)}</div>
          <div class="nn-desktop-only" style="margin-top:14px;">${waBtnHtml()}</div>
        </div>
      </div>
    </div>
    <div class="nn-hide-desktop" style="padding:12px 16px calc(20px + env(safe-area-inset-bottom)); border-top:1px solid #efe6d8; background:#FBF6EE;">
      ${waBtnHtml()}
    </div>
  </div>`;

  root.querySelector('[data-back]').addEventListener('click', () => ctx.navigate('#/orders'));
}
