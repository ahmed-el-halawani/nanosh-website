import { supabase } from './supabase.js';
import { ORDER_AREAS, ITEM_STEPS } from './config.js';

export async function getProducts() {
  const { data, error } = await supabase
    .from('products').select('*').order('sort');
  if (error) throw error;
  return data;
}

export async function getProduct(id) {
  const { data, error } = await supabase
    .from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
}

export async function saveProfile(userId, name, phone) {
  const { error } = await supabase
    .from('profiles').upsert({ id: userId, name, phone });
  if (error) throw error;
}

// Writes order + items + a fresh step timeline (first step marked done).
export async function createOrder(userId, cartItems) {
  const total = cartItems.reduce((n, i) => n + i.price * i.qty, 0);
  const { data: order, error: oErr } = await supabase
    .from('orders').insert({ user_id: userId, total_estimate: total, status: 'received' })
    .select().single();
  if (oErr) throw oErr;

  const items = cartItems.map((i) => ({
    order_id: order.id, product_id: i.productId, name: i.name,
    price: i.price, qty: i.qty, color: i.color, size: i.size, note: i.note,
  }));
  const { data: itemRows, error: iErr } = await supabase.from('order_items').insert(items).select();
  if (iErr) throw iErr;

  const orderSteps = ORDER_AREAS.map((a, idx) => ({
    order_id: order.id, label: a.label, note: a.note, area: a.key,
    done: a.key === 'received', sort: idx,
  }));
  const { error: sErr } = await supabase.from('order_steps').insert(orderSteps);
  if (sErr) throw sErr;

  const itemSteps = (itemRows || []).flatMap((it) =>
    ITEM_STEPS.map((s, idx) => ({
      order_item_id: it.id, label: s.label, note: s.note, key: s.key,
      done: false, sort: idx,
    }))
  );
  if (itemSteps.length) {
    const { error: isErr } = await supabase.from('order_item_steps').insert(itemSteps);
    if (isErr) throw isErr;
  }

  return order;
}

export async function getMyOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(images), order_item_steps(*)), order_steps(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getOrder(id) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(images), order_item_steps(*)), order_steps(*)')
    .eq('id', id).single();
  if (error) throw error;
  return data;
}

// ============================ ADMIN ============================

export async function createProductRow(row) {
  const { data, error } = await supabase.from('products').insert(row).select().single();
  if (error) throw error;
  return data;
}
export async function updateProductRow(id, row) {
  const { error } = await supabase.from('products').update(row).eq('id', id);
  if (error) throw error;
}
export async function deleteProductRow(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Uploads a file to the public product-images bucket, returns its public URL.
export async function uploadProductImage(file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

// All orders (admin) with items, steps, and the customer profile.
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(images), order_item_steps(*)), order_steps(*), profiles(name, phone)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrderStep(stepId, patch) {
  const { error } = await supabase.from('order_steps').update(patch).eq('id', stepId);
  if (error) throw error;
}
export async function addOrderStep(orderId, label, sort, area) {
  const { data, error } = await supabase
    .from('order_steps').insert({ order_id: orderId, label, area, sort, done: false }).select().single();
  if (error) throw error;
  return data;
}
export async function deleteOrderStep(stepId) {
  const { error } = await supabase.from('order_steps').delete().eq('id', stepId);
  if (error) throw error;
}

export async function updateOrderItem(itemId, patch) {
  const { error } = await supabase.from('order_items').update(patch).eq('id', itemId);
  if (error) throw error;
}

// Per-item step mutations (production board)
export async function updateItemStep(stepId, patch) {
  const { error } = await supabase.from('order_item_steps').update(patch).eq('id', stepId);
  if (error) throw error;
}
export async function addItemStep(orderItemId, label, sort, key) {
  const { data, error } = await supabase
    .from('order_item_steps').insert({ order_item_id: orderItemId, label, key, sort, done: false }).select().single();
  if (error) throw error;
  return data;
}
export async function deleteItemStep(stepId) {
  const { error } = await supabase.from('order_item_steps').delete().eq('id', stepId);
  if (error) throw error;
}
