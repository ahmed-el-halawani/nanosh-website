// Shared in-app back button (mobile only — desktop uses the top header).
// Click is handled by a delegated listener in main.js via the data-back-history attribute.
export const backBtn = `<button class="nn-mobile-back" data-back-history aria-label="رجوع" style="width:40px; height:40px; border-radius:12px; background:#fff; border:1px solid #ece2d3; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="#1B695E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
</button>`;

// Shared bottom sheet / centered modal. onClose runs once when dismissed.
export function openModal(root, innerHtml, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'nn-modal-overlay';
  overlay.style.cssText = 'position:absolute; inset:0; z-index:50; background:rgba(30,20,15,.42); animation:nn-fade .2s ease; display:flex; flex-direction:column; justify-content:flex-end;';
  overlay.innerHTML = `
    <div data-close style="flex:1;"></div>
    <div class="nn-modal" style="background:#FBF6EE; border-radius:26px 26px 0 0; max-height:92%; display:flex; flex-direction:column; animation:nn-sheet .3s cubic-bezier(.2,.8,.2,1) both; overflow:hidden;">
      ${innerHtml}
    </div>`;
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    overlay.style.animation = 'nn-fade .18s ease reverse';
    setTimeout(() => overlay.remove(), 160);
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  overlay.querySelector('[data-close]').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  root.appendChild(overlay);
  return { overlay, close };
}
