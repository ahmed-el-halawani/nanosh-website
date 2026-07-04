# Order status from steps · areas · reorder — TODO

Updated as tasks finish.

- [x] 1. `config.js` — add `ORDER_AREAS`, remove dead `ORDER_STATUSES`/`ORDER_STEPS`/`statusIndex`
- [x] 2. `steps.js` — add exported `orderProgress(order)`, rewrite `stepsHtml` to render one milestone node per area
- [x] 3. `api.js` — `createOrder` seeds one step per area; `addOrderStep` accepts `area`; add generic `updateOrderStep`; drop `setStepDone`/`setOrderStatus`
- [x] 4. `orders.js` — replace `STATUS_LABEL[o.status]` badge with derived `orderProgress(o).label`
- [x] 5. `orderDetail.js` — replace `STATUS_LABEL[o.status]` badge with derived `orderProgress(o).label`
- [x] 6. `admin.js` — orders list uses `orderProgress`; order sheet groups steps into 5 areas with status pills, per-area add input, up/down reorder arrows, delete; status dropdown removed
- [x] 7. `npm run build` clean

_Status: ✅ complete. Build clean in 707ms._

## Required DB migration (Supabase)
Run before deploying:

```sql
alter table public.order_steps add column if not exists area text;
update public.order_steps
set area = (array['received','confirming','making','shipping','done'])[least(sort,4)+1]
where area is null;
```

## Verification notes
- Customer timeline still shows 5 milestone nodes (one per area) driven by `order_steps.done`.
- Admin order panel derives status from areas; no writes to `orders.status` from the UI.
- New orders created after this change will have one default step per area.
