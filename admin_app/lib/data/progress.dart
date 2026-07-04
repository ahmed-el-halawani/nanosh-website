import 'constants.dart';
import 'api.dart' show Json;

List<Json> _steps(dynamic v) => ((v as List?) ?? const []).cast<Json>();

int _sortCmp(Json a, Json b) => (a['sort'] as int? ?? 0).compareTo(b['sort'] as int? ?? 0);

class AreaProgress {
  final AreaDef def;
  final List<Json> steps;
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
  final int itemsReady;
  final int totalItems;
  OrderProgress(this.areas, this.currentKey, this.label, this.done, this.total,
      {this.itemsReady = 0, this.totalItems = 0});
}

// Order-level status derived from area-grouped order_steps.
OrderProgress orderProgress(Json order) {
  final all = _steps(order['order_steps']);
  final items = _steps(order['order_items']);
  final totalItems = items.length;
  final itemsReady = items.where((it) => itemProgress(it).complete).length;

  final areas = orderAreas.map((a) {
    final steps = all.where((s) => (s['area'] ?? 'received') == a.key).toList()..sort(_sortCmp);
    int done = steps.where((s) => s['done'] == true).length;
    int total = steps.length;
    // ponytail: preparing tracks item readiness, not sub-step count.
    if (a.key == 'preparing' && totalItems > 0) {
      done = itemsReady;
      total = totalItems;
    }
    return AreaProgress(a, steps, done, total, total > 0 && done == total);
  }).toList();

  AreaProgress? firstIncomplete;
  for (final a in areas) {
    if (!a.complete) {
      firstIncomplete = a;
      break;
    }
  }

  String key = firstIncomplete?.key ?? 'done';
  final preparingArea = areas.firstWhere((a) => a.key == 'preparing');
  final deliveringArea = areas.firstWhere((a) => a.key == 'delivering');
  final deliveryStarted = deliveringArea.steps.any((s) => s['done'] == true);
  if (preparingArea.complete && !deliveryStarted && key != 'delivered') {
    key = 'ready_for_delivery';
  }

  return OrderProgress(
    areas,
    key,
    statusLabel[key] ?? '—',
    all.where((s) => s['done'] == true).length,
    all.length,
    itemsReady: itemsReady,
    totalItems: totalItems,
  );
}

class ItemProgress {
  final List<Json> steps;
  final Json? current;
  final String currentLabel;
  final int done;
  final int total;
  final bool complete;
  final String currentKey;
  ItemProgress(this.steps, this.current, this.currentLabel, this.done, this.total,
      this.complete, this.currentKey);
}

// Per-item linear progress from order_item_steps.
ItemProgress itemProgress(Json item) {
  final steps = _steps(item['order_item_steps']).toList()..sort(_sortCmp);
  Json? current;
  String currentKey = 'done';
  for (final s in steps) {
    if (s['done'] != true) {
      current = s;
      currentKey = s['key'] as String? ?? 'unknown';
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
    complete ? 'ready' : currentKey,
  );
}
