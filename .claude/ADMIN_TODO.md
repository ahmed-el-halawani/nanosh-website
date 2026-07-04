# Nanosh Admin — TODO

Admin build (products + order to-do checklist), **mobile-first**. Updated as tasks finish.

- [x] 1. Backend migration — `is_admin` flag, `is_admin()` helper, admin RLS, `product-images` bucket + policies
- [x] 2. Customer timeline → driven by `order_steps.done` ([steps.js](../src/screens/steps.js))
- [x] 3. `ctx.isAdmin` wiring + `#/admin` route + guard + gated entry links (header/account)
- [x] 4. Admin **Products** tab — list + add/edit form (image upload + URL) + delete
- [x] 5. Admin **Orders** tab — list all orders + detail + to-do checklist (tick/add/delete steps) + status
- [x] 6. Backend hardening (advisors): dropped bucket listing policy, revoked `is_admin()` from anon
- [x] 7. **Mobile polish** — phone-friendly admin for workers (full-width lists, 24px checkboxes, bottom-sheet panels; ticking a step keeps the panel open, list refreshes on close)
- [x] 8. Verify end-to-end on **phone (375px)**: admin gating, product add (URL), RLS denial, order checklist → customer timeline (3 ticks → 3 done in customer view)

_Status: ✅ complete. Fixes made during build: blank-page bug (render no longer blocks on profile fetch); `orders→profiles` FK for the admin order embed; advisor hardening (bucket listing policy, is_admin anon revoke); step-tick no longer wipes the open panel._

## How to grant admin
In Supabase → SQL: `update public.profiles set is_admin = true where id = '<the owner's auth user id>';`
(find the id via the account's email in `auth.users`). Then that account sees "الإدارة" / "لوحة الإدارة".
