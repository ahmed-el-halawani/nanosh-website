import 'package:flutter/material.dart';

import '../theme.dart';
import '../data/api.dart';

// Full per-item step editor in a bottom sheet. Mutates item['order_item_steps']
// in place and calls [onChanged] so the caller can refresh.
Future<void> openItemSheet(
  BuildContext context,
  Row item, {
  String? customer,
  String? phone,
  VoidCallback? onChanged,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: cream,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
    ),
    builder: (_) => _ItemSheet(item: item, customer: customer, phone: phone, onChanged: onChanged),
  );
}

class _ItemSheet extends StatefulWidget {
  final Row item;
  final String? customer, phone;
  final VoidCallback? onChanged;
  const _ItemSheet({required this.item, this.customer, this.phone, this.onChanged});

  @override
  State<_ItemSheet> createState() => _ItemSheetState();
}

class _ItemSheetState extends State<_ItemSheet> {
  final _addCtl = TextEditingController();
  bool _busy = false;

  List<Row> get _steps {
    widget.item['order_item_steps'] ??= <Row>[];
    return (widget.item['order_item_steps'] as List).cast<Row>();
  }

  List<Row> get _sorted =>
      _steps.toList()..sort((a, b) => (a['sort'] as int? ?? 0).compareTo(b['sort'] as int? ?? 0));

  @override
  void dispose() {
    _addCtl.dispose();
    super.dispose();
  }

  void _changed() {
    setState(() {});
    widget.onChanged?.call();
  }

  Future<void> _toggle(Row s, bool v) async {
    try {
      await updateItemStep(s['id'] as int, {'done': v});
      s['done'] = v;
      _changed();
    } catch (e) {
      _snack('تعذّر الحفظ: $e');
    }
  }

  Future<void> _move(Row s, bool up) async {
    final sorted = _sorted;
    final idx = sorted.indexWhere((x) => x['id'] == s['id']);
    final swap = up ? (idx > 0 ? sorted[idx - 1] : null) : (idx < sorted.length - 1 ? sorted[idx + 1] : null);
    if (swap == null) return;
    final a = s['sort'] as int;
    final b = swap['sort'] as int;
    try {
      await updateItemStep(s['id'] as int, {'sort': b});
      await updateItemStep(swap['id'] as int, {'sort': a});
      s['sort'] = b;
      swap['sort'] = a;
      _changed();
    } catch (e) {
      _snack('تعذّر إعادة الترتيب: $e');
    }
  }

  Future<void> _delete(Row s) async {
    try {
      await deleteItemStep(s['id'] as int);
      _steps.removeWhere((x) => x['id'] == s['id']);
      _changed();
    } catch (e) {
      _snack('تعذّر الحذف: $e');
    }
  }

  Future<void> _add() async {
    final label = _addCtl.text.trim();
    if (label.isEmpty) return;
    final maxSort = _steps.fold<int>(-1, (m, s) => (s['sort'] as int? ?? 0) > m ? s['sort'] as int : m);
    setState(() => _busy = true);
    try {
      final row = await addItemStep(widget.item['id'] as int, label, maxSort + 1, null);
      _steps.add(row);
      _addCtl.clear();
      _changed();
    } catch (e) {
      _snack('تعذّر الإضافة: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String m) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  @override
  Widget build(BuildContext context) {
    final it = widget.item;
    final images = (it['products']?['images'] as List?)?.cast<String>() ?? const [];
    final src = images.isNotEmpty ? images.first : null;
    final sorted = _sorted;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.85,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        builder: (context, scroll) => ListView(
          controller: scroll,
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
          children: [
            Center(
              child: Container(
                width: 40, height: 5,
                decoration: BoxDecoration(color: const Color(0xFFDDD0BD), borderRadius: BorderRadius.circular(3)),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: src != null
                      ? Image.network(src, width: 90, height: 90, fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _ph())
                      : _ph(),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(it['name'] ?? '', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: ink)),
                      if (widget.customer != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text('${widget.customer} · ${widget.phone ?? '—'}',
                              style: const TextStyle(fontSize: 13, color: muted)),
                        ),
                      if ((it['size'] ?? '').toString().isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text('المقاس: ${it['size']}',
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: teal)),
                        ),
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text('الكمية: ${it['qty']}', style: const TextStyle(fontSize: 14, color: Color(0xFF6A6155))),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if ((it['note'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: line)),
                child: Text(it['note'], style: const TextStyle(fontSize: 15, color: Color(0xFF5A5245), height: 1.5)),
              ),
            ],
            const SizedBox(height: 18),
            const Text('خطوات التنفيذ', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF3A4A45))),
            const SizedBox(height: 6),
            ...sorted.asMap().entries.map((e) => _stepRow(e.value, e.key, sorted.length)),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _addCtl,
                  decoration: const InputDecoration(hintText: '＋ أضيفي خطوة مخصصة…'),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: teal),
                onPressed: _busy ? null : _add,
                child: const Text('إضافة'),
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _stepRow(Row s, int idx, int count) {
    final done = s['done'] == true;
    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFF7F2E9))),
      ),
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Checkbox(
            value: done,
            activeColor: teal,
            onChanged: (v) => _toggle(s, v ?? false),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s['label'] ?? '',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: done ? FontWeight.w700 : FontWeight.w600,
                        color: done ? ink : const Color(0xFF5A5245))),
                if ((s['note'] ?? '').toString().isNotEmpty)
                  Text(s['note'], style: const TextStyle(fontSize: 13, color: Color(0xFFA99E8E))),
              ],
            ),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            icon: const Icon(Icons.keyboard_arrow_up, size: 22),
            color: muted,
            onPressed: idx > 0 ? () => _move(s, true) : null,
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            icon: const Icon(Icons.keyboard_arrow_down, size: 22),
            color: muted,
            onPressed: idx < count - 1 ? () => _move(s, false) : null,
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            icon: const Icon(Icons.delete_outline, size: 20),
            color: const Color(0xFFC0A999),
            onPressed: () => _delete(s),
          ),
        ],
      ),
    );
  }

  Widget _ph() => Container(width: 90, height: 90, color: const Color(0xFFF3EDE2), child: const Icon(Icons.image, color: Color(0xFFD9CDB9)));
}
