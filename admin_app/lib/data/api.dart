import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';

// Thin data layer mirroring the web app's src/api.js (admin subset).
SupabaseClient get _db => Supabase.instance.client;

typedef Json = Map<String, dynamic>;

Future<Json?> getProfile(String userId) async {
  return await _db.from('profiles').select('*').eq('id', userId).maybeSingle();
}

// ---------------- Products ----------------
Future<List<Json>> getProducts() async {
  final data = await _db.from('products').select('*').order('sort');
  return (data as List).cast<Json>();
}

Future<Json> createProductRow(Json row) async {
  return await _db.from('products').insert(row).select().single();
}

Future<void> updateProductRow(String id, Json row) async {
  await _db.from('products').update(row).eq('id', id);
}

Future<void> deleteProductRow(String id) async {
  await _db.from('products').delete().eq('id', id);
}

// Uploads to the public product-images bucket, returns the public URL.
Future<String> uploadProductImage(Uint8List bytes, String ext) async {
  final e = ext.isEmpty ? 'jpg' : ext.toLowerCase();
  final path = '${DateTime.now().millisecondsSinceEpoch}-${bytes.length}.$e';
  await _db.storage.from('product-images').uploadBinary(
        path,
        bytes,
        fileOptions: FileOptions(contentType: 'image/${e == 'jpg' ? 'jpeg' : e}', upsert: false),
      );
  return _db.storage.from('product-images').getPublicUrl(path);
}

// ---------------- Orders ----------------
Future<List<Json>> getAllOrders() async {
  final data = await _db
      .from('orders')
      .select('*, order_items(*, products(images), order_item_steps(*)), order_steps(*), profiles(name, phone)')
      .order('created_at', ascending: false);
  return (data as List).cast<Json>();
}

// ---------------- Order-level steps ----------------
Future<void> updateOrderStep(int stepId, Json patch) async {
  await _db.from('order_steps').update(patch).eq('id', stepId);
}

Future<Json> addOrderStep(int orderId, String label, int sort, String area) async {
  return await _db
      .from('order_steps')
      .insert({'order_id': orderId, 'label': label, 'area': area, 'sort': sort, 'done': false})
      .select()
      .single();
}

Future<void> deleteOrderStep(int stepId) async {
  await _db.from('order_steps').delete().eq('id', stepId);
}

// ---------------- Order items ----------------
Future<void> updateOrderItem(int itemId, Json patch) async {
  await _db.from('order_items').update(patch).eq('id', itemId);
}

// ---------------- Per-item steps ----------------
Future<void> updateItemStep(int stepId, Json patch) async {
  await _db.from('order_item_steps').update(patch).eq('id', stepId);
}

Future<Json> addItemStep(int orderItemId, String label, int sort, String? key) async {
  return await _db
      .from('order_item_steps')
      .insert({'order_item_id': orderItemId, 'label': label, 'key': key, 'sort': sort, 'done': false})
      .select()
      .single();
}

Future<void> deleteItemStep(int stepId) async {
  await _db.from('order_item_steps').delete().eq('id', stepId);
}
