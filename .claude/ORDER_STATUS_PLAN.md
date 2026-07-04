# Order status from steps · areas · reorder

## Context
Today the admin sets an order's status with a **separate dropdown** (`orders.status`, a text
CHECK-enum of `received/confirming/making/shipping/done`) *and* ticks a flat checklist of
`order_steps`. The two are redundant and can disagree. The customer timeline is already driven
purely by `order_steps.done` — `orders.status` is only a display label.

The owner wants the status to **derive from the steps** (each finished step = progress), the
worker checklist grouped into **areas** (stages) each showing its own status, and steps to be
**re-orderable**. Decided with the user:

- **Areas = the 5 stages.** Each stage becomes an *area* that holds a checklist of sub-steps the
  worker ticks off. An area is "done" when all its steps are done; the order's status is the first
  area not yet complete (→ "current stage name"), or delivered when all are complete.
- **Status label = current stage name**, reusing the existing `STATUS_LABEL` wording, now computed
  from steps (no dropdown).
- **Areas are admin-only.** Customers keep today's clean milestone timeline (one node per area);
  sub-steps live only in the worker panel.

No new table and no DB trigger: `order_steps` already has a `sort` column (reorder needs no new
column); every read path (`getMyOrders/getOrder/getAllOrders`) already embeds `order_steps(*)`, so
status is derived in JS. Only one additive column (`area`) is needed.

## Data change (Supabase — one additive migration)
Project `nanosh` (`wkxftfdwdxtzqgmgjdtn`). Apply via `apply_migration`:

```sql
alter table public.order_steps add column if not exists area text;
-- backfill existing rows: current sort 0..4 map 1:1 to the five stages
update public.order_steps
set area = (array['received','confirming','making','shipping','done'])[least(sort,4)+1]
where area is null;
```

Leave `area` nullable (JS falls back to `received` for any null). Leave `orders.status` column in
place (now unused by the UI — harmless; no destructive change).

## Model (config)
`src/config.js` — add a single source of truth for the five areas, reusing today's step
labels/notes as the **customer milestone** text so the customer timeline looks identical:

```js
export const ORDER_AREAS = [
  { key:'received',   name:'المراجعة', label:'استلمنا طلبك',   note:'طلبك وصلنا وجاري المراجعة' },
  { key:'confirming', name:'التأكيد',  label:'تأكيد التفاصيل', note:'نتواصل معك لتأكيد المقاسات والألوان' },
  { key:'making',     name:'التنفيذ',  label:'جاري التنفيذ',   note:'يتم حياكة قطعك يدويًا بعناية' },
  { key:'shipping',   name:'الشحن',    label:'جاهز للشحن',     note:'طلبك جاهز وقيد التوصيل' },
  { key:'done',       name:'التسليم',  label:'تم التسليم',     note:'استمتعي بقطعتك 🌿' },
];
```
Keep `STATUS_LABEL` (reused for the derived status text). Remove now-dead `ORDER_STATUSES`,
`ORDER_STEPS`, and `statusIndex` after their uses are gone (verify with a grep first).

## Derivation helper (reused everywhere)
`src/screens/steps.js` — add and export `orderProgress(order)`; it is the single place status is
computed and is imported by orders.js, orderDetail.js, and admin.js:

```js
export function orderProgress(order) {
  const all = order.order_steps || [];
  const rank = (k) => Math.max(0, ORDER_AREAS.findIndex((a) => a.key === k));
  const areas = ORDER_AREAS.map((a) => {
    const steps = all.filter((s) => (s.area || 'received') === a.key)
                     .sort((x, y) => x.sort - y.sort);
    const done = steps.filter((s) => s.done).length;
    return { ...a, steps, done, total: steps.length,
             complete: steps.length > 0 && done === steps.length };
  });
  const current = areas.find((a) => !a.complete);           // first unfinished area
  const key = current ? current.key : 'done';
  return { areas, currentKey: key, label: STATUS_LABEL[key],
           done: all.filter((s) => s.done).length, total: all.length };
}
```

Rewrite `stepsHtml(order, big)` to render **one node per `ORDER_AREAS` entry** (not per step),
using `orderProgress(order).areas`: node done = `area.complete`, current = first not-complete.
Node text = area `label`/`note`. This keeps the customer's 5-node timeline while sub-steps stay
hidden. Same dot/line/color styling as now.

## API (`src/api.js`)
- `createOrder`: seed one default step per area from `ORDER_AREAS`
  (`{ order_id, label, note, area:a.key, done: a.key==='received', sort:0 }`) instead of the old
  flat `ORDER_STEPS` map.
- `addOrderStep(orderId, label, sort, area)`: add the `area` argument to the insert.
- Add generic `updateOrderStep(id, patch)` → `update(patch).eq('id', id)`; use it for `{done}` and
  `{sort}`. Remove `setStepDone` and `setOrderStatus` (dead after the refactor).

## Screens
**`src/screens/orders.js`** and **`src/screens/orderDetail.js`** — replace the
`STATUS_LABEL[o.status]` badge with `orderProgress(o).label`. `stepsHtml(...)` calls are unchanged
(now area-based).

**`src/screens/admin.js`** — the focus:
- Orders list rows: derive the badge/progress from `orderProgress(order)` (label + `done/total`)
  instead of `order.status`.
- `openOrderDetail`:
  - **Remove** the `<select id="o_status">`, its change handler, and the `setOrderStatus` import.
  - Rewrite `renderSteps()` to **group by area** using `orderProgress(order).areas`. For each area:
    an area header (`name` + status pill: بانتظار / جاري / مكتمل, plus `done/total`), then its
    steps as 24px-checkbox rows, each with **up/down reorder arrows** and a delete button, then a
    small per-area "＋ أضيفي مهمة" input that adds a step to *that* area.
  - Handlers (all mutate the local `steps` array then `renderSteps()` only — never reload — so the
    open sheet is preserved, matching the existing pattern):
    - checkbox → `updateOrderStep(id, { done })`.
    - up/down → swap `sort` with the adjacent step **within the same area** and persist both via
      `updateOrderStep` (two calls; swapping exact values keeps per-area order unique).
    - add → `addOrderStep(order.id, label, maxSortInArea + 1, areaKey)`.
    - delete → `deleteOrderStep(id)` (any sub-step is deletable; drop the old
      `sort >= DEFAULT_STEPS` rule and the `DEFAULT_STEPS` const).
  - The list still refreshes on sheet close (existing `openModal(root, body, onChange)` wiring).

Reorder UI = up/down arrows (touch-friendly, no drag library) — consistent with the mobile-first,
minimal (ponytail) approach.

## Verification (end-to-end)
1. `apply_migration` for the `area` column; confirm with a `select area, count(*)` that all 15
   existing rows are backfilled across the five keys.
2. `npm run build` is clean.
3. Dev server already runs at http://localhost:5173 — reload (or rely on HMR).
4. Admin (needs an admin profile — set `is_admin=true` on the test/owner account via SQL if
   required to reach `#/admin`): open an order →
   - the status **dropdown is gone**; the checklist is grouped into the 5 areas, each with a status
     pill + `done/total`;
   - tick a sub-step → the area pill and the order's derived status update live, sheet stays open;
   - add a sub-step to an area, reorder with up/down (verify order persists after close/reopen),
     delete a sub-step.
   Verify with `preview_snapshot`/`preview_inspect` (screenshots time out on the auto-carousel).
5. Customer paths: `#/orders` and an order detail show the derived status label (equal to the
   current area) and the 5-node milestone timeline advancing as areas complete.
6. DB check: toggling steps writes only `order_steps`; `orders.status` receives no writes from the
   UI.
