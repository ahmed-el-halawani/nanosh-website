-- Step-model redesign migration
-- Run after deploying code that uses the new ORDER_AREAS / ITEM_STEPS.

-- 1. Admin note per item
alter table public.order_items add column if not exists admin_note text;

-- 2. Migrate order_steps to the new 5-area model
-- Rename old areas to new names.
update public.order_steps set area = 'preparing'  where area = 'making';
update public.order_steps set area = 'delivering' where area = 'shipping';
update public.order_steps set area = 'delivered'  where area = 'done';

-- Remove duplicates per order/area (keep the row with the highest id as the survivor).
delete from public.order_steps a
using public.order_steps b
where a.id < b.id
  and a.order_id = b.order_id
  and a.area = b.area;

-- Insert missing areas for every order.
insert into public.order_steps (order_id, label, note, area, done, sort)
select o.id, a.label, a.note, a.key, false, a.sort
from public.orders o
cross join lateral (values
  (0, 'received',   'استلمنا طلبك',   'طلبك وصلنا وجاري المراجعة'),
  (1, 'confirming', 'تأكيد التفاصيل', 'نتواصل معك لتأكيد المقاسات والألوان'),
  (2, 'preparing',  'تجهيز الطلبية',  'قطع الطلبية قيد التجهيز للشحن'),
  (3, 'delivering', 'جاري التوصيل',   'طلبك في طريقه إليك'),
  (4, 'delivered',  'تم التسليم',     'استمتعي بقطعتك 🌿')
) as a(sort, key, label, note)
where not exists (
  select 1 from public.order_steps s where s.order_id = o.id and s.area = a.key
);

-- 3. Migrate order_item_steps to the new 4-step production model
-- Delete legacy lifecycle keys that now live on the order level.
-- ('delivered' is a safety check in case any custom/legacy rows exist).
delete from public.order_item_steps where key in ('received', 'shipping', 'done', 'delivered');

-- Add missing default production steps to every item.
insert into public.order_item_steps (order_item_id, label, note, key, done, sort)
select oi.id, a.label, a.note, a.key, false, a.sort
from public.order_items oi
cross join lateral (values
  (0, 'confirming', 'تأكيد التفاصيل', 'نتواصل معك لتأكيد المقاسات والألوان'),
  (1, 'material',   'تجهيز الخامة',   'تجهيز الخيوط والخامات لهذه القطعة'),
  (2, 'making',     'جاري التنفيذ',   'يتم حياكة القطعة يدويًا بعناية'),
  (3, 'ready',      'جاهزة للتسليم',  'القطعة جاهزة للتسليم')
) as a(sort, key, label, note)
where not exists (
  select 1 from public.order_item_steps s where s.order_item_id = oi.id and s.key = a.key
);

-- Normalize sort values for the default production keys.
update public.order_item_steps set sort = case
  when key = 'confirming' then 0
  when key = 'material'   then 1
  when key = 'making'     then 2
  when key = 'ready'      then 3
  else sort
end;

-- Ensure admins can update order_items (required for admin_note and future item edits).
create policy if not exists "order_items admin update" on public.order_items
  for update using (public.is_admin());

-- Ensure RLS grants cover the new column (already covered by existing table grants).
