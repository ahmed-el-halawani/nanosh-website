import 'package:flutter/material.dart';

import '../theme.dart';
import '../data/api.dart';
import '../data/constants.dart';
import '../data/progress.dart';

// Full per-item step editor in a bottom sheet. Mutates item['order_item_steps']
// in place and calls [onChanged] so the caller can refresh.
Future<void> openItemSheet(
  BuildContext context,
  Json item, {
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
  final Json item;
  final String? customer, phone;
  final VoidCallback? onChanged;
  const _ItemSheet({required this.item, this.customer, this.phone, this.onChanged});

  @override
  State<_ItemSheet> createState() => _ItemSheetState();
}

class _ItemSheetState extends State<_ItemSheet> {
  final _addCtl = TextEditingController();
  final _noteCtl = TextEditingController();
  bool _busy = false;

  List<Json> get _steps {
    widget.item['order_item_steps'] ??= <Json>[];
    return (widget.item['order_item_steps'] as List).cast<Json>();
  }

  List<Json> get _sorted =>
      _steps.toList()..sort((a, b) => (a['sort'] as int? ?? 0).compareTo(b['sort'] as int? ?? 0));

  @override
  void initState() {
    super.initState();
    _noteCtl.text = (widget.item['admin_note'] ?? '').toString();
  }

  @override
  void dispose() {
    _addCtl.dispose();
    _noteCtl.dispose();
    super.dispose();
  }

  void _changed() {
    setState(() {});
    widget.onChanged?.call();
  }

  Future<void> _toggle(Json s, bool v) async {
    final sorted = _sorted;
    final idx = sorted.indexWhere((x) => x['id'] == s['id']);
    if (v) {
      final prev = idx > 0 ? sorted[idx - 1] : null;
      if (prev != null && prev['done'] != true) {
        _snack('أكملي الخطوة السابقة أولاً');
        return;
      }
    } else {
      final next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
      if (next != null && next['done'] == true) {
        _snack('الغي الخطوة التالية أولاً');
        return;
      }
    }
    try {
      await updateItemStep(s['id'] as int, {'done': v});
      s['done'] = v;
      if (!v) {
        final later = sorted.sublist(idx + 1).where((x) => x['done'] == true).toList();
        await Future.wait(later.map((ls) async {
          await updateItemStep(ls['id'] as int, {'done': false});
          ls['done'] = false;
        }));
      }
      _changed();
    } catch (e) {
      _snack('تعذّر الحفظ: $e');
    }
  }

  Future<void> _move(Json s, bool up) async {
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

  Future<void> _delete(Json s) async {
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
    final readyStep = _steps.firstWhere((s) => s['key'] == 'ready', orElse: () => <String, dynamic>{});
    final sort = readyStep.isNotEmpty
        ? (readyStep['sort'] as int)
        : _steps.fold<int>(-1, (m, s) => (s['sort'] as int? ?? 0) > m ? s['sort'] as int : m) + 1;
    setState(() => _busy = true);
    try {
      final row = await addItemStep(widget.item['id'] as int, label, sort, null);
      if (readyStep.isNotEmpty) {
        await updateItemStep(readyStep['id'] as int, {'sort': (readyStep['sort'] as int) + 1});
        readyStep['sort'] = (readyStep['sort'] as int) + 1;
      }
      _steps.add(row);
      _addCtl.clear();
      _changed();
    } catch (e) {
      _snack('تعذّر الإضافة: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _saveNote() async {
    final val = _noteCtl.text.trim();
    if (val == (widget.item['admin_note'] ?? '').toString()) return;
    try {
      await updateOrderItem(widget.item['id'] as int, {'admin_note': val});
      widget.item['admin_note'] = val;
      _changed();
    } catch (e) {
      _snack('تعذّر حفظ الملاحظة: $e');
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
    final ip = itemProgress(it);
    final ipStyle = statusStyle(ip.currentKey);
    final note = (it['admin_note'] ?? '').toString();

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
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: src != null
                      ? Image.network(src, width: 110, height: 110, fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => _ph())
                      : _ph(),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(it['name'] ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: ink)),
                      if (widget.customer != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text('${widget.customer} · ${widget.phone ?? '—'}',
                              style: const TextStyle(fontSize: 13.5, color: muted)),
                        ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          if ((it['size'] ?? '').toString().isNotEmpty)
                            _Chip('المقاس: ${it['size']}', const Color(0xFFF3EDE2), const Color(0xFF5A5245)),
                          _Chip('الكمية: ${it['qty']}', const Color(0xFFE8F0EC), ink),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          _Chip(ip.currentLabel, Color(ipStyle.bg), Color(ipStyle.color)),
                          const SizedBox(width: 10),
                          Text('${ip.done} من ${ip.total} خطوات', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: muted)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if ((it['note'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 14),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: cream, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFEFE6D8))),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('ملاحظة العميلة', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: muted)),
                    const SizedBox(height: 4),
                    Text(it['note'], style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF5A5245), height: 1.55)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cream,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: note.isNotEmpty ? const Color(0xFFD5E5DF) : const Color(0xFFECE2D3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.edit_note, size: 17, color: Color(0xFF6A6155)),
                      SizedBox(width: 5),
                      Text('ملاحظة إدارية', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF6A6155))),
                    ],
                  ),
                  const SizedBox(height: 7),
                  TextField(
                    controller: _noteCtl,
                    maxLines: 3,
                    onTapOutside: (_) => _saveNote(),
                    onEditingComplete: () => _saveNote(),
                    decoration: const InputDecoration(
                      hintText: 'أضيفي ملاحظة خاصة لهذه القطعة…',
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(11)), borderSide: BorderSide.none),
                    ),
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: note.isNotEmpty ? FontWeight.w700 : FontWeight.w500,
                      color: note.isNotEmpty ? ink : muted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
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
                child: _busy
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('إضافة'),
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _stepRow(Json s, int idx, int count) {
    final done = s['done'] == true;
    final key = s['key'] as String?;
    final isConfirming = key == 'confirming';
    final isReady = key == 'ready';
    final nextIsReady = idx < count - 1 && _sorted[idx + 1]['key'] == 'ready';
    final locked = isConfirming || key == 'received';
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
            onChanged: locked ? null : (v) => _toggle(s, v ?? false),
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
                if (locked)
                  Text(isConfirming ? 'يُتحكم به من حالة الطلب' : 'مُنجز تلقائيًا',
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFFA99E8E))),
              ],
            ),
          ),
          if (!locked) ...[
            IconButton(
              visualDensity: VisualDensity.compact,
              icon: const Icon(Icons.keyboard_arrow_up, size: 22),
              color: muted,
              onPressed: idx > 0 && !isReady ? () => _move(s, true) : null,
            ),
            IconButton(
              visualDensity: VisualDensity.compact,
              icon: const Icon(Icons.keyboard_arrow_down, size: 22),
              color: muted,
              onPressed: idx < count - 1 && !nextIsReady ? () => _move(s, false) : null,
            ),
            IconButton(
              visualDensity: VisualDensity.compact,
              icon: const Icon(Icons.delete_outline, size: 20),
              color: const Color(0xFFC0A999),
              onPressed: () => _delete(s),
            ),
          ],
        ],
      ),
    );
  }

  Widget _ph() => Container(width: 110, height: 110, color: const Color(0xFFF3EDE2), child: const Icon(Icons.image, color: Color(0xFFD9CDB9)));
}

class _Chip extends StatelessWidget {
  final String text;
  final Color bg, fg;
  const _Chip(this.text, this.bg, this.fg);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
        child: Text(text, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: fg)),
      );
}
