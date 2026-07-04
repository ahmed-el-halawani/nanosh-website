# Step-model redesign + admin notes

## Assumptions (implemented because requirements were ambiguous)

### New step split
- **Order-level lifecycle** (`ORDER_AREAS`, `order_steps`): 5 stages
  1. `received`   → استلمنا طلبك
  2. `confirming` → تأكيد التفاصيل  (order-level; cascades to items)
  3. `preparing`  → تجهيز الطلبية    (auto-checks when every item is production-done)
  4. `delivering` → جاري التوصيل
  5. `delivered`  → تم التسليم

- **Item-level production** (`ITEM_STEPS`, `order_item_steps`): 4 stages
  1. `confirming` → تأكيد التفاصيل  (auto-checked when order confirming is checked)
  2. `material`   → تجهيز الخامة
  3. `making`     → جاري التنفيذ
  4. `ready`      → جاهزة للتسليم

### Behaviours
1. New orders seed 5 order-level steps (only `received` auto-done) and 4 item-level steps per item (none auto-done).
2. Checking an order step is **sequential**: you cannot check step N unless step N-1 is done; you cannot uncheck step N if step N+1 is done. Unchecking a step auto-unchecks all later steps.
3. `preparing` auto-checks when **all items** are complete (`ready` done). It also auto-unchecks if any item becomes not-done.
4. `confirming` cascade: checking/unchecking the order `confirming` step reflects on every item's `confirming` step.
5. Item steps are **sequential**: can't check step N before N-1, can't uncheck step N if N+1 is done; unchecking auto-unchecks later steps.
6. `ready` is the final item step; no `delivered`/`done` item step exists.
7. Admin note per item (`order_items.admin_note`), editable inline on item cards, saved on `blur`.
8. Admin order-detail item cards use a **list** layout and larger fonts.

### DB migrations
See [STEP_MODEL_MIGRATION.sql](./STEP_MODEL_MIGRATION.sql). Run it before using the new code.
