import { getAllOrders, updateItemStep, addItemStep, deleteItemStep, updateOrderItem } from '../api.js';
import { fmt, statusStyle } from '../config.js';
import { itemProgress } from './steps.js';
import { openModal } from '../ui.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const chipStyle = (on) =>
  `padding:7px 15px; border-radius:20px; border:1px solid ${on ? '#1B695E' : '#e7ddce'}; background:${on ? '#1B695E' : '#fff'}; color:${on ? '#fff' : '#6a6155'}; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap;`;

export async function boardTab(content, ctx) {
  content.innerHTML = `<div style="padding:60px; text-align:center; color:#a99e8e;">جارٍ التحميل…</div>`;
  let orders = await getAllOrders();
  let filter = '';

  const flatten = () => orders.flatMap((o) =>
    (o.order_items || []).map((it) => ({
      ...it,
      order_id: o.id,
      customer: o.profiles?.name || 'عميلة',
      phone: o.profiles?.phone || '—',
    }))
  );

  const allItems = flatten;

  // Order-level keys that should never appear on the production board.
  const ORDER_ONLY_KEYS = new Set(['received', 'delivering', 'delivered']);

  // How a step label relates to an item: done/current/future.
  const stepState = (it, label) => {
    const ip = itemProgress(it);
    const step = (it.order_item_steps || []).find((s) => s.label === label);
    if (!step || ORDER_ONLY_KEYS.has(step.key)) return 'hide';
    if (step.done || ip.complete) return 'done';
    if (step.id === ip.current?.id) return 'current';
    return 'hide';
  };

  const currentLabels = () => {
    // All distinct active step labels across every item, sorted by their first sort position.
    const labelSort = new Map();
    allItems().forEach((it) => {
      (it.order_item_steps || []).forEach((s) => {
        if (ORDER_ONLY_KEYS.has(s.key)) return;
        if (!labelSort.has(s.label) || s.sort < labelSort.get(s.label)) {
          labelSort.set(s.label, s.sort);
        }
      });
    });
    return [...labelSort.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
  };

  const pendingCount = (label) =>
    allItems().filter((it) => stepState(it, label) === 'current').length;

  const filteredItems = () => {
    if (!filter) return [];
    const list = allItems().filter((it) => stepState(it, filter) !== 'hide');
    return list.sort((a, b) => {
      const sa = stepState(a, filter);
      const sb = stepState(b, filter);
      if (sa === 'current' && sb !== 'current') return -1;
      if (sa !== 'current' && sb === 'current') return 1;
      return 0;
    });
  };

  const advanceCurrent = async (it) => {
    const { current } = itemProgress(it);
    if (!current) return;
    await updateItemStep(current.id, { done: true });
    current.done = true;
  };

  const render = () => {
    const chips = currentLabels();
    if (!filter && chips.length) filter = chips[0];
    const items = filteredItems();
    content.innerHTML = `
      <div style="margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px; overflow-x:auto; padding-bottom:4px;">
          ${chips.map((c) => {
            const count = pendingCount(c);
            const on = c === filter;
            return `<button data-chip="${esc(c)}" style="${chipStyle(on)}">${esc(c)}${count ? ` <span style="opacity:.85;">(${count})</span>` : ''}</button>`;
          }).join('')}
        </div>
        <div style="font-size:12px; color:#8a7f6f; margin-top:8px;">عدد القطع المعروضة: <span style="font-weight:800; color:#1B695E;">${items.length}</span></div>
      </div>
      <div class="nn-board-grid">
        ${items.length ? items.map((it) => itemCard(it, filter, stepState)).join('') : `<div style="text-align:center; padding:50px 20px; color:#a99e8e;">لا توجد قطع مطابقة</div>`}
      </div>`;

    content.querySelectorAll('[data-chip]').forEach((b) => b.addEventListener('click', () => {
      filter = b.dataset.chip;
      render();
    }));
    content.querySelectorAll('[data-advance]').forEach((cb) => {
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', async (e) => {
        e.stopPropagation();
        const id = +cb.dataset.advance;
        const it = allItems().find((x) => x.id === id);
        if (!it || stepState(it, filter) !== 'current') return;
        cb.disabled = true;
        try { await advanceCurrent(it); render(); }
        catch (e) { alert('تعذّر التحديث: ' + e.message); cb.disabled = false; }
      });
    });
    content.querySelectorAll('[data-sheet]').forEach((el) => el.addEventListener('click', () => {
      const id = +el.dataset.sheet;
      const it = allItems().find((x) => x.id === id);
      if (it) openItemSheet(content, it, render);
    }));
  };

  render();
}

function itemCard(it, filter, stepState) {
  const src = it.products?.images?.[0];
  const ip = itemProgress(it);
  const state = stepState(it, filter);
  const done = state === 'done' || ip.complete;
  const current = state === 'current';
  const statusKey = done ? 'ready' : ip.currentKey;
  const ipStyle = statusStyle(statusKey);
  const label = done ? 'تم' : ip.currentLabel;
  const opts = [it.size && `مقاس ${it.size}`, it.note && `ملاحظة: ${it.note}`].filter(Boolean).join(' · ');
  const adminNote = it.admin_note || '';
  const img = src
    ? `<img src="${esc(src)}" alt="${esc(it.name)}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; background:#f3ede2;">`
    : `<div style="position:absolute; inset:0; background:linear-gradient(135deg,#e9e0d2,#f3ede2);"></div>`;
  const action = done
    ? `<div data-done style="width:34px; height:34px; border-radius:10px; background:#e8f0ec; display:flex; align-items:center; justify-content:center; pointer-events:none;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5 9-11" stroke="#1B695E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`
      : current
      ? `<input type="checkbox" data-advance="${it.id}" style="width:34px; height:34px; accent-color:#1B695E; cursor:pointer;">`
      : '';
  return `<div data-sheet="${it.id}" style="aspect-ratio:1/1; border-radius:16px; overflow:hidden; position:relative; cursor:pointer; box-shadow:0 2px 8px rgba(60,40,20,.08); animation:nn-rise .35s ease both; isolation:isolate;">
    ${img}
    <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(36,59,55,.82) 0%, rgba(36,59,55,.35) 45%, rgba(36,59,55,0) 70%);"></div>
    <div style="position:absolute; top:10px; left:10px; right:10px; display:flex; justify-content:space-between; align-items:flex-start; gap:8px; direction:rtl;">
      <span style="font-size:11px; font-weight:800; color:${ipStyle.color}; background:${ipStyle.bg}; padding:4px 9px; border-radius:9px; box-shadow:0 1px 3px rgba(0,0,0,.08);">${label}</span>
      ${action ? `<div style="flex-shrink:0;">${action}</div>` : ''}
    </div>
    <div style="position:absolute; bottom:0; left:0; right:0; padding:12px 12px 14px; color:#fff; direction:rtl;">
      <div style="font-size:14px; font-weight:800; line-height:1.35; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 1px 3px rgba(0,0,0,.25);">${esc(it.name)}</div>
      <div style="font-size:11.5px; opacity:.92; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 1px 2px rgba(0,0,0,.2);">${esc(it.customer)} · <span dir="ltr">${esc(it.phone)}</span></div>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:6px;">
        <span style="font-size:11px; opacity:.9; text-shadow:0 1px 2px rgba(0,0,0,.2);">الكمية: ${it.qty} · ${ip.done}/${ip.total}</span>
        ${adminNote ? `<span style="font-size:11px; opacity:.85; background:rgba(255,255,255,.18); padding:2px 8px; border-radius:7px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:50%;">ملاحظة</span>` : ''}
      </div>
      ${opts ? `<div style="font-size:11px; opacity:.8; margin-top:5px; line-height:1.4; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-shadow:0 1px 2px rgba(0,0,0,.2);">${esc(opts)}</div>` : ''}
    </div>
  </div>`;
}

export function openItemSheet(root, it, onChange) {
  const steps = (it.order_item_steps ||= []);
  const src = it.products?.images?.[0];

  const ip = itemProgress(it);
  const ipStyle = statusStyle(ip.currentKey);
  const adminNote = it.admin_note || '';
  const noteIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;"><path d="M8 7h8M8 12h5M8 17h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 10.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="m17 3 4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const body = `
    <div style="padding:10px 0 6px; display:flex; justify-content:center; flex-shrink:0;"><div class="nn-sheet-handle" style="width:40px; height:5px; border-radius:3px; background:#ddd0bd;"></div></div>
    <div class="nn-scroll" style="overflow-y:auto; padding:14px 24px 8px;">
      <div style="display:flex; gap:16px; align-items:flex-start; margin-bottom:18px;">
        ${src ? `<img src="${esc(src)}" alt="${esc(it.name)}" style="width:110px; height:110px; border-radius:20px; object-fit:cover; background:#f3ede2; flex-shrink:0;">` : `<div style="width:110px; height:110px; border-radius:20px; background:#f3ede2; flex-shrink:0;"></div>`}
        <div style="flex:1; min-width:0;">
          <div style="font-size:20px; font-weight:800; color:#243b37; line-height:1.35;">${esc(it.name)}</div>
          <div style="font-size:14px; color:#8a7f6f; margin-top:5px;">${esc(it.customer)} · <span dir="ltr">${esc(it.phone)}</span></div>

          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:12px;">
            ${it.size ? `<span style="font-size:14px; font-weight:800; color:#5a5245; background:#f3ede2; padding:6px 12px; border-radius:10px;">المقاس: ${esc(it.size)}</span>` : ''}
            <span style="font-size:14px; font-weight:800; color:#243b37; background:#e8f0ec; padding:6px 12px; border-radius:10px;">الكمية: ${it.qty}</span>
          </div>

          <div style="display:flex; align-items:center; gap:10px; margin-top:12px;">
            <span style="font-size:13px; font-weight:800; color:${ipStyle.color}; background:${ipStyle.bg}; padding:6px 13px; border-radius:10px;">${ip.currentLabel}</span>
            <span style="font-size:13px; font-weight:700; color:#8a7f6f;">${ip.done} من ${ip.total} خطوات</span>
          </div>
        </div>
      </div>

      ${it.note ? `<div style="margin-bottom:16px; background:#FBF6EE; border:1px solid #efe6d8; border-radius:14px; padding:12px 14px;">
        <div style="font-size:12.5px; font-weight:800; color:#8a7f6f; margin-bottom:5px;">ملاحظة العميلة</div>
        <div style="font-size:15px; font-weight:600; color:#5a5245; line-height:1.6;">${esc(it.note)}</div>
      </div>` : ''}

      <div style="margin-bottom:16px; background:#FBF6EE; border:1px solid ${adminNote ? '#d5e5df' : '#ece2d3'}; border-radius:14px; padding:12px 14px;">
        <div style="display:flex; align-items:center; gap:6px; font-size:13px; font-weight:800; color:#6a6155; margin-bottom:7px;">${noteIcon} ملاحظة إدارية</div>
        <textarea id="admin-note" placeholder="أضيفي ملاحظة خاصة لهذه القطعة…" style="width:100%; height:72px; border-radius:11px; border:1px solid ${adminNote ? '#d5e5df' : '#ece2d3'}; background:#fff; padding:10px 12px; font-family:'Tajawal',sans-serif; font-size:15px; font-weight:${adminNote ? '700' : '500'}; color:${adminNote ? '#243b37' : '#8a7f6f'}; resize:none; line-height:1.55;">${esc(adminNote)}</textarea>
      </div>

      <div style="font-size:15px; font-weight:800; color:#3a4a45; margin-bottom:10px;">خطوات التنفيذ</div>
      <div id="item-steps"></div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <input id="add-step" placeholder="＋ أضيفي خطوة مخصصة…" style="flex:1; height:46px; border-radius:11px; border:1px solid #ece2d3; background:#FBF6EE; padding:0 12px; font-family:'Tajawal',sans-serif; font-size:14px;">
        <button id="add-step-btn" style="height:46px; padding:0 18px; border-radius:11px; background:#1B695E; color:#fff; border:none; font-size:14px; font-weight:700; cursor:pointer;">إضافة</button>
      </div>
    </div>
    <div style="padding:12px 24px calc(16px + env(safe-area-inset-bottom)); border-top:1px solid #efe6d8; background:#FBF6EE; flex-shrink:0;">
      <button data-done style="width:100%; height:52px; border-radius:15px; background:#243b37; color:#fff; border:none; font-size:16px; font-weight:700; cursor:pointer;">تم</button>
    </div>`;

  const { overlay, close } = openModal(root, body, onChange);
  const stepsEl = overlay.querySelector('#item-steps');

  const renderSteps = () => {
    const sorted = steps.slice().sort((x, y) => x.sort - y.sort);
    stepsEl.innerHTML = sorted.map((s, idx) => {
      const isReceived = s.key === 'received';
      const isConfirming = s.key === 'confirming';
      const isReady = s.key === 'ready';
      const nextIsReady = sorted[idx + 1]?.key === 'ready';
      const locked = isReceived || isConfirming;
      const canUp = idx > 0 && !isReceived && !isConfirming && !isReady;
      const canDown = idx < sorted.length - 1 && !isReceived && !isConfirming && !nextIsReady;
      const controls = locked
        ? `<span style="font-size:12px; color:#a99e8e; padding:0 8px;">${isConfirming ? 'يُتحكم به من حالة الطلب' : 'مُنجز تلقائيًا'}</span>`
        : `<div style="display:flex; gap:5px; flex-shrink:0;">
            <button data-up="${s.id}" ${canUp ? '' : 'disabled'} style="width:32px; height:32px; border-radius:8px; background:#fff; border:1px solid #e7ddce; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:${canUp ? 1 : .4};"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="m18 15-6-6-6 6" stroke="#8a7f6f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button data-down="${s.id}" ${canDown ? '' : 'disabled'} style="width:32px; height:32px; border-radius:8px; background:#fff; border:1px solid #e7ddce; cursor:pointer; display:flex; align-items:center; justify-content:center; opacity:${canDown ? 1 : .4};"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="#8a7f6f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button data-delstep="${s.id}" style="width:32px; height:32px; border-radius:8px; background:#fff; border:1px solid #f2dede; cursor:pointer; display:flex; align-items:center; justify-content:center;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5h6v2m-8 0 1 12h8l1-12" stroke="#c0a999" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>`;
      return `<div style="display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f7f2e9;">
        <input type="checkbox" data-step="${s.id}" ${s.done ? 'checked' : ''} ${locked ? 'disabled' : ''} style="width:26px; height:26px; accent-color:#1B695E; flex-shrink:0;">
        <div style="flex:1; min-width:0;">
          <div style="font-size:16px; font-weight:${s.done ? 700 : 600}; color:${s.done ? '#243b37' : '#5a5245'};">${esc(s.label)}${isReady ? ' <span style="font-size:11px; color:#a99e8e; font-weight:500;">(الخطوة النهائية)</span>' : ''}</div>
          ${s.note ? `<div style="font-size:13px; color:#a99e8e; margin-top:2px;">${esc(s.note)}</div>` : ''}
        </div>
        ${controls}
      </div>`;
    }).join('');

    stepsEl.querySelectorAll('[data-step]').forEach((cb) => cb.addEventListener('change', async () => {
      const id = +cb.dataset.step;
      const s = steps.find((x) => x.id === id);
      const sortedNow = steps.slice().sort((x, y) => x.sort - y.sort);
      const idx = sortedNow.findIndex((x) => x.id === id);
      cb.disabled = true;

      // Sequential validation.
      if (cb.checked) {
        const prev = sortedNow[idx - 1];
        if (prev && !prev.done) {
          alert('أكملي الخطوة السابقة أولاً');
          cb.checked = false; cb.disabled = false; return;
        }
      } else {
        const next = sortedNow[idx + 1];
        if (next && next.done) {
          alert('الغي الخطوة التالية أولاً');
          cb.checked = true; cb.disabled = false; return;
        }
      }

      try {
        await updateItemStep(id, { done: cb.checked });
        s.done = cb.checked;

        // If unchecked, uncheck all later steps.
        if (!cb.checked) {
          const later = sortedNow.slice(idx + 1).filter((x) => x.done);
          await Promise.all(later.map((ls) =>
            updateItemStep(ls.id, { done: false }).then(() => { ls.done = false; })
          ));
        }

        renderSteps();
      } catch (e) {
        cb.checked = !cb.checked;
        cb.disabled = false;
        alert('تعذّر الحفظ: ' + e.message);
      }
    }));

    stepsEl.querySelectorAll('[data-up], [data-down]').forEach((b) => b.addEventListener('click', async () => {
      const id = +b.dataset.up || +b.dataset.down;
      const isUp = b.hasAttribute('data-up');
      const sortedNow = steps.slice().sort((x, y) => x.sort - y.sort);
      const idx = sortedNow.findIndex((x) => x.id === id);
      const swapWith = sortedNow[isUp ? idx - 1 : idx + 1];
      if (!swapWith) return;
      const s = steps.find((x) => x.id === id);
      const oldSort = s.sort;
      try {
        await Promise.all([
          updateItemStep(s.id, { sort: swapWith.sort }),
          updateItemStep(swapWith.id, { sort: oldSort }),
        ]);
        s.sort = swapWith.sort;
        swapWith.sort = oldSort;
        renderSteps();
      } catch (e) { alert('تعذّر إعادة الترتيب: ' + e.message); }
    }));

    stepsEl.querySelectorAll('[data-delstep]').forEach((b) => b.addEventListener('click', async () => {
      const id = +b.dataset.delstep;
      if (!window.confirm('حذف هذه الخطوة؟')) return;
      try {
        await deleteItemStep(id);
        const i = steps.findIndex((x) => x.id === id);
        if (i > -1) steps.splice(i, 1);
        renderSteps();
      } catch (e) { alert('تعذّر الحذف: ' + e.message); }
    }));
  };
  renderSteps();

  overlay.querySelector('#add-step-btn').addEventListener('click', async () => {
    const inp = overlay.querySelector('#add-step');
    const label = inp.value.trim(); if (!label) return;
    // Insert custom steps before the final 'ready' step so ready stays last.
    const readyStep = steps.find((s) => s.key === 'ready');
    const sort = readyStep ? readyStep.sort : steps.reduce((m, s) => Math.max(m, s.sort), -1) + 1;
    try {
      const row = await addItemStep(it.id, label, sort, null);
      if (readyStep) {
        await updateItemStep(readyStep.id, { sort: readyStep.sort + 1 });
        readyStep.sort += 1;
      }
      steps.push(row);
      inp.value = '';
      renderSteps();
    } catch (e) { alert('تعذّر الإضافة: ' + e.message); }
  });

  const noteTa = overlay.querySelector('#admin-note');
  let savedNote = (it.admin_note || '').trim();
  let noteTimer = null;
  const saveNote = async () => {
    const val = noteTa.value.trim();
    if (val === savedNote) return;
    try {
      await updateOrderItem(it.id, { admin_note: val });
      it.admin_note = val;
      savedNote = val;
      noteTa.style.borderColor = '#1B695E';
      setTimeout(() => noteTa.style.borderColor = '', 800);
    } catch (e) { alert('تعذّر حفظ الملاحظة: ' + e.message); }
  };
  noteTa.addEventListener('input', () => { clearTimeout(noteTimer); noteTimer = setTimeout(saveNote, 900); });
  noteTa.addEventListener('blur', () => { clearTimeout(noteTimer); saveNote(); });
  noteTa.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); clearTimeout(noteTimer); saveNote(); } });

  overlay.querySelector('[data-done]').addEventListener('click', close);
}
