import 'package:flutter/material.dart';

import '../theme.dart';
import '../data/api.dart';
import '../data/constants.dart';
import '../data/progress.dart';
import '../widgets/item_sheet.dart';

class BoardScreen extends StatefulWidget {
  const BoardScreen({super.key});
  @override
  State<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends State<BoardScreen> {
  List<Json> _orders = [];
  bool _loading = true;
  String? _error;
  String _filter = 'الكل';
  // Items advanced this session -> the label they held when ticked.
  final Map<int, String> _advanced = {};

  static const _order = ['تأكيد التفاصيل', 'تجهيز الخامة', 'جاري التنفيذ', 'جاهزة للتسليم'];

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

  List<Json> _allItems() => _orders.expand<Json>((o) {
        final items = (o['order_items'] as List?)?.cast<Json>() ?? const [];
        return items.map((it) => {
              ...it,
              'order_id': o['id'],
              'customer': o['profiles']?['name'] ?? 'عميلة',
              'phone': o['profiles']?['phone'] ?? '—',
            });
      }).toList();

  String _displayLabel(Json it) => _advanced[it['id']] ?? itemProgress(it).currentLabel;
  bool _ticked(Json it) => _advanced.containsKey(it['id']);

  List<String> _chips() {
    final labels = _allItems().map(_displayLabel).toSet();
    final head = _order.where(labels.contains).toList();
    final rest = labels.where((l) => !_order.contains(l)).toList()..sort();
    return ['الكل', ...head, ...rest];
  }

  List<Json> _filtered() =>
      _filter == 'الكل' ? _allItems() : _allItems().where((it) => _displayLabel(it) == _filter).toList();

  Future<void> _advance(Json it) async {
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
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('تعذّر التحديث: $e')));
      }
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
      child: LayoutBuilder(
        builder: (context, constraints) {
          final cross = _crossAxisCount(constraints.maxWidth);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: 50,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                  itemCount: chips.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => _chip(chips[i]),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Text.rich(TextSpan(children: [
                  const TextSpan(text: 'عدد القطع المعروضة: ', style: TextStyle(fontSize: 12, color: muted)),
                  TextSpan(text: '${items.length}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: teal)),
                ])),
              ),
              Expanded(
                child: items.isEmpty
                    ? const Center(child: Text('لا توجد قطع مطابقة', style: TextStyle(color: muted)))
                    : GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: cross,
                          childAspectRatio: 1,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                        ),
                        itemCount: items.length,
                        itemBuilder: (_, i) => _itemCard(items[i]),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  int _crossAxisCount(double width) {
    if (width >= 1200) return 5;
    if (width >= 900) return 4;
    if (width >= 640) return 3;
    if (width >= 360) return 2;
    return 2;
  }

  Widget _chip(String c) {
    final on = c == _filter;
    return GestureDetector(
      onTap: () => setState(() => _filter = c),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
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

  Widget _itemCard(Json it) {
    final ip = itemProgress(it);
    final ticked = _ticked(it);
    final images = (it['products']?['images'] as List?)?.cast<String>() ?? const [];
    final src = images.isNotEmpty ? images.first : null;
    final done = ip.complete || ticked;
    final label = done ? 'تم' : ip.currentLabel;
    final statusKey = done ? 'ready' : ip.currentKey;
    final style = statusStyle(statusKey);
    final adminNote = (it['admin_note'] ?? '').toString();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: line),
        boxShadow: const [BoxShadow(color: Color(0x103C2814), blurRadius: 8, offset: Offset(0, 2))],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => openItemSheet(context, it,
            customer: it['customer'], phone: it['phone']?.toString(), onChanged: () => setState(() {})),
        child: Stack(
          fit: StackFit.expand,
          children: [
            src != null
                ? Image.network(src, fit: BoxFit.cover, errorBuilder: (context, error, stackTrace) => _ph())
                : _ph(),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black.withOpacity(0.82), Colors.black.withOpacity(0.35), Colors.transparent],
                ),
              ),
            ),
            Positioned(
              top: 10, left: 10, right: 10,
              child: Row(
                textDirection: TextDirection.rtl,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(color: Color(style.bg), borderRadius: BorderRadius.circular(9)),
                    child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(style.color))),
                  ),
                  const Spacer(),
                  done
                      ? Container(
                          width: 34, height: 34,
                          decoration: BoxDecoration(color: const Color(0xFFE8F0EC), borderRadius: BorderRadius.circular(10)),
                          child: const Icon(Icons.check, color: teal, size: 20))
                      : SizedBox(
                          width: 34, height: 34,
                          child: Checkbox(
                            value: false,
                            activeColor: teal,
                            side: const BorderSide(color: Colors.white, width: 2),
                            onChanged: (_) => _advance(it),
                          ),
                        ),
                ],
              ),
            ),
            Positioned(
              bottom: 0, left: 0, right: 0,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(it['name'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white)),
                    const SizedBox(height: 3),
                    Text('${it['customer']} · ${it['phone']}', maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11.5, color: Colors.white70)),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        Text('الكمية: ${it['qty']} · ${ip.done}/${ip.total}',
                            style: const TextStyle(fontSize: 11.5, color: Colors.white70)),
                        if (adminNote.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.18), borderRadius: BorderRadius.circular(7)),
                            child: const Text('ملاحظة', style: TextStyle(fontSize: 11, color: Colors.white70)),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _ph() => Container(color: const Color(0xFFF3EDE2), child: const Icon(Icons.image, color: Color(0xFFD9CDB9)));
}
