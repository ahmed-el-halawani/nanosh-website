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
  AreaDef('making', 'التنفيذ', 'جاري التنفيذ', 'يتم حياكة قطعك يدويًا بعناية'),
  AreaDef('shipping', 'الشحن', 'جاهز للشحن', 'طلبك جاهز وقيد التوصيل'),
  AreaDef('done', 'التسليم', 'تم التسليم', 'استمتعي بقطعتك 🌿'),
];

const Map<String, String> statusLabel = {
  'received': 'قيد المراجعة',
  'confirming': 'جاري التأكيد',
  'making': 'قيد التنفيذ',
  'shipping': 'قيد الشحن',
  'done': 'تم التسليم',
};

// Per-item default steps (today's 5 + the material step), inserted before making.
const List<Map<String, String>> itemSteps = [
  {'key': 'received', 'label': 'استلمنا طلبك', 'note': 'طلبك وصلنا وجاري المراجعة'},
  {'key': 'confirming', 'label': 'تأكيد التفاصيل', 'note': 'نتواصل معك لتأكيد المقاسات والألوان'},
  {'key': 'material', 'label': 'تجهيز الخامة', 'note': 'تجهيز الخيوط والخامات لهذه القطعة'},
  {'key': 'making', 'label': 'جاري التنفيذ', 'note': 'يتم حياكة القطعة يدويًا بعناية'},
  {'key': 'shipping', 'label': 'جاهز للشحن', 'note': 'القطعة جاهزة للتسليم'},
  {'key': 'done', 'label': 'تم التسليم', 'note': 'تم تسليم القطعة 🌿'},
];

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
