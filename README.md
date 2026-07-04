# نانوش — Nanosh

RTL Arabic storefront for handmade crochet, rebuilt from the Claude Design prototype as a real
app: **Vite + vanilla JS** front end on a **Supabase** (Postgres + Auth) backend.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
```

`.env.local` already holds the Supabase URL + publishable key for the `nanosh` project
(`wkxftfdwdxtzqgmgjdtn`). It is git-ignored.

## What works now
- Shop, product sheet, category filter, search — reading real products from the DB.
- Cart in `localStorage` (survives refresh); confirm-order writes `orders` + `order_items` +
  a 5-step timeline to Postgres.
- Order tracking + detail with the progress timeline.
- **Auth: email + password** end-to-end (signup, email confirmation, login, profile save).
  Google & Facebook buttons are wired — they work as soon as you add the provider keys below.
- Row-Level Security: products are public; orders/profiles are private to each user (verified).

## You still need to configure

1. **WhatsApp number** — edit `WA_PHONE` in `src/config.js` (intl format, no `+`, e.g. Egypt
   `20100…`). It's a placeholder right now.

2. **Google login** — create an OAuth client at
   https://console.cloud.google.com → APIs & Services → Credentials. Authorized redirect URI:
   `https://wkxftfdwdxtzqgmgjdtn.supabase.co/auth/v1/callback`. Paste the client id + secret into
   Supabase → Authentication → Providers → Google, and enable it.

3. **Facebook login** — create an app at https://developers.facebook.com, add "Facebook Login",
   same callback URL as above. Paste App ID + secret into Supabase → Providers → Facebook.
   Facebook requires a live HTTPS domain + a privacy-policy URL before it leaves dev mode.

4. **Redirect URLs** — Supabase → Authentication → URL Configuration: add your dev
   (`http://localhost:5173`) and production URLs.

5. **Email confirmation** is ON. New users must confirm via email before they can log in. Toggle
   under Authentication → Providers → Email if you want instant signup instead.

## Managing content (no admin UI yet)
- **Products:** edit the `products` table in the Supabase dashboard (or SQL). Seeded from
  `products.json`.
- **Order progress:** bump the order's `status` column
  (`received → confirming → making → shipping → done`). The customer's timeline updates
  automatically — status is the single source of truth.

## Layout
- `src/main.js` — hash router (`#/shop #/cart #/orders #/order/:id #/account`) + bottom nav
- `src/config.js` — WhatsApp number, colors, price format, order-step template
- `src/supabase.js` `src/auth.js` `src/api.js` `src/store.js` — client, auth, DB queries, cart
- `src/screens/*.js` — one file per screen, ported 1:1 from the design's markup
