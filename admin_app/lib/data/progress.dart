import 'constants.dart';

typedef Row = Map<String, dynamic>;

List<Row> _steps(dynamic v) => ((v as List?) ?? const []).cast<Row>();

int _sortCmp(Row a, Row b) => (a['sort'] as int? ?? 0).compareTo(b['sort'] as int? ?? 0);

class AreaProgress {
  final AreaDef def;
  final List<Row> steps;
  final int done;
  final int total;
  final bool complete;
  AreaProgress(this.def, this.steps, this.done, this.total, this.complete);
  String get name => def.name;
  String get key => def.key;
}

class OrderProgress {
  final List<AreaProgress> areas;
  final String currentKey;
  final String label;
  final int done;
  final int total;
  OrderProgress(this.areas, this.currentKey, this.label, this.done, this.total);
}

// Order-level status derived from area-grouped order_steps.
OrderProgress orderProgress(Row order) {
  final all = _steps(order['order_steps']);
  final areas = orderAreas.map((a) {
    final steps = all.where((s) => (s['area'] ?? 'received') == a.key).toList()..sort(_sortCmp);
    final done = steps.where((s) => s['done'] == true).length;
    return AreaProgress(a, steps, done, steps.length, steps.isNotEmpty && done == steps.length);
  }).toList();
  final current = areas.where((a) => !a.complete).cast<AreaProgress?>().firstWhere((_) => true, orElse: () => null);
  final key = current?.key ?? 'done';
  return OrderProgress(
    areas,
    key,
    statusLabel[key] ?? '—',
    all.where((s) => s['done'] == true).length,
    all.length,
  );
}

class ItemProgress {
  final List<Row> steps;
  final Row? current;
  final String currentLabel;
  final int done;
  final int total;
  final bool complete;
  ItemProgress(this.steps, this.current, this.currentLabel, this.done, this.total, this.complete);
}

// Per-item linear progress from order_item_steps.
ItemProgress itemProgress(Row item) {
  final steps = _steps(item['order_item_steps']).toList()..sort(_sortCmp);
  Row? current;
  for (final s in steps) {
    if (s['done'] != true) {
      current = s;
      break;
    }
  }
  final complete = steps.isNotEmpty && steps.every((s) => s['done'] == true);
  final done = steps.where((s) => s['done'] == true).length;
  return ItemProgress(
    steps,
    current,
    complete ? 'مكتمل' : (current?['label'] as String? ?? '—'),
    done,
    steps.length,
    complete,
  );
}
