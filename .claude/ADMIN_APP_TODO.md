# Flutter admin app + GitHub Actions — TODO

Plan: [ADMIN_APP_PLAN.md](./ADMIN_APP_PLAN.md) · Build/setup: [admin_app/BUILD.md](../admin_app/BUILD.md)
«نانوش الإدارة» · lives in `admin_app/` · OAuth scheme `com.nanosh.admin://login-callback` · no Apple
account yet (Android signed + iOS `--no-codesign`).

- [x] 1. `git init` at root + `.gitignore` (node + Flutter + `.env` secrets)
- [x] 2. Scaffold `admin_app/` (flutter create) + deps (supabase_flutter, image_picker, url_launcher, google_fonts, flutter_localizations)
- [x] 3. `lib/data/constants.dart` — orderAreas, statusLabel, itemSteps, genders, fmt, waLink/waTo
- [x] 4. `lib/data/api.dart` — client + query helpers (getAllOrders full embed, products CRUD, uploadProductImage, order/item step add/update/delete, getProfile)
- [x] 5. `lib/data/progress.dart` — orderProgress (area) + itemProgress (linear)
- [x] 6. `lib/main.dart` — Supabase.initialize(pkce) + MaterialApp (ar/RTL/Tajawal theme) + auth gate (+ `lib/theme.dart`)
- [x] 7. `lib/screens/login.dart` — email/password + Google/Facebook OAuth
- [x] 8. Deep-link registration — AndroidManifest intent-filter + iOS Info.plist CFBundleURLTypes (`com.nanosh.admin`)
- [x] 9. `lib/screens/shell.dart` — bottom nav (orders / production / products) + sign-out; «غير مصرح» for non-admins
- [x] 10. `lib/screens/products.dart` — list + add/edit form (all fields) + image upload/URL + delete
- [x] 11. `lib/screens/orders.dart` — list + detail (order-level area checklist + items → per-item editor)
- [x] 12. `lib/screens/board.dart` + `lib/widgets/item_sheet.dart` — flattened items + 2-row chip filter + count + one-tap advance + item sheet editor
- [x] 13. `.github/workflows/mobile.yml` — **release on every push to main**: auto version `1.0.<run_number>`, build APK+AAB + unsigned IPA, publish GitHub Release with all three attached; secrets SUPABASE_URL/ANON_KEY
- [x] 14. Local verification: `flutter analyze` clean (info-only), `flutter test` green, **`flutter build apk --debug` succeeded** (full Gradle/plugin/manifest pipeline)

_Status: code complete ✅ · analyze clean · unit test green · debug APK built locally (263s). Remaining
is owner-side: push to GitHub + add secrets + Supabase redirect URL → CI produces the release APK._

## Owner (outside repo) — see admin_app/BUILD.md
- Create GitHub repo + push; add secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Supabase → Auth → Redirect URLs: add `com.nanosh.admin://login-callback`.
- Later: Android release keystore; Apple Developer account + iOS signing.
