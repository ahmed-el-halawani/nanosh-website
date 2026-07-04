// Central knobs. WA_PHONE = shop's WhatsApp number (intl format, no +) — from the design props.
export const WA_PHONE = '201097033133';

// Size choices offered in the options sheet (products carry no size data).
export const SIZES = ['S', 'M', 'L', 'XL', 'مقاس حر'];

export const ACCENT = '#C6544E';   // sale/status red used across the design
export const TEAL = '#1B695E';

// Order lifecycle areas. Each area is a stage with worker sub-steps; customers see one milestone node per area.
export const ORDER_AREAS = [
  { key: 'received',   name: 'المراجعة',    label: 'استلمنا طلبك',   note: 'طلبك وصلنا وجاري المراجعة' },
  { key: 'confirming', name: 'التأكيد',     label: 'تأكيد التفاصيل', note: 'نتواصل معك لتأكيد المقاسات والألوان' },
  { key: 'preparing',  name: 'التجهيز',     label: 'تجهيز الطلبية',  note: 'قطع الطلبية قيد التجهيز للشحن' },
  { key: 'delivering', name: 'التوصيل',     label: 'جاري التوصيل',   note: 'طلبك في طريقه إليك' },
  { key: 'delivered',  name: 'التسليم',     label: 'تم التسليم',     note: 'استمتعي بقطعتك 🌿' },
];
export const STATUS_LABEL = {
  received: 'قيد المراجعة',
  confirming: 'جاري التأكيد',
  preparing: 'قيد التجهيز',
  ready_for_delivery: 'جاهز للتوصيل',
  delivering: 'قيد التوصيل',
  delivered: 'تم التسليم',
};

// Status pill colors: green = final, yellow = active/in-progress, blue = ready for delivery, red = pending/waiting.
export function statusStyle(key) {
  if (['delivered', 'ready', 'done'].includes(key)) {
    return { color: '#1B695E', bg: '#e8f0ec' };
  }
  if (key === 'ready_for_delivery') {
    return { color: '#2563eb', bg: '#eff6ff' };
  }
  if (['preparing', 'delivering', 'making'].includes(key)) {
    return { color: '#c7812c', bg: '#fff6e6' };
  }
  return { color: '#C6544E', bg: '#fbeeee' };
}

// Per-item production steps. Seeded for every order_item on checkout; workers may add/reorder/delete.
export const ITEM_STEPS = [
  { key: 'confirming', label: 'تأكيد التفاصيل', note: 'نتواصل معك لتأكيد المقاسات والألوان' },
  { key: 'material',   label: 'تجهيز الخامة',   note: 'تجهيز الخيوط والخامات لهذه القطعة' },
  { key: 'making',     label: 'جاري التنفيذ',   note: 'يتم حياكة القطعة يدويًا بعناية' },
  { key: 'ready',      label: 'جاهزة للتسليم',  note: 'القطعة جاهزة للتسليم' },
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
