// Ported from the web app's src/config.js — single source of truth for the admin app.

const String waPhone = '201097033133';

const List<String> genders = ['حريمي', 'رجالي', 'أطفال', 'الجميع'];

class AreaDef {
  final String key;
  final String name; // short admin name
  final String label; // customer-facing milestone label
  final String note;
  const AreaDef(this.key, this.name, this.label, this.note);
}

// Order-level lifecycle stages (area-grouped order_steps).
const List<AreaDef> orderAreas = [
  AreaDef('received', 'المراجعة', 'استلمنا طلبك', 'طلبك وصلنا وجاري المراجعة'),
  AreaDef('confirming', 'التأكيد', 'تأكيد التفاصيل', 'نتواصل معك لتأكيد المقاسات والألوان'),
  AreaDef('preparing', 'التجهيز', 'تجهيز الطلبية', 'قطع الطلبية قيد التجهيز للشحن'),
  AreaDef('delivering', 'التوصيل', 'جاري التوصيل', 'طلبك في طريقه إليك'),
  AreaDef('delivered', 'التسليم', 'تم التسليم', 'استمتعي بقطعتك 🌿'),
];

const Map<String, String> statusLabel = {
  'received': 'قيد المراجعة',
  'confirming': 'جاري التأكيد',
  'preparing': 'قيد التجهيز',
  'ready_for_delivery': 'جاهز للتوصيل',
  'delivering': 'قيد التوصيل',
  'delivered': 'تم التسليم',
};

// Per-item default production steps. 'confirming' and 'ready' are locked;
// workers may add/reorder/delete the middle steps.
const List<Map<String, String>> itemSteps = [
  {'key': 'confirming', 'label': 'تأكيد التفاصيل', 'note': 'نتواصل معك لتأكيد المقاسات والألوان'},
  {'key': 'material', 'label': 'تجهيز الخامة', 'note': 'تجهيز الخيوط والخامات لهذه القطعة'},
  {'key': 'making', 'label': 'جاري التنفيذ', 'note': 'يتم حياكة القطعة يدويًا بعناية'},
  {'key': 'ready', 'label': 'جاهزة للتسليم', 'note': 'القطعة جاهزة للتسليم'},
];

({int color, int bg}) statusStyle(String key) {
  if (const {'delivered', 'ready', 'done'}.contains(key)) {
    return (color: 0xFF1B695E, bg: 0xFFE8F0EC);
  }
  if (key == 'ready_for_delivery') {
    return (color: 0xFF2563EB, bg: 0xFFEFF6FF);
  }
  if (const {'preparing', 'delivering', 'making'}.contains(key)) {
    return (color: 0xFFC7812C, bg: 0xFFFFF6E6);
  }
  return (color: 0xFFC6544E, bg: 0xFFFBEEEE);
}

// "1750" -> "1,750 ج.م"
String fmt(num? n) {
  final v = (n ?? 0).round();
  final s = v.toString();
  final buf = StringBuffer();
  for (int i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  return '$buf ج.م';
}

Uri waLink(String text) =>
    Uri.parse('https://wa.me/$waPhone?text=${Uri.encodeComponent(text)}');

Uri waTo(String phone, [String text = '']) {
  final digits = phone.replaceAll(RegExp(r'[^0-9]'), '');
  return Uri.parse('https://wa.me/$digits?text=${Uri.encodeComponent(text)}');
}
