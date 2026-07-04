# Step-model redesign + admin notes — TODO

Plan: [STEP_MODEL_REDESIGN_PLAN.md](./STEP_MODEL_REDESIGN_PLAN.md)

- [x] 1. `src/config.js`: split into order-level `ORDER_AREAS` (5 steps) and item-level `ITEM_STEPS` (3 steps)
- [x] 2. `src/api.js`: seed new order/item steps on `createOrder`; add `updateOrderItem` for `admin_note`
- [x] 3. `src/screens/admin.js`: sequential order-level checklist; auto-check `preparing` when all items done; two-way cascade `confirming` to all item confirming steps; list item cards with bigger fonts; inline editable admin note
- [x] 4. `src/screens/board.js`: production item filters; sequential item-step checking/unchecking; `ready` locked as final step; admin note display on card + editable in sheet
- [x] 5. `src/screens/orderDetail.js` + `orders.js`: unchanged (derive labels dynamically)
- [x] 6. `STEP_MODEL_MIGRATION.sql`: `admin_note` column + order_steps/item_steps migration
- [x] 7. `npm run build` clean
- [x] 8. Run data migration on Supabase project `nanosh` (order_steps + order_item_steps cleaned/normalized)
- [x] 9. Add `admin_note` column to `order_items`
- [ ] 10. Verify in browser: admin order detail (list cards, admin note, sequential checklist, auto-preparing), production board, customer order pages

_Status: code complete ✅ · Build clean in 1.62s · Waiting for DB migration + browser verification._
