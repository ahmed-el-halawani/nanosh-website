import 'package:flutter/material.dart';

import '../theme.dart';
import '../data/api.dart';
import '../data/progress.dart';
import '../widgets/item_sheet.dart';

class BoardScreen extends StatefulWidget {
  const BoardScreen({super.key});
  @override
  State<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends State<BoardScreen> {
  List<Row> _orders = [];
  bool _loading = true;
  String? _error;
  String _filter = 'الكل';
  // Items advanced this session -> the label they held when ticked (keeps them in the current filter).
  final Map<int, String> _advanced = {};

  static const _order = ['استلمنا طلبك', 'تأكيد التفاصيل', 'تجهيز الخامة', 'جاري التنفيذ', 'جاهز للشحن'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _orders = await getAllOrders();
    } catch (e) {
      _error = '$e';
    }
    if (mounted) setState(() => _loading = false);
  }

  List<Row> _allItems() => _orders.expand<Row>((o) {
        final items = (o['order_items'] as List?)?.cast<Row>() ?? const [];
        return items.map((it) => {
              ...it,
              'order_id': o['id'],
              'customer': o['profiles']?['name'] ?? 'عميلة',
              'phone': o['profiles']?['phone'] ?? '—',
            });
      }).toList();

  String _displayLabel(Row it) => _advanced[it['id']] ?? itemProgress(it).currentLabel;
  bool _ticked(Row it) => _advanced.containsKey(it['id']);

  List<String> _chips() {
    final labels = _allItems().map(_displayLabel).toSet();
    final head = _order.where(labels.contains).toList();
    final rest = labels.where((l) => !_order.contains(l)).toList()..sort();
    return ['الكل', ...head, ...rest];
  }

  List<Row> _filtered() =>
      _filter == 'الكل' ? _allItems() : _allItems().where((it) => _displayLabel(it) == _filter).toList();

  Future<void> _advance(Row it) async {
    final ip = itemProgress(it);
    final cur = ip.current;
    if (cur == null) return;
    final prev = cur['label'] as String;
    try {
      await updateItemStep(cur['id'] as int, {'done': true});
      cur['done'] = true;
      _advanced[it['id'] as int] = prev;
      setState(() {});
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('تعذّر التحديث: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: teal));
    if (_error != null) return Center(child: Text('خطأ: $_error', style: const TextStyle(color: muted)));

    final items = _filtered();
    final chips = _chips();

    return RefreshIndicator(
      color: teal,
      onRefresh: () async {
        _advanced.clear();
        await _load();
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 84),
              child: Wrap(
                direction: Axis.vertical,
                spacing: 8,
                runSpacing: 8,
                children: chips.map(_chip).toList(),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text.rich(TextSpan(children: [
            const TextSpan(text: 'عدد القطع: ', style: TextStyle(fontSize: 12, color: muted)),
            TextSpan(text: '${items.length}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: teal)),
          ])),
          const SizedBox(height: 12),
          if (items.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 50),
              child: Center(child: Text('لا توجد قطع مطابقة', style: TextStyle(color: muted))),
            )
          else
            ...items.map(_itemCard),
        ],
      ),
    );
  }

  Widget _chip(String c) {
    final on = c == _filter;
    return GestureDetector(
      onTap: () => setState(() => _filter = c),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 7),
        decoration: BoxDecoration(
          color: on ? teal : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: on ? teal : const Color(0xFFE7DDCE)),
        ),
        child: Text(c,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: on ? Colors.white : const Color(0xFF6A6155))),
      ),
    );
  }

  Widget _itemCard(Row it) {
    final ip = itemProgress(it);
    final ticked = _ticked(it);
    final images = (it['products']?['images'] as List?)?.cast<String>() ?? const [];
    final src = images.isNotEmpty ? images.first : null;
    final done = ip.complete || ticked;
    final label = ticked ? 'تم' : ip.currentLabel;
    final opts = [
      if ((it['size'] ?? '').toString().isNotEmpty) 'مقاس ${it['size']}',
      if ((it['note'] ?? '').toString().isNotEmpty) it['note'],
    ].join(' · ');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: line)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => openItemSheet(context, it,
            customer: it['customer'], phone: it['phone']?.toString(), onChanged: () => setState(() {})),
        child: Padding(
          padding: const EdgeInsets.all(11),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: src != null
                    ? Image.network(src, width: 58, height: 58, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _ph())
                    : _ph(),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(it['name'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF2C3F3B))),
                    Padding(
                      padding: const EdgeInsets.only(top: 3),
                      child: Text('${it['customer']} · ${it['phone']}', style: const TextStyle(fontSize: 12, color: muted)),
                    ),
                    Text(opts.isEmpty ? 'الكمية: ${it['qty']}' : '$opts · الكمية: ${it['qty']}',
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11.5, color: Color(0xFF6A6155))),
                    const SizedBox(height: 7),
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                            color: done ? const Color(0xFFE8F0EC) : const Color(0xFFFBEEEE),
                            borderRadius: BorderRadius.circular(9)),
                        child: Text(label,
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: done ? teal : accent)),
                      ),
                      const SizedBox(width: 8),
                      Text('${ip.done}/${ip.total}', style: const TextStyle(fontSize: 11, color: Color(0xFFA99E8E))),
                    ]),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              done
                  ? Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(color: const Color(0xFFE8F0EC), borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.check, color: teal))
                  : SizedBox(
                      width: 42, height: 42,
                      child: Checkbox(
                        value: false,
                        activeColor: teal,
                        onChanged: (_) => _advance(it),
                      ),
                    ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _ph() => Container(width: 58, height: 58, color: const Color(0xFFF3EDE2), child: const Icon(Icons.image, color: Color(0xFFD9CDB9)));
}
