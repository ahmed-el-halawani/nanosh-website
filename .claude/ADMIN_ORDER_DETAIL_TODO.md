# Admin order-detail redesign — TODO

Plan: [ADMIN_ORDER_DETAIL_PLAN.md](./ADMIN_ORDER_DETAIL_PLAN.md)

- [x] 1. `src/screens/board.js`: export `openItemSheet`; mutate `it.order_item_steps` directly (`||=`) instead of a local copy
- [x] 2. `src/screens/admin.js`: import `openItemSheet` + `itemProgress`; replace static items list with tappable `renderItems()` cards (per-item current-step pill + done/total); tap opens `openItemSheet`
- [x] 3. `src/screens/admin.js`: relabel sections — «القطع ومراحلها» (per-item) then «مهام الطلب العامة» (order-level checklist, logic unchanged)
- [x] 4. `npm run build` clean
- [ ] 5. Verify in browser: order detail item cards + per-item editor persist/refresh; order-level checklist still works; board + customer views unaffected

_Status: code complete ✅ · Build clean in 789ms · Waiting for browser verification._
