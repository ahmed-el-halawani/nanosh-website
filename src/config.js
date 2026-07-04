// Central knobs. WA_PHONE = shop's WhatsApp number (intl format, no +) — from the design props.
export const WA_PHONE = '201097033133';

// Size choices offered in the options sheet (products carry no size data).
export const SIZES = ['S', 'M', 'L', 'XL', 'مقاس حر'];

export const ACCENT = '#C6544E';   // sale/status red used across the design
export const TEAL = '#1B695E';

// Order lifecycle areas. Each area is a stage with worker sub-steps; customers see one milestone node per area.
export const ORDER_AREAS = [
  { key: 'received',   name: 'المراجعة', label: 'استلمنا طلبك',   note: 'طلبك وصلنا وجاري المراجعة' },
  { key: 'confirming', name: 'التأكيد',  label: 'تأكيد التفاصيل', note: 'نتواصل معك لتأكيد المقاسات والألوان' },
  { key: 'making',     name: 'التنفيذ',  label: 'جاري التنفيذ',   note: 'يتم حياكة قطعك يدويًا بعناية' },
  { key: 'shipping',   name: 'الشحن',    label: 'جاهز للشحن',     note: 'طلبك جاهز وقيد التوصيل' },
  { key: 'done',       name: 'التسليم',  label: 'تم التسليم',     note: 'استمتعي بقطعتك 🌿' },
];
export const STATUS_LABEL = {
  received: 'قيد المراجعة',
  confirming: 'جاري التأكيد',
  making: 'قيد التنفيذ',
  shipping: 'قيد الشحن',
  done: 'تم التسليم',
};

// Per-item production steps. Seeded for every order_item on checkout; workers may add/reorder/delete.
export const ITEM_STEPS = [
  { key: 'received',   label: 'استلمنا طلبك',   note: 'طلبك وصلنا وجاري المراجعة' },
  { key: 'confirming', label: 'تأكيد التفاصيل', note: 'نتواصل معك لتأكيد المقاسات والألوان' },
  { key: 'material',   label: 'تجهيز الخامة',   note: 'تجهيز الخيوط والخامات لهذه القطعة' },
  { key: 'making',     label: 'جاري التنفيذ',   note: 'يتم حياكة القطعة يدويًا بعناية' },
  { key: 'shipping',   label: 'جاهز للشحن',     note: 'القطعة جاهزة للتسليم' },
  { key: 'done',       label: 'تم التسليم',     note: 'تم تسليم القطعة 🌿' },
];

// price → "1,750 ج.م" (matches the source catalogue formatting)
export const fmt = (n) => (n ?? 0).toLocaleString('en-US') + ' ج.م';

// Arabic colour name → swatch hex for the cart/detail dots.
const COLORS = {
  'بني': '#6b4a2b', 'بيج': '#d8c3a5', 'أوف وايت': '#f2ede3', 'كريمي': '#efe3cf',
  'برتقالي': '#e0722f', 'أبيض': '#ffffff', 'أسود': '#222222', 'كحلي': '#2b3a55',
  'رمادي': '#9a9a9a', 'وردي': '#e6a4b4', 'أخضر': '#5a7d5a',
};
export const colorHex = (name) => COLORS[name?.trim()] || '#cbb99f';

export const waLink = (text) =>
  `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
