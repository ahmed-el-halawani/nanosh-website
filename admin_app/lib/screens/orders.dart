import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme.dart';
import '../data/api.dart';
import '../data/constants.dart';
import '../data/progress.dart';
import '../widgets/item_sheet.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late Future<List<Json>> _future;

  @override
   void initState() {
    super.initState();
    _future = getAllOrders();
  }

  Future<void> _reload() async => setState(() => _future = getAllOrders());

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Json>>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: teal));
        }
        if (snap.hasError) return Center(child: Text('خطأ: ${snap.error}', style: const TextStyle(color: muted)));
        final orders = snap.data ?? [];
        if (orders.isEmpty) return const Center(child: Text('لا توجد طلبات بعد', style: TextStyle(color: muted)));
        return RefreshIndicator(
          color: teal,
          onRefresh: _reload,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final cross = _crossAxisCount(constraints.maxWidth);
              return GridView.builder(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: cross,
                  childAspectRatio: 1,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: orders.length,
                itemBuilder: (_, i) => _orderCard(orders[i]),
              );
            },
          ),
        );
      },
    );
  }

  int _crossAxisCount(double width) {
    if (width >= 1200) return 5;
    if (width >= 900) return 4;
    if (width >= 600) return 3;
    if (width >= 360) return 2;
    return 2;
  }

  Widget _orderCard(Json o) {
    final p = orderProgress(o);
    final count = ((o['order_items'] as List?)?.cast<Json>() ?? const [])
        .fold<int>(0, (n, it) => n + (it['qty'] as int? ?? 0));
    final style = statusStyle(p.currentKey);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () async {
        await Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderDetailPage(order: o)));
        _reload();
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: line),
          boxShadow: const [BoxShadow(color: Color(0x103C2814), blurRadius: 8, offset: Offset(0, 2))],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(height: 6, color: Color(style.color)),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 13, 12, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: Color(style.bg),
                              borderRadius: BorderRadius.circular(9),
                            ),
                            child: Text(p.label,
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(style.color))),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(fmt(o['total_estimate'] as num?),
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: teal)),
                      ],
                    ),
                    const Spacer(),
                    Text('طلب #${o['id']}',
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: ink, height: 1.25)),
                    const SizedBox(height: 5),
                    Text('${o['profiles']?['name'] ?? 'عميلة'} · ${o['profiles']?['phone'] ?? '—'}',
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12.5, color: muted)),
                    const SizedBox(height: 4),
                    Text('${_date(o['created_at'])} · $count قطعة',
                        style: const TextStyle(fontSize: 12, color: Color(0xFFA99E8E))),
                    const SizedBox(height: 8),
                    Text('المهام المنجزة: ${p.done}/${p.total}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: muted)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _date(dynamic iso) {
  try {
    final d = DateTime.parse(iso).toLocal();
    return '${d.day}/${d.month}';
  } catch (_) {
    return '';
  }
}

// ------------------------- Order detail -------------------------
class OrderDetailPage extends StatefulWidget {
  final Json order;
  const OrderDetailPage({super.key, required this.order});
  @override
  State<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<OrderDetailPage> {
  final _addCtl = <String, TextEditingController>{};
  final _noteCtls = <int, TextEditingController>{};

  Json get _o => widget.order;
  List<Json> get _steps {
    _o['order_steps'] ??= <Json>[];
    return (_o['order_steps'] as List).cast<Json>();
  }

  List<Json> get _items => (_o['order_items'] as List?)?.cast<Json>() ?? const [];

  @override
  void dispose() {
    for (final c in _addCtl.values) {
      c.dispose();
    }
    for (final c in _noteCtls.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _ctl(String area) => _addCtl.putIfAbsent(area, () => TextEditingController());
  TextEditingController _noteCtl(Json it) => _noteCtls.putIfAbsent(it['id'] as int, () {
        return TextEditingController(text: (it['admin_note'] ?? '').toString());
      });

  Future<void> _wa() async {
    final phone = _o['profiles']?['phone'];
    final uri = (phone != null && '$phone'.isNotEmpty) ? waTo('$phone') : waLink('');
    if (await canLaunchUrl(uri)) launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _toggle(Json s, bool v) async {
    try {
      await updateOrderStep(s['id'] as int, {'done': v});
      s['done'] = v;
      setState(() {});
    } catch (e) {
      _snack('تعذّر الحفظ: $e');
    }
  }

  Future<void> _move(Json s, bool up) async {
    final area = s['area'] ?? 'received';
    final areaSteps = _steps.where((x) => (x['area'] ?? 'received') == area).toList()
      ..sort((a, b) => (a['sort'] as int).compareTo(b['sort'] as int));
    final idx = areaSteps.indexWhere((x) => x['id'] == s['id']);
    final swap = up ? (idx > 0 ? areaSteps[idx - 1] : null) : (idx < areaSteps.length - 1 ? areaSteps[idx + 1] : null);
    if (swap == null) return;
    final a = s['sort'] as int, b = swap['sort'] as int;
    try {
      await updateOrderStep(s['id'] as int, {'sort': b});
      await updateOrderStep(swap['id'] as int, {'sort': a});
      s['sort'] = b;
      swap['sort'] = a;
      setState(() {});
    } catch (e) {
      _snack('تعذّر إعادة الترتيب: $e');
    }
  }

  Future<void> _delete(Json s) async {
    try {
      await deleteOrderStep(s['id'] as int);
      _steps.removeWhere((x) => x['id'] == s['id']);
      setState(() {});
    } catch (e) {
      _snack('تعذّر الحذف: $e');
    }
  }

  Future<void> _add(String area) async {
    final label = _ctl(area).text.trim();
    if (label.isEmpty) return;
    final areaSteps = _steps.where((x) => (x['area'] ?? 'received') == area);
    final sort = areaSteps.fold<int>(-1, (m, s) => (s['sort'] as int? ?? 0) > m ? s['sort'] as int : m) + 1;
    try {
      final row = await addOrderStep(_o['id'] as int, label, sort, area);
      _steps.add(row);
      _ctl(area).clear();
      setState(() {});
    } catch (e) {
      _snack('تعذّر الإضافة: $e');
    }
  }

  Future<void> _saveNote(Json it) async {
    final ctl = _noteCtl(it);
    final val = ctl.text.trim();
    if (val == (it['admin_note'] ?? '').toString()) return;
    try {
      await updateOrderItem(it['id'] as int, {'admin_note': val});
      it['admin_note'] = val;
      _snack('تم حفظ الملاحظة');
    } catch (e) {
      _snack('تعذّر حفظ الملاحظة: $e');
    }
  }

  void _snack(String m) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));

  @override
  Widget build(BuildContext context) {
    final p = orderProgress(_o);
    return Scaffold(
      backgroundColor: cream,
      appBar: AppBar(title: Text('طلب #${_o['id']}')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_o['profiles']?['name'] ?? 'عميلة',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: ink)),
                    Text('${_o['profiles']?['phone'] ?? '—'}', style: const TextStyle(fontSize: 13, color: muted)),
                  ],
                ),
              ),
              Text(fmt(_o['total_estimate'] as num?),
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: teal)),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 44,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF25D366)),
              onPressed: _wa,
              icon: const Icon(Icons.chat, size: 18),
              label: const Text('تواصل مع العميلة عبر واتساب'),
            ),
          ),
          const SizedBox(height: 18),
          const _SectionTitle('القطع ومراحلها'),
          const Text('اضغطي على القطعة لإدارة خطواتها', style: TextStyle(fontSize: 12, color: muted)),
          const SizedBox(height: 8),
          ..._items.map((it) => _itemRow(it)),
          const SizedBox(height: 20),
          const _SectionTitle('مهام الطلب العامة'),
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 8),
            child: _StatusPill(p.currentKey, p.label),
          ),
          ...p.areas.map(_areaCard),
        ],
      ),
    );
  }

  Widget _itemRow(Json it) {
    final ip = itemProgress(it);
    final ipStyle = statusStyle(ip.currentKey);
    final images = (it['products']?['images'] as List?)?.cast<String>() ?? const [];
    final src = images.isNotEmpty ? images.first : null;
    final adminNote = (it['admin_note'] ?? '').toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: line)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => openItemSheet(context, it,
            customer: _o['profiles']?['name'], phone: _o['profiles']?['phone']?.toString(), onChanged: () => setState(() {})),
        child: Padding(
          padding: const EdgeInsets.all(13),
          child: Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: src != null
                        ? Image.network(src, width: 72, height: 72, fit: BoxFit.cover, errorBuilder: (context, error, stackTrace) => _ph())
                        : _ph(),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(it['name'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: ink)),
                            ),
                            const Icon(Icons.chevron_left, color: muted, size: 20),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 7,
                          runSpacing: 6,
                          children: [
                            if ((it['size'] ?? '').toString().isNotEmpty)
                              _Chip('المقاس: ${it['size']}', const Color(0xFFF3EDE2), const Color(0xFF5A5245)),
                            _Chip('الكمية: ${it['qty']}', const Color(0xFFE8F0EC), ink),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(color: Color(0xFFF7F2E9), height: 1),
              const SizedBox(height: 10),
              Row(
                children: [
                  _Chip(ip.currentLabel, Color(ipStyle.bg), Color(ipStyle.color)),
                  const SizedBox(width: 10),
                  Text('${ip.done} من ${ip.total} خطوات', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: muted)),
                ],
              ),
              if ((it['note'] ?? '').toString().isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: cream, borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFEFE6D8))),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ملاحظة العميلة', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: muted)),
                      const SizedBox(height: 3),
                      Text(it['note'], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF5A5245), height: 1.5)),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(color: cream, borderRadius: BorderRadius.circular(12), border: Border.all(color: adminNote.isNotEmpty ? const Color(0xFFD5E5DF) : const Color(0xFFECE2D3))),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.edit_note, size: 16, color: Color(0xFF6A6155)),
                        SizedBox(width: 5),
                        Text('ملاحظة إدارية', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF6A6155))),
                      ],
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _noteCtl(it),
                      onTapOutside: (_) => _saveNote(it),
                      onEditingComplete: () => _saveNote(it),
                      maxLines: 2,
                      decoration: const InputDecoration(
                        hintText: 'أضيفي ملاحظة خاصة لهذه القطعة…',
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: EdgeInsets.symmetric(horizontal: 11, vertical: 9),
                        border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10)), borderSide: BorderSide.none),
                      ),
                      style: TextStyle(fontSize: 14.5, fontWeight: adminNote.isNotEmpty ? FontWeight.w700 : FontWeight.w500, color: adminNote.isNotEmpty ? ink : muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _areaCard(AreaProgress a) {
    final isPreparing = a.key == 'preparing';
    final partial = isPreparing && a.done > 0 && a.done < a.total;
    final pill = a.complete
        ? const _Pill('مكتمل', Color(0xFFE8F0EC), teal)
        : (a.total > 0 && a.done > 0)
            ? const _Pill('جاري', Color(0xFFFFF6E6), statusYellow)
            : const _Pill('بانتظار', Color(0xFFF3EDE2), muted);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: line)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(a.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: ink))),
              Text('${a.done}/${a.total}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: muted)),
              const SizedBox(width: 8),
              pill,
            ],
          ),
          const SizedBox(height: 6),
          ...a.steps.asMap().entries.map((e) => _stepRow(e.value, e.key, a.steps.length, isPreparing, partial)),
          if (!isPreparing) ...[
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: TextField(
                  controller: _ctl(a.key),
                  decoration: const InputDecoration(hintText: '＋ أضيفي مهمة…', isDense: true),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: teal, padding: const EdgeInsets.symmetric(horizontal: 14)),
                onPressed: () => _add(a.key),
                child: const Text('إضافة'),
              ),
            ]),
          ],
        ],
      ),
    );
  }

  Widget _stepRow(Json s, int idx, int count, bool isPreparingArea, bool partial) {
    final done = s['done'] == true;
    return Row(
      children: [
        isPreparingArea
            ? Container(
                width: 28, height: 28,
                margin: const EdgeInsets.symmetric(horizontal: 6),
                decoration: BoxDecoration(
                  color: done ? teal : (partial ? statusYellow : Colors.white),
                  border: Border.all(color: done ? teal : statusYellow, width: 2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: done
                    ? const Icon(Icons.check, color: Colors.white, size: 18)
                    : partial
                        ? const Icon(Icons.remove, color: Colors.white, size: 18)
                        : null,
              )
            : Checkbox(value: done, activeColor: teal, onChanged: (v) => _toggle(s, v ?? false)),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(s['label'] ?? '',
                  style: TextStyle(fontSize: 14, fontWeight: done ? FontWeight.w700 : FontWeight.w500, color: done ? ink : const Color(0xFF5A5245))),
              if ((s['note'] ?? '').toString().isNotEmpty)
                Text(s['note'], style: const TextStyle(fontSize: 11.5, color: Color(0xFFA99E8E))),
            ],
          ),
        ),
        if (!isPreparingArea) ...[
          IconButton(visualDensity: VisualDensity.compact, icon: const Icon(Icons.keyboard_arrow_up, size: 20), color: muted, onPressed: idx > 0 ? () => _move(s, true) : null),
          IconButton(visualDensity: VisualDensity.compact, icon: const Icon(Icons.keyboard_arrow_down, size: 20), color: muted, onPressed: idx < count - 1 ? () => _move(s, false) : null),
          IconButton(visualDensity: VisualDensity.compact, icon: const Icon(Icons.delete_outline, size: 19), color: const Color(0xFFC0A999), onPressed: () => _delete(s)),
        ],
      ],
    );
  }

  Widget _ph() => Container(width: 72, height: 72, color: const Color(0xFFF3EDE2), child: const Icon(Icons.image, color: Color(0xFFD9CDB9)));
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);
  @override
  Widget build(BuildContext context) =>
      Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF3A4A45)));
}

class _Pill extends StatelessWidget {
  final String text;
  final Color bg, fg;
  const _Pill(this.text, this.bg, this.fg);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(9)),
        child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
      );
}

class _Chip extends StatelessWidget {
  final String text;
  final Color bg, fg;
  const _Chip(this.text, this.bg, this.fg);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(9)),
        child: Text(text, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: fg)),
      );
}

class _StatusPill extends StatelessWidget {
  final String statusKey;
  final String label;
  const _StatusPill(this.statusKey, this.label);
  @override
  Widget build(BuildContext context) {
    final style = statusStyle(statusKey);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: Color(style.bg), borderRadius: BorderRadius.circular(11)),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(style.color))),
    );
  }
}
