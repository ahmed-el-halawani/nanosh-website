# Per-item steps + production board — TODO

Plan: [ITEM_STEPS_PLAN.md](./ITEM_STEPS_PLAN.md)
Model: hybrid (order-level stages kept as-is) + new per-item tracker. Per-item default = 6 steps
(today's 5 + new `material` "تجهيز الخامة", inserted before `making`).

- [x] 1. Migration: create `order_item_steps` table + RLS (admin + owner-at-checkout insert, admin edit) + grants; backfill 6 steps × 9 existing items (54 rows) — user applied
- [x] 2. `src/config.js`: add `ITEM_STEPS` template (keep `ORDER_AREAS`/`STATUS_LABEL`)
- [x] 3. `src/api.js`: `createOrder` seeds per-item steps (`.select()` on items); nest `order_item_steps(*)` under `order_items` in getMyOrders/getOrder/getAllOrders; add `addItemStep`/`updateItemStep`/`deleteItemStep`
- [x] 4. `src/screens/steps.js`: add `itemProgress(item)` + `itemStepsHtml(item, big)`
- [x] 5. `src/screens/orderDetail.js`: per-item current-step pill on each item card (order timeline unchanged)
- [x] 6. `src/ui.js` + `src/screens/admin.js`: move `openModal` (and `esc` if local) to `ui.js`; add 3rd admin tab "الإنتاج" → `#/admin/board`
- [x] 7. `src/screens/board.js` (NEW): flatten all items; 2-row horizontal chip filter (dynamic, incl. custom + clear-all + count); item cards (image/title/size/note/qty + current step + one-tap advance); item bottom sheet (100px photo, 20px name, 16px size/note in card, bigger step editor)
- [x] 8. `npm run build` clean
- [ ] 9. Verify in browser: board (2-row chips, tick-advances, custom step → chip, reorder/delete) + customer per-item pills advance; order-level unchanged

## Required DB migration (Supabase project `nanosh` / `wkxftfdwdxtzqgmgjdtn`)
Run before deploying:

```sql
create table public.order_item_steps (
  id bigint generated always as identity primary key,
  order_item_id bigint not null references public.order_items(id) on delete cascade,
  label text not null,
  note text,
  key text,
  done boolean not null default false,
  sort integer not null default 0
);
alter table public.order_item_steps enable row level security;
grant select, insert, update, delete on public.order_item_steps to authenticated;

create policy "order_item_steps admin select" on public.order_item_steps
  for select using (public.is_admin());
create policy "own order item steps select" on public.order_item_steps
  for select using (exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.id = order_item_steps.order_item_id and o.user_id = auth.uid()));
create policy "order_item_steps admin insert" on public.order_item_steps
  for insert with check (public.is_admin());
create policy "own order item steps insert" on public.order_item_steps
  for insert with check (exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.id = order_item_steps.order_item_id and o.user_id = auth.uid()));
create policy "order_item_steps admin update" on public.order_item_steps
  for update using (public.is_admin());
create policy "order_item_steps admin delete" on public.order_item_steps
  for delete using (public.is_admin());

-- Backfill default 6 steps for existing order_items
insert into public.order_item_steps (order_item_id, label, note, key, done, sort)
select oi.id, s.label, s.note, s.key, s.key = 'received', s.sort
from public.order_items oi
join (values
  (0, 'استلمنا طلبك', 'طلبك وصلنا وجاري المراجعة', 'received'),
  (1, 'تأكيد التفاصيل', 'نتواصل معك لتأكيد المقاسات والألوان', 'confirming'),
  (2, 'تجهيز الخامة', 'تجهيز الخيوط والخامات لهذه القطعة', 'material'),
  (3, 'جاري التنفيذ', 'يتم حياكة القطعة يدويًا بعناية', 'making'),
  (4, 'جاهز للشحن', 'القطعة جاهزة للتسليم', 'shipping'),
  (5, 'تم التسليم', 'تم تسليم القطعة 🌿', 'done')
) as s(sort, label, note, key) on true;
```

_Status: code complete ✅ · Build clean in 1.74s · Migration applied ✅ (54 rows backfilled across 9 items, RLS verified) · Waiting for browser verification._
