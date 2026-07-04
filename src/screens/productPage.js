import { getProduct } from '../api.js';
import { addConfigured } from '../store.js';
import { fmt, waLink } from '../config.js';
import { openOptions } from './options.js';
import { carousel, productTags } from './product.js';

// Desktop full product page (route #/product/:id). Mobile uses the bottom sheet instead,
// but this renders single-column safely if reached on a small screen.
export default async function productPage(root, ctx, id) {
  let p = ctx.products?.find((x) => x.id === id);
  if (!p) { try { p = await getProduct(id); } catch { /* fall through */ } }
  if (!p) {
    root.innerHTML = `<div class="nn-page"><div class="nn-body" style="padding:80px 24px; text-align:center; color:#8a7f6f;">تعذّر العثور على القطعة. <a href="#/shop" style="color:#1B695E;">العودة للمتجر</a></div></div>`;
    return;
  }

  const images = (p.images || []).filter(Boolean);
  const gallery = carousel(images, '420px');

  root.innerHTML = `
  <div class="nn-page" style="height:100%; display:flex; flex-direction:column; background:#FBF6EE;">
    <div class="nn-body nn-scroll" style="flex:1; overflow-y:auto; padding:24px 20px 120px;" data-overlay-root>
      <button data-back style="display:inline-flex; align-items:center; gap:6px; background:none; border:none; cursor:pointer; color:#1B695E; font-family:'Tajawal',sans-serif; font-size:14px; font-weight:700; margin-bottom:18px; padding:0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="#1B695E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        العودة للمتجر
      </button>

      <div class="nn-product-grid" style="display:grid; grid-template-columns:1fr; gap:24px;">
        <div>${gallery.html}</div>

        <div style="display:flex; flex-direction:column;">
          <div style="font-size:26px; font-weight:800; line-height:1.4; color:#243b37;">${p.name_ar}</div>
          <div style="font-size:14px; color:#8a7f6f; margin-top:8px;">${p.type || 'كروشيه'} · صناعة يدوية</div>
          <div style="font-size:30px; font-weight:800; color:#1B695E; margin-top:16px;">${fmt(p.price_egp)}</div>

          <p style="font-size:15.5px; line-height:1.85; color:#5a5245; margin:18px 0 6px;">${p.description || ''}</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin:12px 0 6px;">${productTags(p)}</div>

          <div style="display:flex; align-items:center; gap:10px; background:#fbeeee; border:1px solid #f2dede; border-radius:14px; padding:13px 15px; margin:16px 0 22px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;"><circle cx="12" cy="12" r="9" stroke="#C6544E" stroke-width="1.8"/><path d="M12 7v6l3.5 2" stroke="#C6544E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span style="font-size:13px; color:#8a6a6a; line-height:1.6;">مدة التنفيذ التقريبية: <b style="color:#7a4f4f;">${p.lead_time || 'من ٧ إلى ١٤ يومًا'}</b> — كل قطعة تُحاك يدويًا خصيصًا لك.</span>
          </div>

          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button data-add style="flex:1; min-width:200px; height:54px; border-radius:15px; background:#1B695E; color:#fff; border:none; font-size:16px; font-weight:700; cursor:pointer; box-shadow:0 8px 18px rgba(27,105,94,.28); display:flex; align-items:center; justify-content:center; gap:8px;">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="display:block;"><path d="M6 7h13l-1.2 8.5a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 7Z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" stroke="#fff" stroke-width="1.8"/></svg>
              <span>أضيفي إلى السلة</span>
            </button>
            <a href="${waLink('مرحبًا نانوش، مهتمة بـ: ' + p.name_ar)}" target="_blank" style="flex:1; min-width:200px; height:54px; border-radius:15px; background:#25D366; color:#fff; text-decoration:none; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:10px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style="display:block;"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.42 1.27 4.86L2 22l5.28-1.24A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.13c-1.55 0-3-.44-4.23-1.2l-.3-.18-3.13.74.74-3.05-.2-.31A8.09 8.09 0 0 1 3.87 12 8.14 8.14 0 0 1 12 3.87 8.14 8.14 0 0 1 20.13 12 8.14 8.14 0 0 1 12 20.13Zm4.5-5.73c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z"/></svg>
              <span>اسألي عنها على واتساب</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  gallery.mount(root);
  root.querySelector('[data-back]').addEventListener('click', () => ctx.navigate('#/shop'));
  root.querySelector('[data-add]').addEventListener('click', () => {
    openOptions(root,
      { name: p.name_ar, image: images[0] || '', price: p.price_egp },
      { size: '', note: '', qty: 1 },
      (opts) => addConfigured(p, opts),
      'أضيفي إلى السلة');
  });
}
