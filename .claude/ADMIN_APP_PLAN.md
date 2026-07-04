# Flutter admin app + GitHub Actions CI

## Context
Native **Flutter** app (Android + iOS) for the admin/worker tools, built in **GitHub Actions**
(macOS runners → no local Mac needed for iOS). Fresh Flutter rewrite of the admin panel in Dart
against the **same Supabase backend** already built (`products`, `orders`, `order_items`,
`order_steps`, `order_item_steps`, `profiles`; RLS + `is_admin()` in place — no backend changes).
Decisions: lives in **`admin_app/`** subfolder; **full admin** scope; **no Apple account yet** → CI
ships a signed **Android** build + an **iOS compile-check** (`--no-codesign`); iOS signing later.

Behavioural spec to mirror: `src/screens/admin.js`, `src/screens/board.js`, `src/screens/steps.js`,
`src/config.js`, `src/api.js`, `src/auth.js`.

## 1. Repo + Flutter project setup
- `git init` at project root + root `.gitignore` (node: `node_modules/ dist/ .env*`; Flutter:
  `admin_app/build/ admin_app/.dart_tool/ admin_app/ios/Pods/ *.iml`). Owner creates GitHub remote.
- Scaffold `admin_app/` (`flutter create --org com.nanosh --project-name nanosh_admin
  --platforms=android,ios admin_app`). App id `com.nanosh.admin`, name «نانوش الإدارة».

## 2. Packages (`admin_app/pubspec.yaml`)
`supabase_flutter`, `image_picker`, `url_launcher`, `google_fonts` (Tajawal). Supabase URL/anon-key
via `--dart-define` (`String.fromEnvironment`); never hardcode.

## 3. App structure (`admin_app/lib/`)
- `main.dart` — `Supabase.initialize(authFlowType: pkce)`, `MaterialApp` `locale: ar`, RTL, Tajawal
  theme (teal `#1B695E` / cream `#FBF6EE` / accent `#C6544E`), auth gate.
- `data/supabase.dart` — query helpers mirroring api.js (getAllOrders with the full embed, products
  CRUD, uploadProductImage, order/item step add/update/delete, getProfile).
- `data/constants.dart` — `ORDER_AREAS`, `STATUS_LABEL`, `ITEM_STEPS`, `GENDERS`, `fmt`, `waLink`.
- `data/progress.dart` — `orderProgress` (area-grouped) + `itemProgress` (linear) ported.
- `screens/` — see §5.

## 4. Auth + OAuth deep link
- Gate on `onAuthStateChange`; load `profiles.is_admin` → shell, else «غير مصرح» + sign-out.
- Login: email/password + Google/Facebook `signInWithOAuth(redirectTo:
  'com.nanosh.admin://login-callback')` (PKCE deep-link return handled by supabase_flutter).
- Register scheme `com.nanosh.admin`: Android `AndroidManifest.xml` intent-filter, iOS `Info.plist`
  `CFBundleURLTypes`.
- Owner: add `com.nanosh.admin://login-callback` to Supabase → Auth → Redirect URLs.

## 5. Screens (mirror the JS admin)
- **Shell**: bottom nav الطلبات / الإنتاج / المنتجات + account/sign-out.
- **Products**: cards list; add/edit (all fields) + image pick/upload to `product-images` + URL paste;
  delete w/ confirm.
- **Orders**: list (order #, customer, phone, date, `orderProgress` status, total, done/total).
  Detail = order-level area checklist «مهام الطلب العامة» (check/reorder/add/delete) + items list;
  tap item → per-item step editor.
- **Production board**: flattened items; 2-row horizontal chip filter (dynamic incl. custom + «مكتمل»
  + «الكل») + live count; item cards (image/name/size/note/qty + current-step pill + done/total) with
  one-tap advance; tap → item sheet with full per-item editor.

## 6. GitHub Actions (`.github/workflows/mobile.yml`, repo root)
- Triggers: push `main`, `workflow_dispatch`, tags `v*`. `working-directory: admin_app`,
  `subosito/flutter-action`.
- **android** (ubuntu): Java 17 + Flutter → `pub get` → `build apk --release` (+ appbundle) with
  `--dart-define` from secrets → upload artifact.
- **ios** (macos): `build ios --release --no-codesign` → artifact.
- **release** (tag `v*`): attach Android APK/AAB to a GitHub Release.
- Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (keystore + iOS signing later).

## Manual steps (owner)
- Create GitHub repo, push, add secrets `SUPABASE_URL` + `SUPABASE_ANON_KEY`.
- Add Supabase redirect URL `com.nanosh.admin://login-callback`.
- Later: Android release keystore; Apple Developer account + iOS signing.

## What runs where
- **Here**: git init, scaffold, all Dart + configs + manifest/plist + workflow. Flutter build likely
  can't run locally → compilation validated by CI.
- **CI/owner**: real Android/iOS builds in Actions; on-device OAuth + admin testing from the APK.

## Verification
1. Web admin still works (`#/admin` orders/board/products) — unchanged.
2. Repo pushed; Actions android job green + APK artifact; ios job green (`--no-codesign`).
3. Owner installs APK, signs in (email/password + Google/Facebook via deep link), confirms products
   CRUD + image upload, order detail (order+item steps), board (filter/advance/editor); session
   survives restart.
