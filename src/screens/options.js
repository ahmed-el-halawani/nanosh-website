import { fmt, SIZES } from '../config.js';

// Reusable options bottom sheet (size / note / quantity).
// item: { name, image, price }
// selected: { size, note, qty }  — current values (edit) or defaults (add)
// onConfirm(result) receives the chosen { size, note, qty }. ctaLabel sets the button text.
export function openOptions(root, item, selected, onConfirm, ctaLabel = 'إضافة إلى السلة') {
  const state = {
    size: selected.size ?? '',
    note: selected.note ?? '',
    qty: selected.qty && selected.qty > 0 ? selected.qty : 1,
  };
  const FREE = 'مقاس حر';

  const overlay = document.createElement('div');
  overlay.className = 'nn-modal-overlay';
  overlay.style.cssText = 'position:absolute; inset:0; z-index:50; background:rgba(30,20,15,.42); animation:nn-fade .2s ease; display:flex; flex-direction:column; justify-content:flex-end;';

  const chip = (active) => `flex-shrink:0; padding:9px 16px; border-radius:20px; border:1.5px solid ${active ? '#1B695E' : '#e7ddce'}; background:${active ? '#e8f0ec' : '#fff'}; color:${active ? '#1B695E' : '#6a6155'}; font-size:13px; font-weight:700; cursor:pointer; font-family:'Tajawal',sans-serif;`;
  const sizeBtns = () => SIZES.map((s) =>
    `<button data-size="${s}" style="${chip(state.size === s)}">${s}</button>`).join('');

  overlay.innerHTML = `
    <div data-close style="flex:1;"></div>
    <div class="nn-modal" style="background:#FBF6EE; border-radius:26px 26px 0 0; max-height:92%; display:flex; flex-direction:column; animation:nn-sheet .3s cubic-bezier(.2,.8,.2,1) both; overflow:hidden;">
      <div class="nn-sheet-handle" style="padding:10px 0 6px; display:flex; justify-content:center; flex-shrink:0;"><div style="width:40px; height:5px; border-radius:3px; background:#ddd0bd;"></div></div>
      <div class="nn-scroll" style="overflow-y:auto; padding:10px 20px 6px;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
          <img src="${item.image}" alt="${item.name}" style="width:62px; height:62px; border-radius:14px; object-fit:cover; background:#f0e8db; flex-shrink:0;">
          <div style="flex:1; min-width:0;">
            <div style="font-size:16px; font-weight:700; color:#243b37; line-height:1.4;">${item.name}</div>
            <div style="font-size:15px; font-weight:800; color:#1B695E; margin-top:4px;">${fmt(item.price)}</div>
          </div>
        </div>

        <div style="font-size:13.5px; font-weight:700; color:#3a4a45; margin:20px 0 10px;">المقاس</div>
        <div id="sizes" style="display:flex; flex-wrap:wrap; gap:9px;">${sizeBtns()}</div>

        <div style="font-size:13.5px; font-weight:700; color:#3a4a45; margin:20px 0 10px;">ملاحظة خاصة</div>
        <div id="sizeHint" style="display:none; align-items:flex-start; gap:8px; background:#fbeeee; border:1px solid #f2dede; border-radius:12px; padding:10px 12px; margin-bottom:10px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0; margin-top:1px;"><circle cx="12" cy="12" r="9" stroke="#C6544E" stroke-width="1.7"/><path d="M12 8h.01M11 12h1v4h1" stroke="#C6544E" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span style="font-size:12.5px; color:#8a6a6a; line-height:1.6;">اخترتِ مقاسًا حرًّا — اكتبي قياساتك (الصدر، الطول…) في الملاحظة ليُحاك على مقاسك.</span>
        </div>
        <textarea id="note" placeholder="اكتبي أي تفاصيل: القياسات، درجة اللون، طلب خاص…" style="width:100%; height:78px; border-radius:14px; border:1px solid #ece2d3; background:#fff; padding:12px 13px; font-family:'Tajawal',sans-serif; font-size:13.5px; color:#243b37; resize:none; line-height:1.6;">${state.note}</textarea>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:18px;">
          <span style="font-size:13.5px; font-weight:700; color:#3a4a45;">الكمية</span>
          <div style="display:flex; align-items:center; gap:14px; background:#f6f0e6; border-radius:12px; padding:5px 8px;">
            <button data-minus style="width:32px; height:32px; border-radius:9px; background:#fff; border:1px solid #e7ddce; display:flex; align-items:center; justify-content:center; cursor:pointer;"><svg width="15" height="15" viewBox="0 0 24 24"><path d="M5 12h14" stroke="#1B695E" stroke-width="2.6" stroke-linecap="round"/></svg></button>
            <span id="qty" style="font-size:16px; font-weight:800; min-width:20px; text-align:center; color:#243b37;">${state.qty}</span>
            <button data-plus style="width:32px; height:32px; border-radius:9px; background:#fff; border:1px solid #e7ddce; display:flex; align-items:center; justify-content:center; cursor:pointer;"><svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#1B695E" stroke-width="2.6" stroke-linecap="round"/></svg></button>
          </div>
        </div>
      </div>
      <div style="padding:14px 20px calc(16px + env(safe-area-inset-bottom)); border-top:1px solid #efe6d8; background:#FBF6EE; flex-shrink:0;">
        <button data-confirm style="width:100%; height:52px; border-radius:15px; background:#1B695E; color:#fff; border:none; font-size:16px; font-weight:700; cursor:pointer; box-shadow:0 8px 18px rgba(27,105,94,.28); display:flex; align-items:center; justify-content:center; gap:8px;">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="display:block;"><path d="M6 7h13l-1.2 8.5a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 7Z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" stroke="#fff" stroke-width="1.8"/></svg>
          <span>${ctaLabel}</span>
        </button>
      </div>
    </div>`;

  const sizesEl = overlay.querySelector('#sizes');
  const qtyEl = overlay.querySelector('#qty');
  const noteEl = overlay.querySelector('#note');
  const hintEl = overlay.querySelector('#sizeHint');
  const syncHint = () => { hintEl.style.display = state.size === FREE ? 'flex' : 'none'; };
  syncHint();

  sizesEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-size]'); if (!b) return;
    state.size = state.size === b.dataset.size ? '' : b.dataset.size;
    sizesEl.innerHTML = sizeBtns();
    syncHint();
  });
  overlay.querySelector('[data-plus]').addEventListener('click', () => { state.qty += 1; qtyEl.textContent = state.qty; });
  overlay.querySelector('[data-minus]').addEventListener('click', () => { if (state.qty > 1) { state.qty -= 1; qtyEl.textContent = state.qty; } });

  const close = () => { overlay.style.animation = 'nn-fade .18s ease reverse'; setTimeout(() => overlay.remove(), 160); };
  overlay.querySelector('[data-close]').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); }); // dismiss on outside click
  overlay.querySelector('[data-confirm]').addEventListener('click', () => {
    state.note = noteEl.value.trim();
    onConfirm({ ...state });
    close();
  });

  root.appendChild(overlay);
}
