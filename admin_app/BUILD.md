# نانوش الإدارة — Flutter admin app

Native Android/iOS admin app for the Nanosh shop. Talks to the same Supabase backend as the web
app (no backend changes). Lives in `admin_app/`.

## Run locally
Pass the Supabase values as `--dart-define` (never hardcoded):

```bash
cd admin_app
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=https://wkxftfdwdxtzqgmgjdtn.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=<your anon/publishable key>
```

Build a release APK locally:

```bash
flutter build apk --release \
  --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
```

## GitHub Actions (`.github/workflows/mobile.yml`)
Every **push to `main`** (or a manual run) auto-versions and publishes a GitHub **Release**:
- version = `1.0.<run_number>`, tag `v1.0.<run_number>` (passed to the build as build-name/number).
- builds the **APK** + **AAB** (Android) and an **unsigned IPA** (iOS, `--no-codesign` then packaged).
- creates the release with auto-generated notes and attaches `*.apk`, `*.aab`, and `*-unsigned.ipa`.

The IPA is **unsigned** (no Apple account yet) — it will not install on a device until iOS signing is
added; it's produced so the release is complete and ready to swap to a signed `.ipa` later.

Add these repo **secrets** (Settings → Secrets and variables → Actions):
- `SUPABASE_URL` = `https://wkxftfdwdxtzqgmgjdtn.supabase.co`
- `SUPABASE_ANON_KEY` = the project's anon/publishable key

## One-time Supabase config (for Google/Facebook login)
Supabase Dashboard → Authentication → URL Configuration → **Redirect URLs** → add:

```
com.nanosh.admin://login-callback
```

(Google/Facebook providers are already configured for the web app; no change needed there.)

## Later (when ready)
- **Android release signing**: create a keystore, add it + credentials as CI secrets, wire
  `android/app/build.gradle` signingConfig. (CI currently signs the APK with the debug key.)
- **iOS**: needs an Apple Developer account ($99/yr). Add the certificate, provisioning profile, and
  App Store Connect key as CI secrets, then switch the `ios` job to a signed
  `flutter build ipa` and upload to TestFlight.

## Access
Only `profiles.is_admin = true` accounts can use the app (others see «غير مصرح»). Grant admin via
SQL: `update public.profiles set is_admin = true where id = '<auth user id>';`
