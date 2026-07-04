// Cart lives in localStorage. Only a confirmed order ever reaches the DB.
const KEY = 'nanosh_cart';
const listeners = new Set();

function read() {
  try { return migrate(JSON.parse(localStorage.getItem(KEY)) || []); }
  catch { return []; }
}
function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((fn) => fn(items));
}
// ponytail: legacy carts lack line ids; assign them once so the UI can target unique lines
function migrate(items) { return items.map((i) => (i.id ? i : { ...i, id: crypto.randomUUID() })); }

export const onCartChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getCart = () => read();
export const cartCount = () => read().reduce((n, i) => n + i.qty, 0);
export const cartTotal = () => read().reduce((n, i) => i.price * i.qty, 0);

export function setQty(id, qty) {
  let items = read();
  if (qty <= 0) items = items.filter((i) => i.id !== id);
  else items = items.map((i) => (i.id === id ? { ...i, qty } : i));
  write(items);
}

// Create or configure a line with explicit options (from the options sheet).
// Same product + same size + same note → bump qty. Any difference → new line.
export function addConfigured(product, { size, note, qty }) {
  const items = read();
  const match = items.find((i) => i.productId === product.id && i.size === size && i.note === note);
  if (match) {
    match.qty += qty > 0 ? qty : 1;
  } else {
    items.push({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name_ar,
      image: (product.images || [])[0] || '',
      price: product.price_egp,
      qty: qty > 0 ? qty : 1,
      size,
      note,
    });
  }
  write(items);
}

export function updateItem(id, patch) {
  write(read().map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

export const removeItem = (id) => write(read().filter((i) => i.id !== id));
export const clearCart = () => write([]);

// ponytail: dev-only self-check for merge-vs-split behavior
if (import.meta.env?.DEV) {
  const saved = localStorage.getItem(KEY);
  localStorage.removeItem(KEY);
  const p = { id: 'demo_p1', name_ar: 'Demo', images: [], price_egp: 100 };
  addConfigured(p, { size: 'S', note: '', qty: 1 });
  addConfigured(p, { size: 'M', note: '', qty: 2 });
  addConfigured(p, { size: 'S', note: '', qty: 3 });
  const cart = getCart();
  console.assert(cart.length === 2, 'distinct options should create distinct lines');
  console.assert(cart.find((i) => i.size === 'S').qty === 4, 'identical options should merge qty');
  console.assert(cart.find((i) => i.size === 'M').qty === 2, 'different options should keep qty');
  if (saved !== null) localStorage.setItem(KEY, saved);
  else localStorage.removeItem(KEY);
}
