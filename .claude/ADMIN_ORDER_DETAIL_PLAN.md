# Admin order-detail redesign (order steps + per-item steps)

## Context
The order model is now **hybrid**: the order has its own step timeline (`order_steps`, area-grouped)
**and** every item has its own step sequence (`order_item_steps`, 6 steps each). But the admin
order-detail sheet (`openOrderDetail` in [src/screens/admin.js](src/screens/admin.js)) still shows
only the **order-level** area checklist plus a *read-only* list of items — there is no way to view
or manage an item's own steps from inside an order. The production board can do per-item editing,
but when a worker is looking at one specific order they can't reach its items' steps.

Goal: redesign the admin order-detail sheet to present **both levels** clearly — each item becomes a
tappable card showing its own progress and opening the full per-item step editor, while the
order-level checklist stays for the overall order stages.

Almost entirely **reuse** — the per-item editor already exists as `openItemSheet` in
[src/screens/board.js](src/screens/board.js); we just export it and open it from the order detail.

## Changes

### 1. `src/screens/board.js` — export + share the per-item editor
- `export function openItemSheet(root, it, onChange)` (currently module-private).
- Make it mutate `it.order_item_steps` **directly** instead of a local copy, so added/deleted/toggled
  steps propagate back to whatever opened it (both the board's flattened item and the order-detail's
  `order.order_items[i]` share the same `order_item_steps` array reference). Concretely: replace
  `const steps = [...(it.order_item_steps || [])];` with `const steps = (it.order_item_steps ||= []);`
  and keep the existing push/splice/sort mutations (they now hit the real array). The board's
  `render()`/`itemProgress` already read `it.order_item_steps`, so it keeps working and now also
  reflects add/delete without a refetch.

### 2. `src/screens/admin.js` — redesign `openOrderDetail`
- Imports: add `openItemSheet` from `./board.js` and `itemProgress` from `./steps.js`.
- Replace the static `items` HTML with a `renderItems()` that fills an `#items` container with
  **interactive item cards** (reuse the board `itemCard` visual language, minus the advance
  checkbox): image, name, `size`/`note`, qty, and a per-item **current-step pill + `done/total`**
  from `itemProgress(it)`, with a chevron and a hint "اضغطي على القطعة لإدارة خطواتها". Each card taps
  to `openItemSheet(root, it, renderItems)` — pass the item enriched with
  `customer: order.profiles?.name`, `phone: order.profiles?.phone` (the sheet renders those).
  `renderItems` re-runs on sheet close so the pill/progress refresh.
- Keep the order-level derived-status pill and the area checklist (`renderAreas`) unchanged in logic,
  but relabel the two sections so the levels are unambiguous:
  - items section heading → **«القطع ومراحلها»** (was «القطع»),
  - order-level checklist heading → **«مهام الطلب العامة»** (was «مهام التنفيذ»).
- Section order in the sheet: header + WhatsApp → order status pill → **القطع ومراحلها** (per-item)
  → **مهام الطلب العامة** (order-level checklist). The close button and `openModal(..., onChange)`
  list-refresh wiring stay as-is.

No API, config, DB, or customer-facing changes — `getAllOrders()` already embeds
`order_items(*, products(images), order_item_steps(*))`, and the board/customer views are untouched.

## Verification
1. `npm run build` clean.
2. Dev server http://localhost:5173, admin `agomaa528.ag@gmail.com`. Open `#/admin/orders` → a order:
   - items now render as tappable cards each showing a per-item current-step pill + `done/total`;
   - tapping an item opens the big per-item editor (100px photo / 20px title); tick, add a custom
     step, reorder, delete — all persist; on close the item card's pill/progress update;
   - the order-level «مهام الطلب العامة» checklist still ticks/reorders/adds/deletes and the order
     status pill still derives correctly.
3. Confirm the production board (`#/admin/board`) and the customer order pages still behave (shared
   `openItemSheet` change didn't regress them).
4. Verify via `preview_snapshot`/`preview_inspect` (screenshots time out on the auto-carousel).
