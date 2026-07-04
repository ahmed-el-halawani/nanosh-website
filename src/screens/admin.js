import {
  getProducts, createProductRow, updateProductRow, deleteProductRow, uploadProductImage,
  getAllOrders, updateOrderStep, addOrderStep, deleteOrderStep, updateOrderItem,
  updateItemStep,
} from '../api.js';
import { supabase } from '../supabase.js';
import { fmt, waLink, STATUS_LABEL, ORDER_AREAS, statusStyle } from '../config.js';
import { orderProgress, itemProgress } from './steps.js';
import { backBtn, openModal } from '../ui.js';
import { boardTab, openItemSheet } from './board.js';

const GENDERS = ['حريمي', 'رجالي', 'أطفال', 'الجميع'];
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const splitList = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);

export default async function admin(root, ctx, param) {
  if (!ctx.isAdmin) {
    root.innerHTML = `<div class="nn-page" style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:70vh; text-align:center; padding:60px 32px; background:#FBF6EE;">
      <div style="font-size:17px; font-weight:800; color:#243b37;">غير مصرح</div>
      <div style="font-size:13.5px; color:#8a7f6f; margin-top:8px;">هذه الصفحة مخصّصة لإدارة المتجر فقط.</div>
      <button data-shop style="margin-top:20px; height:48px; padding:0 28px; border-radius:14px; background:#1B695E; color:#fff; border:none; font-size:15px; font-weight:700; cursor:pointer;">العودة للمتجر</button>
    </div>`;
    root.querySelector('[data-shop]').addEventListener('click', () => ctx.navigate('#/shop'));
    return;
  }

  const tab = ['orders', 'board'].includes(param) ? param : 'products';
  const tabBtn = (key, label) => `<button data-tab="${key}" style="flex:1; height:42px; border:none; border-radius:12px; cursor:pointer; font-family:'Tajawal',sans-serif; font-size:14.5px; font-weight:700; background:${tab === key ? '#fff' : 'transparent'}; color:${tab === key ? '#1B695E' : '#8a7f6f'}; box-shadow:${tab === key ? '0 1px 4px rgba(0,0,0,.06)' : 'none'};">${label}</button>`;

  root.innerHTML = `
  <div class="nn-page" style="height:100%; display:flex; flex-direction:column; background:#FBF6EE;">
    <div class="nn-pagehead" style="padding:50px 16px 12px; display:flex; align-items:center; gap:12px;">
      ${backBtn}
      <div style="flex:1;">
        <div style="font-size:20px; font-weight:800; color:#243b37;">لوحة الإدارة</div>
        <div style="font-size:12.5px; color:#8a7f6f; margin-top:2px;">إدارة المنتجات والطلبات</div>
      </div>
    </div>
    <div class="nn-body nn-scroll" style="flex:1; overflow-y:auto; padding:2px 16px 90px;">
      <div style="display:flex; background:#f1e9db; border-radius:14px; padding:4px; gap:4px; margin-bottom:16px; max-width:520px;">
        ${tabBtn('products', 'المنتجات')}${tabBtn('orders', 'الطلبات')}${tabBtn('board', 'الإنتاج')}
      </div>
      <div id="admin-content"><div style="padding:60px; text-align:center; color:#a99e8e;">جارٍ التحميل…</div></div>
    </div>
  </div>`;

  root.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => ctx.navigate('#/admin/' + b.dataset.tab)));

  const content = root.querySelector('#admin-content');
  if (tab === 'products') await productsTab(content, ctx);
  else if (tab === 'board') await boardTab(content, ctx);
  else await ordersTab(content, ctx);
}

// ============================ PRODUCTS ============================
async function productsTab(content, ctx) {
  let products = await getProducts();

  const render = () => {
    content.innerHTML = `
      <button data-add style="width:100%; height:50px; border-radius:14px; background:#1B695E; color:#fff; border:none; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:16px;">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
        إضافة منتج
      </button>
      <div class="nn-admin-grid">
        ${products.map(productRow).join('')}
      </div>`;
    content.querySelector('[data-add]').addEventListener('click', () => openProductForm(content, null, reload));
    content.querySelectorAll('[data-edit]').forEach((el) => el.addEventListener('click', () =>
      openProductForm(content, products.find((p) => p.id === +el.dataset.edit), reload)));
    content.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async (e) => {
      e.stopPropagation();
      const p = products.find((x) => x.id === +b.dataset.del);
      if (!window.confirm(`حذف «${p.name_ar}»؟`)) return;
      await deleteProductRow(p.id); await reload();
    }));
  };
  const reload = async () => { products = await getProducts(); ctx.products = products; render(); };
  render();
}

function productRow(p) {
  const src = (p.images || [])[0] || '';
  const img = src
    ? `<img src="${esc(src)}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; background:#f3ede2;">`
    : `<div style="position:absolute; inset:0; background:linear-gradient(135deg,#e9e0d2,#f3ede2);"></div>`;
  const price = p.on_sale && p.old_price
    ? `<span style="font-size:13px; font-weight:800; color:#C6544E;">${fmt(p.price_egp)}</span> <span style="font-size:11px; color:#a99e8e; text-decoration:line-through; margin-inline-start:6px;">${fmt(p.old_price)}</span>`
    : `<span style="font-size:14px; font-weight:800; color:#1B695E;">${fmt(p.price_egp)}</span>`;
  return `<div data-edit="${p.id}" style="aspect-ratio:1/1; border-radius:16px; overflow:hidden; position:relative; cursor:pointer; box-shadow:0 2px 8px rgba(60,40,20,.08); animation:nn-rise .35s ease both; isolation:isolate;">
    ${img}
    <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(36,59,55,.82) 0%, rgba(36,59,55,.25) 50%, rgba(36,59,55,0) 75%);"></div>
    <div style="position:absolute; top:10px; right:10px; display:flex; gap:7px; direction:rtl;">
      <button data-del="${p.id}" style="width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,.92); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,.1);" title="حذف">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5h6v2m-8 0 1 12h8l1-12" stroke="#C6544E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <div style="position:absolute; bottom:0; left:0; right:0; padding:12px 12px 14px; color:#fff; direction:rtl;">
      <div style="font-size:14.5px; font-weight:800; line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 1px 3px rgba(0,0,0,.25);">${esc(p.name_ar)}</div>
      <div style="font-size:12px; opacity:.9; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 1px 2px rgba(0,0,0,.2);">${esc(p.gender || '')}${p.type ? ' · ' + esc(p.type) : ''}</div>
      <div style="margin-top:7px; direction:rtl;">${price}</div>
    </div>
  </div>`;
}

function openProductForm(root, product, onSaved) {
  const p = product || {};
  const images = [...(p.images || [])];
  const inp = (label, id, val = '', type = 'text', extra = '') =>
    `<label style="display:block;"><span style="display:block; font-size:12.5px; color:#5a5245; font-weight:600; margin-bottom:5px;">${label}</span>
     <input id="${id}" type="${type}" value="${esc(val)}" ${extra} style="width:100%; height:44px; border-radius:11px; border:1px solid #ece2d3; background:#fff; padding:0 12px; font-family:'Tajawal',sans-serif; font-size:14px; color:#243b37;"></label>`;

  const body = `
    <div style="padding:10px 0 6px; display:flex; justify-content:center; flex-shrink:0;"><div class="nn-sheet-handle" style="width:40px; height:5px; border-radius:3px; background:#ddd0bd;"></div></div>
    <div class="nn-scroll" style="overflow-y:auto; padding:8px 20px 4px;">
      <div style="font-size:17px; font-weight:800; color:#243b37; margin-bottom:16px;">${product ? 'تعديل منتج' : 'منتج جديد'}</div>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${inp('الاسم (عربي) *', 'f_name_ar', p.name_ar)}
        ${inp('الاسم (إنجليزي)', 'f_name_en', p.name_en)}
        <label style="display:block;"><span style="display:block; font-size:12.5px; color:#5a5245; font-weight:600; margin-bottom:5px;">الوصف</span>
          <textarea id="f_desc" style="width:100%; height:72px; border-radius:11px; border:1px solid #ece2d3; background:#fff; padding:10px 12px; font-family:'Tajawal',sans-serif; font-size:14px; color:#243b37; resize:none;">${esc(p.description)}</textarea></label>
        <div style="display:flex; gap:10px;">
          <div style="flex:1;">${inp('السعر (ج.م) *', 'f_price', p.price_egp, 'number')}</div>
          <div style="flex:1;">${inp('السعر قبل الخصم', 'f_old', p.old_price ?? '', 'number')}</div>
        </div>
        <label style="display:flex; align-items:center; gap:9px; cursor:pointer;">
          <input id="f_sale" type="checkbox" ${p.on_sale ? 'checked' : ''} style="width:18px; height:18px; accent-color:#1B695E;">
          <span style="font-size:13.5px; color:#5a5245; font-weight:600;">عرض/خصم</span>
        </label>
        <label style="display:block;"><span style="display:block; font-size:12.5px; color:#5a5245; font-weight:600; margin-bottom:5px;">النوع (للعميلة)</span>
          <select id="f_gender" style="width:100%; height:44px; border-radius:11px; border:1px solid #ece2d3; background:#fff; padding:0 12px; font-family:'Tajawal',sans-serif; font-size:14px; color:#243b37;">
            ${GENDERS.map((g) => `<option ${p.gender === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select></label>
        ${inp('الفئة (كارديجان كروشيه…)', 'f_type', p.type)}
        ${inp('الخامة', 'f_material', p.material)}
        ${inp('الألوان (بينها فاصلة)', 'f_colors', (p.colors || []).join('، '))}
        ${inp('وسوم (بينها فاصلة)', 'f_tags', (p.tags || []).join('، '))}
        ${inp('التوفّر (١ قطعة متبقية…)', 'f_stock', p.stock)}
        ${inp('مدة التنفيذ', 'f_lead', p.lead_time)}
        ${inp('الترتيب', 'f_sort', p.sort ?? 0, 'number')}

        <div>
          <div style="font-size:12.5px; color:#5a5245; font-weight:600; margin-bottom:7px;">الصور</div>
          <div id="thumbs" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px;"></div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button id="pick" type="button" style="height:40px; padding:0 14px; border-radius:11px; background:#e8f0ec; border:1px solid #d5e5df; color:#1B695E; font-family:'Tajawal',sans-serif; font-size:13px; font-weight:700; cursor:pointer;">رفع صور</button>
            <input id="file" type="file" accept="image/*" multiple style="display:none;">
            <input id="f_url" placeholder="أو الصق رابط صورة" style="flex:1; min-width:150px; height:40px; border-radius:11px; border:1px solid #ece2d3; background:#fff; padding:0 12px; font-family:'Tajawal',sans-serif; font-size:13px;">
            <button id="addurl" type="button" style="height:40px; padding:0 14px; border-radius:11px; background:#fff; border:1px solid #e7ddce; color:#5a5245; font-family:'Tajawal',sans-serif; font-size:13px; font-weight:700; cursor:pointer;">إضافة</button>
          </div>
          <div id="upmsg" style="font-size:12px; color:#8a7f6f; margin-top:6px;"></div>
        </div>
        <div id="formmsg" style="display:none; font-size:13px; border-radius:11px; padding:10px 12px; background:#fbeeee; color:#a15b5b;"></div>
      </div>
    </div>
    <div style="padding:12px 20px calc(16px + env(safe-area-inset-bottom)); border-top:1px solid #efe6d8; background:#FBF6EE; flex-shrink:0;">
      <button id="save" style="width:100%; height:52px; border-radius:15px; background:#1B695E; color:#fff; border:none; font-size:16px; font-weight:700; cursor:pointer;">${product ? 'حفظ التعديلات' : 'إضافة المنتج'}</button>
    </div>`;

  const { overlay, close } = openModal(root, body);
  const thumbs = overlay.querySelector('#thumbs');
  const upmsg = overlay.querySelector('#upmsg');

  const renderThumbs = () => {
    thumbs.innerHTML = images.map((src, i) =>
      `<div style="position:relative; width:64px; height:64px;">
        <img src="${esc(src)}" style="width:64px; height:64px; border-radius:10px; object-fit:cover; background:#f3ede2;">
        <button data-rm="${i}" style="position:absolute; top:-6px; left:-6px; width:20px; height:20px; border-radius:50%; background:#C6544E; color:#fff; border:1.5px solid #fff; cursor:pointer; font-size:12px; line-height:1;">×</button>
      </div>`).join('') || `<div style="font-size:12px; color:#a99e8e;">لا توجد صور بعد</div>`;
    thumbs.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { images.splice(+b.dataset.rm, 1); renderThumbs(); }));
  };
  renderThumbs();

  overlay.querySelector('#pick').addEventListener('click', () => overlay.querySelector('#file').click());
  overlay.querySelector('#file').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    upmsg.textContent = 'جارٍ رفع الصور…';
    try {
      for (const f of files) { const url = await uploadProductImage(f); images.push(url); renderThumbs(); }
      upmsg.textContent = 'تم الرفع ✅';
    } catch (err) { upmsg.textContent = 'تعذّر الرفع: ' + err.message; }
    e.target.value = '';
  });
  const addUrl = () => { const v = overlay.querySelector('#f_url').value.trim(); if (v) { images.push(v); overlay.querySelector('#f_url').value = ''; renderThumbs(); } };
  overlay.querySelector('#addurl').addEventListener('click', addUrl);

  overlay.querySelector('#save').addEventListener('click', async () => {
    const val = (id) => overlay.querySelector(id).value.trim();
    const name_ar = val('#f_name_ar');
    const price = parseInt(val('#f_price'), 10);
    const msg = overlay.querySelector('#formmsg');
    if (!name_ar || !price) { msg.style.display = 'block'; msg.textContent = 'الاسم والسعر مطلوبان'; return; }
    const row = {
      name_ar, name_en: val('#f_name_en') || null, description: val('#f_desc') || null,
      price_egp: price, old_price: val('#f_old') ? parseInt(val('#f_old'), 10) : null,
      on_sale: overlay.querySelector('#f_sale').checked,
      gender: overlay.querySelector('#f_gender').value, type: val('#f_type') || null,
      material: val('#f_material') || null, colors: splitList(val('#f_colors')),
      tags: splitList(val('#f_tags')), stock: val('#f_stock') || null,
      lead_time: val('#f_lead') || null, sort: parseInt(val('#f_sort'), 10) || 0, images,
    };
    const btn = overlay.querySelector('#save');
    btn.disabled = true; btn.textContent = 'جارٍ الحفظ…';
    try {
      if (product) await updateProductRow(product.id, row); else await createProductRow(row);
      close(); await onSaved();
    } catch (err) { btn.disabled = false; btn.textContent = 'حاولي مجددًا'; msg.style.display = 'block'; msg.textContent = err.message; }
  });
}

// ============================ ORDERS ============================
function orderCard(o, dateFmt) {
  const count = (o.order_items || []).reduce((n, i) => n + i.qty, 0);
  const progress = orderProgress(o);
  const style = statusStyle(progress.currentKey);
  return `<div data-open="${o.id}" style="aspect-ratio:1/1; border-radius:16px; background:#fff; border:1px solid #f0e8db; overflow:hidden; position:relative; cursor:pointer; box-shadow:0 2px 8px rgba(60,40,20,.06); animation:nn-rise .35s ease both; display:flex; flex-direction:column;">
    <div style="height:6px; background:${style.color}; flex-shrink:0;"></div>
    <div style="flex:1; padding:13px 12px 14px; display:flex; flex-direction:column; justify-content:space-between; direction:rtl;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <span style="font-size:11px; font-weight:800; color:${style.color}; background:${style.bg}; padding:5px 10px; border-radius:9px;">${progress.label}</span>
          <span style="font-size:15px; font-weight:800; color:#1B695E;">${fmt(o.total_estimate)}</span>
        </div>
        <div style="font-size:17px; font-weight:800; color:#243b37; margin-top:14px; line-height:1.25;">طلب #${o.id}</div>
        <div style="font-size:12.5px; color:#6a6155; margin-top:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(o.profiles?.name || 'عميلة')} · <span dir="ltr">${esc(o.profiles?.phone || '—')}</span></div>
      </div>
      <div>
        <div style="font-size:12px; color:#8a7f6f;">${dateFmt(o.created_at)} · ${count} قطعة</div>
        <div style="margin-top:8px; font-size:12px; font-weight:700; color:#8a7f6f;">المهام المنجزة: <span style="color:#243b37;">${progress.done}/${progress.total}</span></div>
      </div>
    </div>
  </div>`;
}

async function ordersTab(content, ctx) {
  let orders = await getAllOrders();
  const dateFmt = (iso) => new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });

  const render = () => {
    content.innerHTML = orders.length ? `<div class="nn-admin-grid">${orders.map((o) => orderCard(o, dateFmt)).join('')}</div>` : `<div style="text-align:center; padding:60px 20px; color:#a99e8e;">لا توجد طلبات بعد</div>`;

    content.querySelectorAll('[data-open]').forEach((el) => el.addEventListener('click', () =>
      openOrderDetail(content, orders.find((o) => o.id === +el.dataset.open), reload)));
  };
  const reload = async () => { orders = await getAllOrders(); render(); };
  render();
}

function openOrderDetail(root, order, onChange) {
  let steps = [...(order.order_steps || [])];
  const areaIndex = (key) => ORDER_AREAS.findIndex((a) => a.key === key);

  // One-time safety net: if an order is missing default steps for any area (old data / migration not run),
  // create them on the fly so the checklist always has a row per area.
  const ensureOrderSteps = async () => {
    const existing = new Set(steps.map((s) => s.area));
    const missing = ORDER_AREAS.filter((a) => !existing.has(a.key));
    if (!missing.length) return;
    try {
      const rows = missing.map((a, idx) => ({
        order_id: order.id, label: a.label, note: a.note, area: a.key,
        done: false, sort: idx,
      }));
      const { data, error } = await supabase.from('order_steps').insert(rows).select();
      if (error) throw error;
      steps.push(...(data || []));
      order.order_steps = steps;
    } catch (e) {
      // Non-fatal: render will show 0/0 for missing areas and the migration remains the proper fix.
      console.error('ensureOrderSteps failed', e);
    }
  };

  const body = `
    <div style="padding:10px 0 6px; display:flex; justify-content:center; flex-shrink:0;"><div class="nn-sheet-handle" style="width:40px; height:5px; border-radius:3px; background:#ddd0bd;"></div></div>
    <div class="nn-scroll" style="overflow-y:auto; padding:8px 20px 4px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:6px;">
        <div>
          <div style="font-size:18px; font-weight:800; color:#243b37;">طلب #${order.id}</div>
          <div style="font-size:12.5px; color:#8a7f6f; margin-top:3px;">${esc(order.profiles?.name || 'عميلة')} · <span dir="ltr">${esc(order.profiles?.phone || '—')}</span></div>
        </div>
        <span style="font-size:16px; font-weight:800; color:#1B695E;">${fmt(order.total_estimate)}</span>
      </div>

      <a href="${order.profiles?.phone ? 'https://wa.me/' + esc(String(order.profiles.phone).replace(/[^0-9]/g, '')) : waLink('')}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; height:44px; border-radius:12px; background:#25D366; color:#fff; text-decoration:none; font-size:13.5px; font-weight:700; margin:8px 0 16px;">تواصل مع العميلة عبر واتساب</a>

      <div style="font-size:13px; font-weight:800; color:#3a4a45; margin-bottom:8px;">حالة الطلب</div>
      <div id="derived-status" style="display:inline-block; font-size:12px; font-weight:700; color:${statusStyle(orderProgress(order).currentKey).color}; background:${statusStyle(orderProgress(order).currentKey).bg}; padding:6px 12px; border-radius:11px; margin-bottom:14px;">${orderProgress(order).label}</div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div style="font-size:15px; font-weight:800; color:#3a4a45;">القطع ومراحلها</div>
        <div style="font-size:11px; color:#a99e8e;">اضغطي على القطعة لإدارة خطواتها</div>
      </div>
      <div id="items"></div>

      <div style="font-size:13px; font-weight:800; color:#3a4a45; margin:20px 0 8px;">مهام الطلب العامة</div>
      <div id="areas"></div>
    </div>
    <div style="padding:12px 20px calc(16px + env(safe-area-inset-bottom)); border-top:1px solid #efe6d8; background:#FBF6EE; flex-shrink:0;">
      <button data-done style="width:100%; height:50px; border-radius:15px; background:#243b37; color:#fff; border:none; font-size:15px; font-weight:700; cursor:pointer;">إغلاق</button>
    </div>`;

  // Refresh the order list only when the panel closes (so sheet mutations never wipe the open panel).
  const { overlay, close } = openModal(root, body, onChange);
  const areasEl = overlay.querySelector('#areas');
  const statusEl = overlay.querySelector('#derived-status');
  const itemsEl = overlay.querySelector('#items');

  const allItemsDone = () => (order.order_items || []).every((it) => itemProgress(it).complete);

  const renderItems = () => {
    const list = (order.order_items || []).map((it) => {
      const src = it.products?.images?.[0];
      const ip = itemProgress(it);
      const ipStyle = statusStyle(ip.currentKey);
      const adminNote = it.admin_note || '';
      const noteIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;"><path d="M8 7h8M8 12h5M8 17h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 10.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m17 3 4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      return `<div data-item="${it.id}" style="background:#fff; border:1px solid #f0e8db; border-radius:18px; padding:14px; cursor:pointer; box-shadow:0 2px 6px rgba(60,40,20,.04); margin-bottom:12px;">
        <div style="display:flex; gap:13px;">
          ${src ? `<img src="${esc(src)}" style="width:76px; height:76px; border-radius:15px; object-fit:cover; background:#f3ede2; flex-shrink:0;">` : `<div style="width:76px; height:76px; border-radius:15px; background:#f3ede2; flex-shrink:0;"></div>`}
          <div style="flex:1; min-width:0;">
            <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
              <div style="font-size:16px; font-weight:800; color:#243b37; line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(it.name)}</div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink:0; margin-top:2px;"><path d="m9 6 6 6-6 6" stroke="#a99e8e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>

            <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:10px;">
              ${it.size ? `<span style="font-size:14px; font-weight:800; color:#5a5245; background:#f3ede2; padding:6px 12px; border-radius:10px;">المقاس: ${esc(it.size)}</span>` : ''}
              <span style="font-size:14px; font-weight:800; color:#243b37; background:#e8f0ec; padding:6px 12px; border-radius:10px;">الكمية: ${it.qty}</span>
            </div>
          </div>
        </div>

        <div style="margin-top:12px; padding-top:12px; border-top:1px solid #f7f2e9; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <span style="font-size:13px; font-weight:800; color:${ipStyle.color}; background:${ipStyle.bg}; padding:6px 13px; border-radius:10px;">${ip.currentLabel}</span>
          <span style="font-size:13px; font-weight:700; color:#8a7f6f;">${ip.done} من ${ip.total} خطوات</span>
        </div>

        ${it.note ? `<div style="margin-top:12px; background:#FBF6EE; border:1px solid #efe6d8; border-radius:12px; padding:10px 13px;">
          <div style="font-size:12px; font-weight:800; color:#8a7f6f; margin-bottom:4px;">ملاحظة العميلة</div>
          <div style="font-size:14px; font-weight:600; color:#5a5245; line-height:1.55;">${esc(it.note)}</div>
        </div>` : ''}

        <div style="margin-top:12px; background:#FBF6EE; border:1px solid ${adminNote ? '#d5e5df' : '#ece2d3'}; border-radius:12px; padding:11px 13px;" data-note-wrap>
          <div style="display:flex; align-items:center; gap:6px; font-size:12.5px; font-weight:800; color:#6a6155; margin-bottom:6px;">${noteIcon} ملاحظة إدارية</div>
          <textarea data-admin-note="${it.id}" placeholder="أضيفي ملاحظة خاصة لهذه القطعة…" style="width:100%; height:64px; border-radius:10px; border:1px solid ${adminNote ? '#d5e5df' : '#ece2d3'}; background:#fff; padding:10px 12px; font-family:'Tajawal',sans-serif; font-size:14.5px; font-weight:${adminNote ? '700' : '500'}; color:${adminNote ? '#243b37' : '#8a7f6f'}; resize:none; line-height:1.55;">${esc(adminNote)}</textarea>
        </div>
      </div>`;
    }).join('') || `<div style="text-align:center; padding:20px; color:#a99e8e; font-size:13px;">لا توجد قطع</div>`;
    itemsEl.innerHTML = list;

    itemsEl.querySelectorAll('[data-item]').forEach((el) => el.addEventListener('click', (e) => {
      if (e.target.closest('[data-admin-note]')) return;
      const it = order.order_items.find((x) => x.id === +el.dataset.item);
      if (!it) return;
      const enriched = { ...it, customer: order.profiles?.name || 'عميلة', phone: order.profiles?.phone || '—' };
      openItemSheet(root, enriched, renderItems);
    }));

    itemsEl.querySelectorAll('[data-admin-note]').forEach((ta) => {
      let saved = ta.value.trim();
      let timer = null;
      const save = async () => {
        const id = +ta.dataset.adminNote;
        const val = ta.value.trim();
        if (val === saved) return;
        try {
          await updateOrderItem(id, { admin_note: val });
          const it = order.order_items.find((x) => x.id === id);
          if (it) it.admin_note = val;
          saved = val;
          ta.style.borderColor = '#1B695E';
          setTimeout(() => ta.style.borderColor = '', 800);
        } catch (e) {
          alert('تعذّر حفظ الملاحظة: ' + e.message);
        }
      };
      ta.addEventListener('click', (e) => e.stopPropagation());
      ta.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(save, 900);
      });
      ta.addEventListener('blur', () => { clearTimeout(timer); save(); });
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); clearTimeout(timer); save(); } });
    });
  };
  renderItems();

  const areaPill = (a) => {
    if (a.complete) return { text: 'مكتمل', bg: '#e8f0ec', color: '#1B695E' };
    if (a.total > 0 && a.done > 0) return { text: 'جاري', bg: '#fff6e6', color: '#c7812c' };
    return { text: 'بانتظار', bg: '#f3ede2', color: '#8a7f6f' };
  };

  const syncPreparing = async () => {
    const preparingArea = ORDER_AREAS.find((a) => a.key === 'preparing');
    const preparingStep = steps.find((s) => s.area === 'preparing');
    if (!preparingStep) return;
    const shouldBeDone = allItemsDone();
    if (preparingStep.done !== shouldBeDone) {
      try {
        await updateOrderStep(preparingStep.id, { done: shouldBeDone });
        preparingStep.done = shouldBeDone;
      } catch (e) { /* swallow: will re-attempt on next render */ }
    }
  };

  const renderAreas = async () => {
    await syncPreparing();
    const progress = orderProgress({ ...order, order_steps: steps });
    statusEl.textContent = progress.label;
    statusEl.style.color = statusStyle(progress.currentKey).color;
    statusEl.style.background = statusStyle(progress.currentKey).bg;

    areasEl.innerHTML = progress.areas.map((a) => {
      const pill = areaPill(a);
      const isPreparing = a.key === 'preparing';
      const stepRows = a.steps.map((s, idx) => {
        const canUp = idx > 0;
        const canDown = idx < a.steps.length - 1;
        const isAutoPreparing = s.area === 'preparing';
        const prepTracker = isPreparing ? ` <span style="font-size:11px; color:#a99e8e; font-weight:500;">(تلقائي حسب القطع)</span>` : '';
        return `<div style="display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #f7f2e9;">
          <input type="checkbox" data-step="${s.id}" data-area="${s.area}" ${isAutoPreparing ? 'data-preparing' : ''} ${s.done ? 'checked' : ''} ${isAutoPreparing ? 'disabled' : ''} style="width:24px; height:24px; accent-color:#1B695E; flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <div style="font-size:14px; font-weight:${s.done ? 700 : 500}; color:${s.done ? '#243b37' : '#5a5245'};">${esc(s.label)}${prepTracker}</div>
            ${s.note ? `<div style="font-size:11.5px; color:#a99e8e; margin-top:1px;">${esc(s.note)}</div>` : ''}
          </div>
          ${isPreparing ? '' : `<div style="display:flex; gap:4px; flex-shrink:0;">
            <button data-up="${s.id}" ${canUp ? '' : 'disabled'} style="width:28px; height:28px; border-radius:7px; background:#fff; border:1px solid #e7ddce; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:${canUp ? 1 : .4};"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m18 15-6-6-6 6" stroke="#8a7f6f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button data-down="${s.id}" ${canDown ? '' : 'disabled'} style="width:28px; height:28px; border-radius:7px; background:#fff; border:1px solid #e7ddce; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:${canDown ? 1 : .4};"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="#8a7f6f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button data-delstep="${s.id}" style="width:28px; height:28px; border-radius:7px; background:#fff; border:1px solid #f2dede; cursor:pointer; display:flex; align-items:center; justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5h6v2m-8 0 1 12h8l1-12" stroke="#c0a999" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>`}
        </div>`;
      }).join('');

      const addInput = isPreparing ? '' : `<div style="display:flex; gap:8px; margin-top:10px;">
        <input data-addarea="${a.key}" placeholder="＋ أضيفي مهمة…" style="flex:1; height:40px; border-radius:10px; border:1px solid #ece2d3; background:#FBF6EE; padding:0 12px; font-family:'Tajawal',sans-serif; font-size:13px;">
        <button data-addarea-btn="${a.key}" style="height:40px; padding:0 14px; border-radius:10px; background:#1B695E; color:#fff; border:none; font-size:13px; font-weight:700; cursor:pointer;">إضافة</button>
      </div>`;

      return `<div style="background:#fff; border:1px solid #f0e8db; border-radius:16px; padding:12px 14px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="font-size:14px; font-weight:800; color:#243b37;">${a.name}</div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:11px; font-weight:700; color:#8a7f6f;">${a.done}/${a.total}</span>
            <span style="font-size:11px; font-weight:700; color:${pill.color}; background:${pill.bg}; padding:4px 10px; border-radius:9px;">${pill.text}</span>
          </div>
        </div>
        ${stepRows}
        ${addInput}
      </div>`;
    }).join('');

    // ponytail: preparing checkbox reflects item readiness (partial / full).
    const prepCb = areasEl.querySelector('[data-preparing]');
    if (prepCb && progress.totalItems > 0) {
      prepCb.indeterminate = progress.itemsReady > 0 && progress.itemsReady < progress.totalItems;
    }

    // Checkbox → update done, enforcing sequential order.
    areasEl.querySelectorAll('[data-step]').forEach((cb) => cb.addEventListener('change', async () => {
      const id = +cb.dataset.step;
      const s = steps.find((x) => x.id === id);
      const idx = areaIndex(s.area);
      cb.disabled = true;

      // Sequential validation.
      if (cb.checked) {
        const prevKey = ORDER_AREAS[idx - 1]?.key;
        if (prevKey) {
          const prevSteps = steps.filter((x) => x.area === prevKey);
          if (!prevSteps.every((x) => x.done)) {
            alert('أكملي المرحلة السابقة أولاً');
            cb.checked = false; cb.disabled = false; return;
          }
        }
      } else {
        const nextKey = ORDER_AREAS[idx + 1]?.key;
        if (nextKey) {
          const nextSteps = steps.filter((x) => x.area === nextKey);
          if (nextSteps.some((x) => x.done)) {
            alert('الغي المرحلة التالية أولاً');
            cb.checked = true; cb.disabled = false; return;
          }
        }
      }

      try {
        await updateOrderStep(id, { done: cb.checked });
        s.done = cb.checked;

        // Cascade confirming to all item confirming steps (both check and uncheck).
        if (s.area === 'confirming') {
          await Promise.all((order.order_items || []).flatMap((it) =>
            (it.order_item_steps || [])
              .filter((st) => st.key === 'confirming' && st.done !== cb.checked)
              .map((st) => updateItemStep(st.id, { done: cb.checked }).then(() => { st.done = cb.checked; }))
          ));
        }

        // If unchecked, uncheck all later areas.
        if (!cb.checked) {
          for (let i = idx + 1; i < ORDER_AREAS.length; i++) {
            const laterKey = ORDER_AREAS[i].key;
            const laterSteps = steps.filter((x) => x.area === laterKey && x.done);
            await Promise.all(laterSteps.map((ls) =>
              updateOrderStep(ls.id, { done: false }).then(() => { ls.done = false; })
            ));
          }
        }

        renderAreas();
        renderItems();
      } catch (e) {
        cb.checked = !cb.checked;
        cb.disabled = false;
        alert('تعذّر الحفظ: ' + e.message);
      }
    }));

    // Reorder within area (swap sort values)
    areasEl.querySelectorAll('[data-up], [data-down]').forEach((b) => b.addEventListener('click', async () => {
      const id = +b.dataset.up || +b.dataset.down;
      const isUp = b.hasAttribute('data-up');
      const s = steps.find((x) => x.id === id);
      const areaSteps = steps.filter((x) => (x.area || 'received') === (s.area || 'received')).sort((x, y) => x.sort - y.sort);
      const idx = areaSteps.findIndex((x) => x.id === id);
      const swapWith = areaSteps[isUp ? idx - 1 : idx + 1];
      if (!swapWith) return;
      const oldSort = s.sort;
      try {
        await Promise.all([
          updateOrderStep(s.id, { sort: swapWith.sort }),
          updateOrderStep(swapWith.id, { sort: oldSort }),
        ]);
        s.sort = swapWith.sort;
        swapWith.sort = oldSort;
        renderAreas();
      } catch (e) { alert('تعذّر إعادة الترتيب: ' + e.message); }
    }));

    // Delete step
    areasEl.querySelectorAll('[data-delstep]').forEach((b) => b.addEventListener('click', async () => {
      const id = +b.dataset.delstep;
      if (!window.confirm('حذف هذه المهمة؟')) return;
      try {
        await deleteOrderStep(id);
        const i = steps.findIndex((x) => x.id === id);
        if (i > -1) steps.splice(i, 1);
        renderAreas();
      } catch (e) { alert('تعذّر الحذف: ' + e.message); }
    }));

    // Add step to area
    areasEl.querySelectorAll('[data-addarea-btn]').forEach((b) => b.addEventListener('click', async () => {
      const area = b.dataset.addareaBtn;
      const inp = areasEl.querySelector(`[data-addarea="${area}"]`);
      const label = inp.value.trim(); if (!label) return;
      const areaSteps = steps.filter((s) => (s.area || 'received') === area);
      const sort = areaSteps.reduce((m, s) => Math.max(m, s.sort), -1) + 1;
      try {
        const row = await addOrderStep(order.id, label, sort, area);
        steps.push(row);
        inp.value = '';
        renderAreas();
      } catch (e) { alert('تعذّر الإضافة: ' + e.message); }
    }));
  };
  ensureOrderSteps().then(renderAreas);

  overlay.querySelector('[data-done]').addEventListener('click', close);
}
