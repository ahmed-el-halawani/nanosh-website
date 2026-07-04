# Nanosh Admin — product management + order to-do checklist

## Context
The storefront and customer flows are built. The shop owner/workers previously managed everything
by hand in the Supabase dashboard. This adds an in-app **admin area**, **mobile-first**, focused on
the two daily jobs: **(1) add/manage products** and **(2) work each order via a to-do checklist**,
ticking off finished steps — those ticks are what the customer sees in their tracking timeline.

## Decisions (locked)
- **Admin = `is_admin` flag on `profiles`** (flip to true in the Supabase dashboard). RLS enforces it.
- **Product images: both** — upload files to a public Storage bucket *and* paste URLs.
- **Order steps: `order_steps.done` is the source of truth** for the customer timeline. Admin ticks
  steps done and can add custom to-do steps per order.
- **Mobile-first admin** — panels are bottom sheets on phones, big touch targets, easy for workers.

## Backend (done — Supabase project `wkxftfdwdxtzqgmgjdtn`)
- `profiles.is_admin boolean`; `public.is_admin()` SECURITY DEFINER helper (EXECUTE for `authenticated` only).
- Admin RLS on `products` (write), `orders` (select/update all), `order_items` (select all),
  `order_steps` (full), `profiles` (select all). Owner-only policies stay for customers.
- Public Storage bucket `product-images` (admin-only write; served via public URL).

## Frontend
- `ctx.isAdmin` loaded on boot + auth change ([main.js](../src/main.js) `loadUserCtx`, reuses `getProfile`).
- Route `#/admin` (`#/admin/products` | `#/admin/orders`); guarded — non-admins get "غير مصرح".
- Entry links (gated by `ctx.isAdmin`): "الإدارة" in the desktop header; "لوحة الإدارة" on the account page.
- Customer timeline ([steps.js](../src/screens/steps.js)) reads `step.done` (not status); status = badge label only.
- Admin screen [admin.js](../src/screens/admin.js): tabbed (المنتجات / الطلبات), `nn-body` page.
  - **Products:** full-width list + add/edit **bottom-sheet form** (name, price, gender select, type,
    material, colors/tags, stock, lead time, sort, images via upload + URL) + delete.
  - **Orders:** list all orders (customer name/phone, status, total, done-count) → order **bottom-sheet
    detail**: items, WhatsApp to customer, status dropdown, and the **to-do checklist** (tick `done`,
    add custom step, delete custom step).
- API ([api.js](../src/api.js)): `createProductRow`/`updateProductRow`/`deleteProductRow`,
  `uploadProductImage`, `getAllOrders`, `setStepDone`, `addOrderStep`, `deleteOrderStep`, `setOrderStatus`.

## Verification
- Set `is_admin=true` on a test account → "الإدارة"/"لوحة الإدارة" appears; non-admin blocked at `#/admin`.
- Products: add (uploaded image + pasted URL) → shows in shop; edit price → reflects; delete → gone;
  anon/non-admin insert denied by RLS.
- Orders: place an order as a customer; in admin tick steps → customer's `#/order/:id` timeline advances;
  add a custom step → shows for the customer.
- `get_advisors` clean of ERRORs; `npm run build` clean; **phone (375px) pass** on every admin panel.

## Out of scope
Dashboard metrics, image cropping, bulk import, order-status emails, pagination.
