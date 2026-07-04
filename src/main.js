import './styles.css';
import { onAuthChange, getUser } from './auth.js';
import { onCartChange, cartCount } from './store.js';
import { TEAL, waLink } from './config.js';

import shop from './screens/shop.js';
import cart from './screens/cart.js';
import orders from './screens/orders.js';
import orderDetail from './screens/orderDetail.js';
import account from './screens/account.js';
import productPage from './screens/productPage.js';
import admin from './screens/admin.js';
import { logoBox } from './screens/logo.js';
import { getProfile } from './api.js';
import { isDesktop, desktopMQ } from './responsive.js';

const app = document.getElementById('app');

// Shared, mutable app context handed to every screen.
export const ctx = {
  user: null,
  isAdmin: false,
  products: null,          // cache; screens may set/read
  navigate: (hash) => { window.location.hash = hash; },
  render: () => render(),
};

const routes = { shop, cart, orders, order: orderDetail, account, product: productPage, admin };

// Paint immediately with the known user; load the admin flag in the background (never block first paint).
function applyUser(user) {
  ctx.user = user;
  ctx.isAdmin = false;
  render();
  if (user) {
    getProfile(user.id)
      .then((p) => { if (p?.is_admin) { ctx.isAdmin = true; render(); } })
      .catch(() => {});
  }
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'shop';
  const [name, param] = raw.split('/');
  return { name: routes[name] ? name : 'shop', param };
}

// ---- Floating bottom nav (ported from the design) ----
const NAV = [
  { key: 'shop', label: 'الرئيسية', route: 'shop',
    icon: (c) => `<path d="M4 11.5 12 4l8 7.5" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9h12v-9" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },
  { key: 'cart', label: 'السلة', route: 'cart', badge: true,
    icon: (c) => `<path d="M6 7h13l-1.2 8.5a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 7Z" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" stroke="${c}" stroke-width="1.8"/>` },
  { key: 'orders', label: 'طلباتي', route: 'orders',
    icon: (c) => `<path d="M9 3h6l1 3H8l1-3Z" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/><rect x="5" y="6" width="14" height="15" rx="2.5" stroke="${c}" stroke-width="1.8"/><path d="M9 11h6M9 15h4" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>` },
  { key: 'account', label: 'حسابي', route: 'account',
    icon: (c) => `<circle cx="12" cy="8.5" r="3.5" stroke="${c}" stroke-width="1.8"/><path d="M5 20c1.2-3.8 4.2-6 7-6s5.8 2.2 7 6" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>` },
];

function navHtml(active) {
  const count = cartCount();
  const items = NAV.map((n) => {
    const on = n.key === active;
    const c = on ? TEAL : '#9a8f80';
    const badge = n.badge && count > 0
      ? `<span style="position:absolute; top:-8px; left:-10px; min-width:17px; height:17px; padding:0 4px; border-radius:9px; background:#C6544E; color:#fff; font-size:10.5px; font-weight:800; display:flex; align-items:center; justify-content:center; border:1.5px solid #fff;">${count}</span>`
      : '';
    return `<button data-route="${n.route}" style="flex:1; background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:0;">
      <div style="display:flex; align-items:center; justify-content:center; width:46px; height:34px; border-radius:13px; background:${on ? '#e8f0ec' : 'transparent'};">
        <span style="position:relative; display:flex; align-items:center; justify-content:center;"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" style="display:block;">${n.icon(c)}</svg>${badge}</span>
      </div>
      <span style="font-size:11px; font-weight:${on ? 700 : 500}; color:${c}; line-height:1;">${n.label}</span>
    </button>`;
  }).join('');

  const nav = document.createElement('div');
  nav.className = 'nn-bottomnav';
  nav.style.cssText = 'position:absolute; left:14px; right:14px; bottom:20px; z-index:30; height:66px; background:rgba(255,255,255,.92); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid #efe6d8; border-radius:26px; box-shadow:0 12px 30px rgba(60,40,20,.16); display:flex; align-items:center; padding:6px;';
  nav.innerHTML = items;
  nav.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => ctx.navigate('#/' + b.dataset.route)));
  return nav;
}

// ---- Desktop top header ----
const HEADER_LINKS = [
  { route: 'shop', label: 'الرئيسية', match: ['shop', 'product'] },
  { route: 'orders', label: 'طلباتي', match: ['orders', 'order'] },
];

function topHeader(active) {
  const count = cartCount();
  const linkArr = HEADER_LINKS.map((l) =>
    `<button class="nn-navlink ${l.match.includes(active) ? 'on' : ''}" data-route="${l.route}">${l.label}</button>`);
  if (ctx.isAdmin) linkArr.push(`<button class="nn-navlink ${active === 'admin' ? 'on' : ''}" data-route="admin">الإدارة</button>`);
  const links = linkArr.join('');
  const badge = count > 0
    ? `<span style="position:absolute; top:-6px; left:-6px; min-width:18px; height:18px; padding:0 4px; border-radius:9px; background:#C6544E; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; border:1.5px solid #FBF6EE;">${count}</span>` : '';

  const header = document.createElement('header');
  header.className = 'nn-topnav';
  header.innerHTML = `
    <div class="nn-topnav-inner">
      <button data-route="shop" style="display:flex; align-items:center; gap:11px; background:none; border:none; cursor:pointer; padding:0;">
        ${logoBox(42, 12)}
        <span style="font-family:'Amiri',serif; font-weight:700; font-size:23px; color:#1B695E;">نانوش</span>
      </button>
      <nav style="display:flex; gap:6px; margin-inline-start:18px;">${links}</nav>
      <div class="nn-header-search" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:260px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="position:absolute; inset-inline-end:11px; top:50%; transform:translateY(-50%); pointer-events:none;"><circle cx="11" cy="11" r="7" stroke="#9a8f80" stroke-width="2"/><path d="m20 20-3-3" stroke="#9a8f80" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="header-search" autocomplete="off" placeholder="ابحثي عن قطعة…" style="width:100%; height:38px; padding:0 34px 0 12px; border:1px solid #ece2d3; border-radius:12px; background:#fff; font-size:13px; color:#2c3f3b; outline:none; font-family:'Tajawal',sans-serif;">
        <div id="header-dropdown" class="nn-search-dropdown" style="display:none; position:absolute; top:calc(100% + 6px); left:0; right:0; max-height:240px; overflow-y:auto; background:#fff; border:1px solid #ece2d3; border-radius:12px; box-shadow:0 8px 24px rgba(60,40,20,.12); z-index:50;"></div>
      </div>
      <div style="flex:1;"></div>
      <a href="${waLink('مرحبًا نانوش 🌿')}" target="_blank" style="display:flex; align-items:center; gap:8px; height:44px; padding:0 16px; border-radius:13px; background:#25D366; color:#fff; text-decoration:none; font-size:14px; font-weight:700;">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="#fff" style="display:block;"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.42 1.27 4.86L2 22l5.28-1.24A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2Zm0 18.13c-1.55 0-3-.44-4.23-1.2l-.3-.18-3.13.74.74-3.05-.2-.31A8.09 8.09 0 0 1 3.87 12 8.14 8.14 0 0 1 12 3.87 8.14 8.14 0 0 1 20.13 12 8.14 8.14 0 0 1 12 20.13Zm4.5-5.73c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z"/></svg>
        <span>تواصلي معنا</span>
      </a>
      <button class="nn-iconbtn ${active === 'account' ? 'on' : ''}" data-route="account" aria-label="حسابي">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.5" r="3.5" stroke="#3a4a45" stroke-width="1.8"/><path d="M5 20c1.2-3.8 4.2-6 7-6s5.8 2.2 7 6" stroke="#3a4a45" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <button class="nn-iconbtn" data-route="cart" aria-label="السلة">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 7h13l-1.2 8.5a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 7Z" stroke="#3a4a45" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 7a3 3 0 0 1 6 0" stroke="#3a4a45" stroke-width="1.8"/></svg>
        ${badge}
      </button>
    </div>`;
  header.querySelectorAll('[data-route]').forEach((b) =>
    b.addEventListener('click', () => ctx.navigate('#/' + b.dataset.route)));

  const searchInput = header.querySelector('#header-search');
  const dropdown = header.querySelector('#header-dropdown');
  const closeDropdown = () => { dropdown.style.display = 'none'; };
  const renderDropdown = (list) => {
    if (!list.length) { closeDropdown(); return; }
    dropdown.innerHTML = list.map((p, i) => `<div class="nn-search-item" data-index="${i}" data-name="${p.name_ar}">${p.name_ar}</div>`).join('');
    dropdown.style.display = 'block';
  };
  const select = (name) => {
    searchInput.value = name;
    closeDropdown();
    if (window.location.hash === '#/shop') window.dispatchEvent(new CustomEvent('nanosh-search', { detail: name }));
    else { ctx.searchQuery = name; ctx.navigate('#/shop'); }
  };

  searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (window.location.hash === '#/shop') {
      window.dispatchEvent(new CustomEvent('nanosh-search', { detail: value }));
      if (!value) closeDropdown();
      else renderDropdown((ctx.products || []).filter((p) => p.name_ar.includes(value)).slice(0, 8));
    } else {
      ctx.searchQuery = value;
      ctx.navigate('#/shop');
    }
  });
  searchInput.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') return;
    const active = dropdown.querySelector('.nn-search-item.on');
    let next = null;
    if (e.key === 'ArrowDown') { e.preventDefault(); next = active ? active.nextElementSibling : dropdown.firstElementChild; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); next = active ? active.previousElementSibling : dropdown.lastElementChild; }
    else if (e.key === 'Enter') { e.preventDefault(); active ? active.click() : closeDropdown(); }
    else if (e.key === 'Escape') { closeDropdown(); }
    if (next) { active?.classList.remove('on'); next.classList.add('on'); }
  });
  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.nn-search-item');
    if (item) select(item.dataset.name);
  });
  document.addEventListener('click', (e) => { if (!header.contains(e.target)) closeDropdown(); });

  return header;
}

let rendering = false;
let currentNav = null;   // whichever nav is mounted (header on desktop, bottom nav on mobile)
async function render() {
  if (rendering) return;
  rendering = true;
  const { name, param } = parseHash();
  app.innerHTML = '';
  currentNav = null;
  const desktop = isDesktop();

  if (desktop) { currentNav = topHeader(name); app.appendChild(currentNav); }

  const screen = document.createElement('div');
  screen.className = 'nn-page';
  screen.style.cssText = 'height:100%; position:relative;';
  app.appendChild(screen);
  try {
    await routes[name](screen, ctx, param);
  } catch (e) {
    screen.innerHTML = `<div style="padding:80px 24px; text-align:center; color:#8a7f6f;">حدث خطأ: ${e.message}</div>`;
  }
  // Mobile: floating bottom nav (order-detail hides it as it has its own back button).
  if (!desktop && name !== 'order') { currentNav = navHtml(name); app.appendChild(currentNav); }
  rendering = false;
}

function refreshNav() {
  if (!currentNav) return;
  const name = parseHash().name;
  const fresh = isDesktop() ? topHeader(name) : navHtml(name);
  currentNav.replaceWith(fresh);
  currentNav = fresh;
}

// React to auth + cart + breakpoint changes.
onAuthChange((user) => applyUser(user));
onCartChange(refreshNav);
window.addEventListener('hashchange', render);
desktopMQ.addEventListener('change', render);   // swap layout when crossing 900px

// In-app back button (mobile / iPhone PWA where there's no browser chrome).
app.addEventListener('click', (e) => {
  if (!e.target.closest('[data-back-history]')) return;
  if (window.history.length > 1) window.history.back();
  else ctx.navigate('#/shop');
});

// Boot — paint first, then resolve the user (onAuthChange also fires INITIAL_SESSION).
render();
getUser().then((u) => applyUser(u)).catch(() => {});
