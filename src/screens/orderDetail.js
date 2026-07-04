import { getOrder } from '../api.js';
import { fmt, waLink, STATUS_LABEL, ACCENT } from '../config.js';
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
    const opts = [it.size && `المقاس: ${it.size}`, it.note].filter(Boolean).join(' · ');
    const src = it.products?.images?.[0];
    const ip = itemProgress(it);
    const statusColor = ip.complete ? '#1B695E' : '#C6544E';
    const statusBg = ip.complete ? '#e8f0ec' : '#fbeeee';
    return `<div style="display:flex; gap:11px; background:#fff; border:1px solid #f0e8db; border-radius:16px; padding:11px; margin-bottom:10px;">
      ${src
        ? `<img src="${src}" alt="${it.name}" style="width:60px; height:60px; border-radius:12px; object-fit:cover; background:#f3ede2; flex-shrink:0;">`
        : `<div style="width:60px; height:60px; border-radius:12px; background:#f3ede2; flex-shrink:0;"></div>`}
      <div style="flex:1; min-width:0;">
        <div style="display:flex; justify-content:space-between; gap:8px;">
          <div style="font-size:14px; font-weight:600; color:#2c3f3b; line-height:1.35;">${it.name}</div>
          <span style="font-size:14px; font-weight:800; color:#1B695E; white-space:nowrap;">${fmt(it.price * it.qty)}</span>
        </div>
        <div style="font-size:12px; color:#8a7f6f; margin-top:4px;">الكمية: ${it.qty}</div>
        ${opts ? `<div style="font-size:12px; color:#6a6155; margin-top:3px; line-height:1.5;">${opts}</div>` : ''}
        <div style="display:flex; align-items:center; gap:8px; margin-top:7px;">
          <span style="font-size:11px; font-weight:700; color:${statusColor}; background:${statusBg}; padding:4px 10px; border-radius:9px;">${ip.currentLabel}</span>
          <span style="font-size:11px; color:#a99e8e;">${ip.done}/${ip.total}</span>
        </div>
      </div>
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
      <div style="font-size:12px; font-weight:700; color:${ACCENT}; background:#fbeeee; padding:6px 12px; border-radius:11px;">${progress.label}</div>
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
