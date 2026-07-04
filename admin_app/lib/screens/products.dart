import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../theme.dart';
import '../data/api.dart';
import '../data/constants.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});
  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  late Future<List<Json>> _future;

  @override
  void initState() {
    super.initState();
    _future = getProducts();
  }

  void _reload() => setState(() => _future = getProducts());

  Future<void> _openForm([Json? product]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ProductFormPage(product: product)),
    );
    if (saved == true) _reload();
  }

  Future<void> _delete(Json p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text('حذف «${p['name_ar']}»؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('إلغاء')),
          TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('حذف')),
        ],
      ),
    );
    if (ok == true) {
      await deleteProductRow(p['id'] as String);
      _reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: cream,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: teal,
        onPressed: () => _openForm(),
        icon: const Icon(Icons.add),
        label: const Text('إضافة منتج'),
      ),
      body: FutureBuilder<List<Json>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: teal));
          }
          if (snap.hasError) {
            return Center(child: Text('خطأ: ${snap.error}', style: const TextStyle(color: muted)));
          }
          final products = snap.data ?? [];
          if (products.isEmpty) {
            return const Center(child: Text('لا توجد منتجات', style: TextStyle(color: muted)));
          }
          return LayoutBuilder(
            builder: (context, constraints) {
              final cross = _crossAxisCount(constraints.maxWidth);
              return GridView.builder(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: cross,
                  childAspectRatio: 1,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: products.length,
                itemBuilder: (_, i) => _productCard(products[i]),
              );
            },
          );
        },
      ),
    );
  }

  int _crossAxisCount(double width) {
    if (width >= 1200) return 5;
    if (width >= 900) return 4;
    if (width >= 600) return 3;
    if (width >= 360) return 2;
    return 2;
  }

  Widget _productCard(Json p) {
    final images = (p['images'] as List?)?.cast<String>() ?? const [];
    final onSale = p['on_sale'] == true;
    final oldPrice = p['old_price'] as num?;
    return InkWell(
      onTap: () => _openForm(p),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: line),
          boxShadow: const [BoxShadow(color: Color(0x103C2814), blurRadius: 8, offset: Offset(0, 2))],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            images.isNotEmpty
                ? Image.network(images.first, fit: BoxFit.cover, errorBuilder: (context, error, stackTrace) => _imgPlaceholder())
                : _imgPlaceholder(),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black.withOpacity(0.78), Colors.black.withOpacity(0.25), Colors.transparent],
                ),
              ),
            ),
            Positioned(
              top: 10, right: 10,
              child: GestureDetector(
                onTap: () => _delete(p),
                child: Container(
                  width: 34, height: 34,
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.92), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.delete_outline, color: accent, size: 19),
                ),
              ),
            ),
            Positioned(
              bottom: 0, left: 0, right: 0,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(p['name_ar'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: Colors.white, shadows: [Shadow(color: Colors.black45, blurRadius: 3)])),
                    const SizedBox(height: 3),
                    Text([p['gender'], p['type']].where((e) => e != null && '$e'.isNotEmpty).join(' · '),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: Colors.white70)),
                    const SizedBox(height: 6),
                    onSale && oldPrice != null
                        ? Row(
                            children: [
                              Text(fmt(p['price_egp'] as num?),
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: accent)),
                              const SizedBox(width: 6),
                              Text(fmt(oldPrice),
                                  style: const TextStyle(fontSize: 11, color: Colors.white70, decoration: TextDecoration.lineThrough)),
                            ],
                          )
                        : Text(fmt(p['price_egp'] as num?),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: teal)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _imgPlaceholder() =>
      Container(color: const Color(0xFFF3EDE2), child: const Icon(Icons.image, color: Color(0xFFD9CDB9)));
}

// ------------------------- Add / Edit form -------------------------
class ProductFormPage extends StatefulWidget {
  final Json? product;
  const ProductFormPage({super.key, this.product});
  @override
  State<ProductFormPage> createState() => _ProductFormPageState();
}

class _ProductFormPageState extends State<ProductFormPage> {
  late final Map<String, TextEditingController> _c;
  late String _gender;
  late bool _onSale;
  late List<String> _images;
  final _urlCtl = TextEditingController();
  bool _saving = false;
  String? _error;

  Json get _p => widget.product ?? const {};

  @override
  void initState() {
    super.initState();
    _c = {
      'name_ar': TextEditingController(text: _p['name_ar'] ?? ''),
      'name_en': TextEditingController(text: _p['name_en'] ?? ''),
      'description': TextEditingController(text: _p['description'] ?? ''),
      'price_egp': TextEditingController(text: (_p['price_egp'] ?? '').toString()),
      'old_price': TextEditingController(text: (_p['old_price'] ?? '').toString()),
      'type': TextEditingController(text: _p['type'] ?? ''),
      'material': TextEditingController(text: _p['material'] ?? ''),
      'colors': TextEditingController(text: ((_p['colors'] as List?)?.join('، ')) ?? ''),
      'tags': TextEditingController(text: ((_p['tags'] as List?)?.join('، ')) ?? ''),
      'stock': TextEditingController(text: _p['stock'] ?? ''),
      'lead_time': TextEditingController(text: _p['lead_time'] ?? ''),
      'sort': TextEditingController(text: (_p['sort'] ?? 0).toString()),
    };
    _gender = (_p['gender'] as String?) ?? genders.first;
    _onSale = _p['on_sale'] == true;
    _images = ((_p['images'] as List?)?.cast<String>() ?? const []).toList();
  }

  @override
  void dispose() {
    for (final ctl in _c.values) {
      ctl.dispose();
    }
    _urlCtl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final x = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 82);
    if (x == null) return;
    setState(() => _error = null);
    try {
      final bytes = await x.readAsBytes();
      final ext = x.name.contains('.') ? x.name.split('.').last : 'jpg';
      final url = await uploadProductImage(bytes, ext);
      setState(() => _images.add(url));
    } catch (e) {
      setState(() => _error = 'تعذّر رفع الصورة: $e');
    }
  }

  List<String> _splitList(String s) =>
      s.split(RegExp('[،,]')).map((x) => x.trim()).where((x) => x.isNotEmpty).toList();

  Future<void> _save() async {
    final nameAr = _c['name_ar']!.text.trim();
    final price = int.tryParse(_c['price_egp']!.text.trim());
    if (nameAr.isEmpty || price == null) {
      setState(() => _error = 'الاسم والسعر مطلوبان');
      return;
    }
    final oldPrice = int.tryParse(_c['old_price']!.text.trim());
    final row = <String, dynamic>{
      'name_ar': nameAr,
      'name_en': _c['name_en']!.text.trim().isEmpty ? null : _c['name_en']!.text.trim(),
      'description': _c['description']!.text.trim().isEmpty ? null : _c['description']!.text.trim(),
      'price_egp': price,
      'old_price': oldPrice,
      'on_sale': _onSale,
      'gender': _gender,
      'type': _c['type']!.text.trim().isEmpty ? null : _c['type']!.text.trim(),
      'material': _c['material']!.text.trim().isEmpty ? null : _c['material']!.text.trim(),
      'colors': _splitList(_c['colors']!.text),
      'tags': _splitList(_c['tags']!.text),
      'stock': _c['stock']!.text.trim().isEmpty ? null : _c['stock']!.text.trim(),
      'lead_time': _c['lead_time']!.text.trim().isEmpty ? null : _c['lead_time']!.text.trim(),
      'sort': int.tryParse(_c['sort']!.text.trim()) ?? 0,
      'images': _images,
    };
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      if (widget.product != null) {
        await updateProductRow(widget.product!['id'] as String, row);
      } else {
        await createProductRow(row);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() {
        _saving = false;
        _error = '$e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: cream,
      appBar: AppBar(title: Text(widget.product != null ? 'تعديل منتج' : 'منتج جديد')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        children: [
          _field('name_ar', 'الاسم (عربي) *'),
          _field('name_en', 'الاسم (إنجليزي)'),
          _field('description', 'الوصف', maxLines: 3),
          Row(children: [
            Expanded(child: _field('price_egp', 'السعر (ج.م) *', number: true)),
            const SizedBox(width: 10),
            Expanded(child: _field('old_price', 'السعر قبل الخصم', number: true)),
          ]),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            activeColor: teal,
            title: const Text('عرض/خصم', style: TextStyle(fontSize: 14)),
            value: _onSale,
            onChanged: (v) => setState(() => _onSale = v),
          ),
          _label('النوع (للعميلة)'),
          DropdownButtonFormField<String>(
            initialValue: _gender,
            items: genders.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
            onChanged: (v) => setState(() => _gender = v ?? _gender),
          ),
          const SizedBox(height: 12),
          _field('type', 'الفئة (كارديجان كروشيه…)'),
          _field('material', 'الخامة'),
          _field('colors', 'الألوان (بينها فاصلة)'),
          _field('tags', 'وسوم (بينها فاصلة)'),
          _field('stock', 'التوفّر'),
          _field('lead_time', 'مدة التنفيذ'),
          _field('sort', 'الترتيب', number: true),
          const SizedBox(height: 8),
          _label('الصور'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ..._images.asMap().entries.map((e) => _thumb(e.key, e.value)),
            ],
          ),
          const SizedBox(height: 8),
          Row(children: [
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(foregroundColor: teal),
              onPressed: _pickImage,
              icon: const Icon(Icons.upload, size: 18),
              label: const Text('رفع صورة'),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _urlCtl,
                decoration: const InputDecoration(hintText: 'أو الصق رابط صورة'),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.add_circle, color: teal),
              onPressed: () {
                final v = _urlCtl.text.trim();
                if (v.isNotEmpty) setState(() { _images.add(v); _urlCtl.clear(); });
              },
            ),
          ]),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Color(0xFFA15B5B))),
          ],
          const SizedBox(height: 20),
          SizedBox(
            height: 52,
            child: FilledButton(
              style: FilledButton.styleFrom(backgroundColor: teal),
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(widget.product != null ? 'حفظ التعديلات' : 'إضافة المنتج',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _label(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 6, top: 4),
        child: Text(t, style: const TextStyle(fontSize: 12.5, color: Color(0xFF5A5245), fontWeight: FontWeight.w600)),
      );

  Widget _field(String key, String label, {bool number = false, int maxLines = 1}) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: TextField(
          controller: _c[key],
          maxLines: maxLines,
          keyboardType: number ? TextInputType.number : TextInputType.text,
          decoration: InputDecoration(labelText: label),
        ),
      );

  Widget _thumb(int i, String src) => Stack(
        clipBehavior: Clip.none,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(src, width: 64, height: 64, fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(width: 64, height: 64, color: const Color(0xFFF3EDE2))),
          ),
          Positioned(
            top: -6,
            right: -6,
            child: GestureDetector(
              onTap: () => setState(() => _images.removeAt(i)),
              child: Container(
                width: 22, height: 22,
                decoration: const BoxDecoration(color: accent, shape: BoxShape.circle),
                child: const Icon(Icons.close, size: 14, color: Colors.white),
              ),
            ),
          ),
        ],
      );
}
