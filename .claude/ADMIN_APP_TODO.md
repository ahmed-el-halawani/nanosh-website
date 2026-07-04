# Flutter admin app + GitHub Actions — TODO

Plan: [ADMIN_APP_PLAN.md](./ADMIN_APP_PLAN.md)
App id `com.nanosh.admin` · «نانوش الإدارة» · lives in `admin_app/` · no Apple account yet
(Android signed + iOS `--no-codesign`).

- [ ] 1. `git init` at root + `.gitignore` (node + Flutter)
- [ ] 2. Scaffold `admin_app/` (flutter create) + `pubspec.yaml` deps (supabase_flutter, image_picker, url_launcher, google_fonts)
- [ ] 3. `lib/data/constants.dart` — ORDER_AREAS, STATUS_LABEL, ITEM_STEPS, GENDERS, fmt, waLink
- [ ] 4. `lib/data/supabase.dart` — client + query helpers (getAllOrders full embed, products CRUD, uploadProductImage, order/item step add/update/delete, getProfile)
- [ ] 5. `lib/data/progress.dart` — orderProgress (area) + itemProgress (linear)
- [ ] 6. `lib/main.dart` — Supabase.initialize(pkce) + MaterialApp (ar/RTL/Tajawal theme) + auth gate
- [ ] 7. `lib/screens/login.dart` — email/password + Google/Facebook OAuth (redirect `com.nanosh.admin://login-callback`)
- [ ] 8. Deep-link registration — AndroidManifest intent-filter + iOS Info.plist CFBundleURLTypes (scheme `com.nanosh.admin`)
- [ ] 9. `lib/screens/shell.dart` — bottom nav (orders / production / products) + account/sign-out; «غير مصرح» for non-admins
- [ ] 10. `lib/screens/products.dart` — list + add/edit form (all fields) + image upload/URL + delete
- [ ] 11. `lib/screens/orders.dart` — list + detail (order-level area checklist + items → per-item editor)
- [ ] 12. `lib/screens/board.dart` — flattened items + 2-row chip filter + count + one-tap advance + item sheet editor
- [ ] 13. `.github/workflows/mobile.yml` — android (signed APK/AAB) + ios (`--no-codesign`) + release-on-tag; secrets SUPABASE_URL/ANON_KEY
- [ ] 14. Verify: CI android job green + APK artifact; ios job green

## Owner (outside repo)
- Create GitHub repo + push; add secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Supabase → Auth → Redirect URLs: add `com.nanosh.admin://login-callback`.
- Later: Android release keystore; Apple Developer account + iOS signing.
