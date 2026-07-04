# Per-item steps + production board

## Context
Order progress is currently tracked **per order** (`order_steps.order_id`, seeded 5-per-order from
`ORDER_AREAS`, shown as an area-grouped admin checklist and a 5-dot customer timeline). The owner
now wants progress tracked **per item** so both the customer and the workers can see *which item*
is done and which one is still "getting its material", and wants a dedicated worker **production
board** listing every item across every order for fast one-tap advancing.

Decided with the user:
- **Hybrid model.** Keep the existing order-level stages/timeline exactly as they are (no
  regression). *Add* a separate **per-item** step tracker on top.
- **Per-item default steps = today's 5 + a new material step** = 6 steps per item:
  `received → confirming → تجهيز الخامة (material, NEW) → making → shipping → done`. Workers can
  add / delete / reorder steps per item (custom steps allowed).
- **Customer** order page shows each item's own progress (current step) in addition to the order
  timeline.
- **Production board** = new admin tab listing all items across all orders; each item shows its
  current step with a one-tap advance ("check current → next appears"); a chip filter (styled like
  the shop categories, **2 rows, horizontal scroll, a clear-all chip, and a live item count**) that
  is built dynamically from the steps items are currently on (including custom ones).

## Data change (Supabase — new table, mirrors `order_steps` RLS)
New table `public.order_item_steps` (separate from `order_steps` → zero risk to the order-level
feature). Apply via `apply_migration`:

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

-- SELECT: admins all; customers their own items (item → order → user)
create policy "order_item_steps admin select" on public.order_item_steps
  for select using (public.is_admin());
create policy "own order item steps select" on public.order_item_steps
  for select using (exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.id = order_item_steps.order_item_id and o.user_id = auth.uid()));
-- INSERT: admins + the owner at checkout (createOrder runs as the customer)
create policy "order_item_steps admin insert" on public.order_item_steps
  for insert with check (public.is_admin());
create policy "own order item steps insert" on public.order_item_steps
  for insert with check (exists (select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
    where oi.id = order_item_steps.order_item_id and o.user_id = auth.uid()));
-- UPDATE / DELETE: admins only (workers advance/edit steps)
create policy "order_item_steps admin update" on public.order_item_steps
  for update using (public.is_admin());
create policy "order_item_steps admin delete" on public.order_item_steps
  for delete using (public.is_admin());
```

Backfill the 6 default steps for the 9 existing items (9×6 = 54 rows), `done = (key='received')`,
`sort` 0..5 — a single `insert ... select` cross-joining `order_items` with the 6-step template.

## Config (`src/config.js`)
Add the per-item template (keep `ORDER_AREAS` / `STATUS_LABEL` untouched):
```js
export const ITEM_STEPS = [
  { key:'received',   label:'استلمنا طلبك',   note:'طلبك وصلنا وجاري المراجعة' },
  { key:'confirming', label:'تأكيد التفاصيل', note:'نتواصل معك لتأكيد المقاسات والألوان' },
  { key:'material',   label:'تجهيز الخامة',   note:'تجهيز الخيوط والخامات لهذه القطعة' }, // NEW
  { key:'making',     label:'جاري التنفيذ',   note:'يتم حياكة القطعة يدويًا بعناية' },
  { key:'shipping',   label:'جاهز للشحن',     note:'القطعة جاهزة للتسليم' },
  { key:'done',       label:'تم التسليم',     note:'تم تسليم القطعة 🌿' },
];
```

## API (`src/api.js`)
- `createOrder`: change the `order_items` insert to `.insert(items).select()` to get item ids, then
  insert `order_item_steps` for every item from `ITEM_STEPS` (`order_item_id`, label, note, key,
  `done: s.key==='received'`, `sort: idx`). (Order-level `order_steps` seeding stays as-is.)
- Extend the three read embeds to nest item steps under items:
  `order_items(*, products(images), order_item_steps(*))` in `getMyOrders`, `getOrder`,
  `getAllOrders` (keep the existing order-level `order_steps(*)` and `profiles(...)`).
- Add per-item step mutations mirroring the order-step ones:
  `addItemStep(orderItemId, label, sort, key)`, `updateItemStep(id, patch)`, `deleteItemStep(id)`.

## Derivation helpers (`src/screens/steps.js`)
Add and export:
- `itemProgress(item)` — linear (not area-grouped): sort `item.order_item_steps` by `sort`,
  `current = first not-done`, return `{ steps, current, currentLabel, done, total, complete }`
  (`currentLabel` = current step's label, or `'مكتمل'` when complete).
- `itemStepsHtml(item, big)` — a compact linear dot timeline for one item, reusing the exact
  dot/line styling already in `stepsHtml`.

## Customer view (`src/screens/orderDetail.js`)
Under each item card, add a compact per-item status: the `itemProgress(it).currentLabel` as a small
pill plus `done/total` (or a mini `itemStepsHtml(it)` timeline). Keep the order-level area timeline
and order status pill unchanged (hybrid). `orders.js` list stays order-level.

## Production board (new `src/screens/board.js`, shown as a 3rd admin tab)
`export async function boardTab(content, ctx)`:
- Data: reuse `getAllOrders()` (now embeds item steps); flatten to items:
  `orders.flatMap(o => o.order_items.map(it => ({ ...it, order_id:o.id, customer:o.profiles?.name, phone:o.profiles?.phone })))`.
- **Filter chips** (reuse shop's `chipStyle(on)` + `nn-scroll`): chips = `['الكل', ...distinct current
  step labels across all items (incl. custom + 'مكتمل')]`, laid out in **2 rows scrolling
  horizontally** (`display:grid; grid-auto-flow:column; grid-template-rows:repeat(2,auto);
  overflow-x:auto`). Selecting filters items whose `itemProgress(it).currentLabel` === chip;
  `الكل` clears. Show a live **count** of the filtered items next to the chips.
- **Item cards** (reuse the `orderDetail.js` item markup): image, title, size, note, qty, plus the
  **current step** and a single check control ("only one step checked; after check the next shows").
  Ticking → `updateItemStep(current.id, { done:true })` → re-derive → re-render (advances to next
  step; chips + count refresh).
- **Item bottom sheet** (`openModal`) on card click: the same fields in **bigger font**, plus the
  full per-item step editor — advance/untick, add custom step (`addItemStep`), reorder (up/down via
  `updateItemStep` sort swap), delete (`deleteItemStep`) — same handler patterns as the order-level
  `renderAreas` in admin.js.

## Admin wiring (`src/screens/admin.js`, `src/ui.js`)
- Move the local `openModal(root, html, onClose)` helper (and `esc` if local) from `admin.js` into
  `src/ui.js` and import it in both `admin.js` and `board.js` (shared bottom-sheet).
- Add a 3rd tab: `param === 'board'` → `'board'`; add `${tabBtn('board','الإنتاج')}`; route to
  `boardTab(content, ctx)`. Nav uses the existing `#/admin/board` hash pattern (no `main.js` route
  change needed). The order-level orders tab / `openOrderDetail` stays unchanged.

## Verification (end-to-end)
1. `apply_migration`; confirm `select count(*) from order_item_steps` = 54 and a per-key breakdown.
   Spot-check RLS isn't broken (anon/customer can't write).
2. `npm run build` clean.
3. Dev server (http://localhost:5173) — admin account `agomaa528.ag@gmail.com` is already
   `is_admin=true`. Open `#/admin/board`:
   - chips render in 2 horizontally-scrolling rows with a clear-all + item count;
   - tick an item's current step → it advances to the next step, count/chips update;
   - open an item sheet → bigger fonts, add a custom step → it appears; that item now filters under
     the custom step's chip; reorder/delete work.
4. Customer paths: order detail shows each item's current-step pill advancing as workers tick;
   order-level timeline/status still behaves as before.
5. Verify with `preview_snapshot`/`preview_inspect` (screenshots time out on the auto-carousel).
