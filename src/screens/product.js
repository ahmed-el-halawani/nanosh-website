import { addConfigured } from '../store.js';
import { fmt, waLink } from '../config.js';
import { openOptions } from './options.js';

// Arabic tags derived from the product's own attributes (source tags are English).
export function arabicTags(p) {
  return [p.type, p.material, p.gender, 'صناعة يدوية'].filter(Boolean);
}

export function productTags(p) {
  return arabicTags(p).map((t) =>
    `<span style="font-size:12.5px; color:#1B695E; background:#e8f0ec; border:1px solid #d5e5df; padding:6px 13px; border-radius:20px;">${t}</span>`).join('');
}

// Reusable image carousel: crossfade auto-switch + dot tabs + tap-to-zoom lightbox.
// Returns { html, mount(container) } — mount wires it up against elements inside `container`.
export function carousel(images, height = '300px') {
  const list = images.filter(Boolean);
  const multi = list.length > 1;
  const html = `
    <div class="nn-gallery" style="display:flex; gap:12px; align-items:stretch;">
      <div class="nn-carousel" style="position:relative; border-radius:20px; overflow:hidden; background:#f0e8db; height:${height}; cursor:zoom-in; flex:1; min-width:0;">
        <img class="hero-layer" src="${list[0] || ''}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:1; transition:opacity .6s ease;">
        <img class="hero-layer" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; transition:opacity .6s ease;">
        ${multi ? `<div class="nn-counter" style="position:absolute; top:12px; left:12px; background:rgba(20,15,10,.5); color:#fff; font-size:12px; font-weight:700; padding:4px 11px; border-radius:20px; backdrop-filter:blur(4px);">1 / ${list.length}</div>
        <div class="nn-dots" style="position:absolute; bottom:12px; left:0; right:0; display:flex; justify-content:center; gap:6px;"></div>` : ''}
      </div>
      ${multi ? `<div class="nn-thumbs">
        ${list.map((src, i) => `<img class="nn-thumb ${i === 0 ? 'on' : ''}" data-thumb="${i}" src="${src}" alt="">`).join('')}
      </div>` : ''}
    </div>`;

  function mount(container) {
    list.forEach((src) => { const im = new Image(); im.src = src; }); // preload for smooth fades
    const layers = container.querySelectorAll('.hero-layer');
    const dotsEl = container.querySelector('.nn-dots');
    const counter = container.querySelector('.nn-counter');
    const thumbsEl = container.querySelector('.nn-thumbs');
    let cur = 0, front = 0, timer = null;

    const dot = (on) => `width:${on ? 20 : 7}px; height:7px; border-radius:4px; background:${on ? '#fff' : 'rgba(255,255,255,.5)'}; transition:width .3s ease; cursor:pointer;`;
    const paint = () => {
      if (counter) counter.textContent = `${cur + 1} / ${list.length}`;
      if (dotsEl) dotsEl.innerHTML = list.map((_, i) => `<span data-dot="${i}" style="${dot(i === cur)}"></span>`).join('');
      if (thumbsEl) thumbsEl.querySelectorAll('.nn-thumb').forEach((el, i) => el.classList.toggle('on', i === cur));
    };
    const go = (i) => {
      const next = (i + list.length) % list.length;
      if (next === cur) return;
      cur = next;
      const back = layers[front ^ 1];
      back.src = list[cur];
      back.style.opacity = 1;
      layers[front].style.opacity = 0;
      front ^= 1;
      paint();
    };
    const resetTimer = () => {
      clearInterval(timer);
      timer = setInterval(() => { if (!layers[0].isConnected) { clearInterval(timer); return; } go(cur + 1); }, 3600);
    };

    if (multi) {
      paint();
      timer = setInterval(() => {
        if (!layers[0].isConnected) { clearInterval(timer); return; } // self-clean when unmounted
        go(cur + 1);
      }, 3600);
      dotsEl?.addEventListener('click', (e) => {
        const d = e.target.closest('[data-dot]'); if (!d) return;
        go(+d.dataset.dot); resetTimer();
      });
      thumbsEl?.addEventListener('click', (e) => {
        const t = e.target.closest('[data-thumb]'); if (!t) return;
        go(+t.dataset.thumb); resetTimer();
      });
    }
    container.querySelector('.nn-carousel').addEventListener('click', () => openLightbox(container.closest('[data-overlay-root]') || document.body, list, cur));
    return () => clearInterval(timer);
  }

  return { html, mount };
}

// Renders the mobile bottom-sheet overlay into the given screen root.
export function openProduct(root, p) {
  const images = (p.images || []).filter(Boolean);
  const gallery = carousel(images, '300px');
  const overlay = document.createElement('div');
  overlay.setAttribute('data-overlay-root', '');
  overlay.style.cssText = 'position:absolute; inset:0; z-index:40; background:rgba(30,20,15,.42); animation:nn-fade .2s ease; display:flex; flex-direction:column; justify-content:flex-end;';

  overlay.innerHTML = `
    <div data-close style="flex:1;"></div>
    <div style="background:#FBF6EE; border-radius:26px 26px 0 0; max-height:90%; display:flex; flex-direction:column; animation:nn-sheet .3s cubic-bezier(.2,.8,.2,1) both; overflow:hidden;">
      <div style="padding:10px 0 6px; display:flex; justify-content:center; flex-shrink:0;"><div style="width:40px; height:5px; border-radius:3px; background:#ddd0bd;"></div></div>
      <div class="nn-scroll" style="overflow-y:auto; padding:8px 20px 0;">
        ${gallery.html}
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-top:18px;">
          <div style="flex:1;">
            <div style="font-size:19px; font-weight:700; line-height:1.4; color:#243b37;">${p.name_ar}</div>
            <div style="font-size:13px; color:#8a7f6f; margin-top:5px;">${p.type || 'كروشيه'} · صناعة يدوية</div>
          </div>
          <span style="font-size:23px; font-weight:800; color:#1B695E; flex-shrink:0;">${fmt(p.price_egp)}</span>
        </div>
        <p style="font-size:14.5px; line-height:1.75; color:#5a5245; margin:14px 0 4px;">${p.description || ''}</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin:14px 0 6px;">${productTags(p)}</div>
        <div style="display:flex; align-items:center; gap:10px; background:#fbeeee; border:1px solid #f2dede; border-radius:14px; padding:12px 14px; margin:14px 0 18px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;"><circle cx="12" cy="12" r="9" stroke="#C6544E" stroke-width="1.8"/><path d="M12 7v6l3.5 2" stroke="#C6544E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span style="font-size:12.5px; color:#8a6a6a; line-height:1.55;">مدة التنفيذ التقريبية: <b style="color:#7a4f4f;">${p.lead_time || 'من ٧ إلى ١٤ يومًا'}</b> — كل قطعة تُحاك يدويًا خصيصًا لك.</span>
        </div>
      </div>
      <div style="padding:14px 20px calc(16px + env(safe-area-inset-bottom)); border-top:1px solid #efe6d8; background:#FBF6EE; display:flex; flex-direction:column; gap:10px; flex-shrink:0;">
        <button data-add style="width:100%; height:52px; border-radius:15px; background:#1B695E; color:#fff; border:none; font-size:16px; font-weight:700; cursor:pointer; box-shadow:0 8px 18px rgba(27,105,94,.28); display:flex; align-items:center; justify-content:center; gap:8px;">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="display:block;"><path d="M6 7h13l-1.2 8.5a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 7Z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" stroke="#fff" stroke-width="1.8"/></svg>
          <span>أضيفي إلى السلة</span>
        </button>
        <a href="${waLink('مرحبًا نانوش، مهتمة بـ: ' + p.name_ar)}" target="_blank" style="width:100%; height:50px; border-radius:15px; background:#25D366; color:#fff; text-decoration:none; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:10px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style="display:block;"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.42 1.27 4.86L2 22l5.28-1.24A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.13c-1.55 0-3-.44-4.23-1.2l-.3-.18-3.13.74.74-3.05-.2-.31A8.09 8.09 0 0 1 3.87 12 8.14 8.14 0 0 1 12 3.87 8.14 8.14 0 0 1 20.13 12 8.14 8.14 0 0 1 12 20.13Zm4.5-5.73c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z"/></svg>
          <span>اسألي عنها على واتساب</span>
        </a>
      </div>
    </div>`;

  const stop = gallery.mount(overlay);
  const close = () => { stop(); overlay.style.animation = 'nn-fade .18s ease reverse'; setTimeout(() => overlay.remove(), 160); };
  overlay.querySelector('[data-close]').addEventListener('click', close);
  overlay.querySelector('[data-add]').addEventListener('click', () => {
    openOptions(overlay,
      { name: p.name_ar, image: images[0] || '', price: p.price_egp },
      { size: '', note: '', qty: 1 },
      (opts) => { addConfigured(p, opts); close(); },
      'أضيفي إلى السلة');
  });
  root.appendChild(overlay);
}

// Fullscreen zoomed viewer with prev/next + dots.
export function openLightbox(parent, images, start) {
  let cur = start;
  const lb = document.createElement('div');
  lb.style.cssText = 'position:fixed; inset:0; z-index:80; background:rgba(10,8,6,.94); display:flex; flex-direction:column; animation:nn-fade .2s ease;';
  lb.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 18px; color:#fff;">
      <span id="lbc" style="font-size:14px; font-weight:700;">${cur + 1} / ${images.length}</span>
      <button data-x style="width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,.15); border:none; color:#fff; font-size:20px; cursor:pointer; line-height:1;">×</button>
    </div>
    <div style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
      <img id="lbimg" src="${images[cur]}" style="max-width:100%; max-height:100%; object-fit:contain; transition:opacity .3s ease;">
      ${images.length > 1 ? `
      <button data-prev style="position:absolute; right:12px; width:42px; height:42px; border-radius:50%; background:rgba(255,255,255,.15); border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button data-next style="position:absolute; left:12px; width:42px; height:42px; border-radius:50%; background:rgba(255,255,255,.15); border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m15 6-6 6 6 6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ''}
    </div>
    <div style="display:flex; justify-content:center; gap:7px; padding:18px;" id="lbdots"></div>`;

  const img = lb.querySelector('#lbimg');
  const c = lb.querySelector('#lbc');
  const dots = lb.querySelector('#lbdots');
  const paint = () => {
    img.style.opacity = 0;
    setTimeout(() => { img.src = images[cur]; img.style.opacity = 1; }, 150);
    c.textContent = `${cur + 1} / ${images.length}`;
    dots.innerHTML = images.map((_, i) => `<span data-d="${i}" style="width:${i === cur ? 20 : 8}px; height:8px; border-radius:4px; background:${i === cur ? '#fff' : 'rgba(255,255,255,.4)'}; cursor:pointer;"></span>`).join('');
  };
  paint();

  lb.querySelector('[data-x]').addEventListener('click', () => lb.remove());
  lb.querySelector('[data-prev]')?.addEventListener('click', () => { cur = (cur + 1) % images.length; paint(); });
  lb.querySelector('[data-next]')?.addEventListener('click', () => { cur = (cur - 1 + images.length) % images.length; paint(); });
  dots.addEventListener('click', (e) => { const d = e.target.closest('[data-d]'); if (d) { cur = +d.dataset.d; paint(); } });
  parent.appendChild(lb);
}
