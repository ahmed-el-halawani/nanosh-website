import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'theme.dart';
import 'data/api.dart';
import 'screens/login.dart';
import 'screens/shell.dart';

// The Supabase URL + anon key are public by design (RLS protects the data; the
// same anon key already ships in the web app's browser bundle). Defaults let the
// app run out of the box; `--dart-define` still overrides them if needed.
const _supabaseUrl = 'https://wkxftfdwdxtzqgmgjdtn.supabase.co';
const _supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGZ0ZmR3ZHh0enFnbWdqZHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzY2MDEsImV4cCI6MjA5ODY1MjYwMX0.kEOul8jC4Hppcx3Rad34of8p291DhstKhQTrhKSh6q8';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: _supabaseUrl,
    anonKey: _supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );
  runApp(const NanoshAdminApp());
}

class NanoshAdminApp extends StatelessWidget {
  const NanoshAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'نانوش الإدارة',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      builder: (context, child) =>
          Directionality(textDirection: TextDirection.rtl, child: child!),
      home: const AuthGate(),
    );
  }
}

// Routes between login / admin shell / not-authorized based on the session + is_admin flag.
class AuthGate extends StatefulWidget {
  const AuthGate({super.key});
  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  Session? _session;
  bool _checkingAdmin = false;
  bool? _isAdmin;

  @override
  void initState() {
    super.initState();
    _session = Supabase.instance.client.auth.currentSession;
    if (_session != null) _loadAdmin();
    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (!mounted) return;
      final s = data.session;
      setState(() {
        _session = s;
        _isAdmin = null;
      });
      if (s != null) {
        _loadAdmin();
      }
    });
  }

  Future<void> _loadAdmin() async {
    setState(() => _checkingAdmin = true);
    bool admin = false;
    try {
      final uid = Supabase.instance.client.auth.currentUser?.id;
      if (uid != null) {
        final p = await getProfile(uid);
        admin = p?['is_admin'] == true;
      }
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      _isAdmin = admin;
      _checkingAdmin = false;
    });
  }

  Future<void> _signOut() async {
    await Supabase.instance.client.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    if (_session == null) return const LoginScreen();
    if (_checkingAdmin || _isAdmin == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: teal)),
      );
    }
    if (_isAdmin == false) return NotAuthorized(onSignOut: _signOut);
    return const AdminShell();
  }
}

class NotAuthorized extends StatelessWidget {
  final Future<void> Function() onSignOut;
  const NotAuthorized({super.key, required this.onSignOut});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'غير مصرح',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: ink,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'هذا التطبيق مخصّص لإدارة المتجر فقط.',
                textAlign: TextAlign.center,
                style: TextStyle(color: muted),
              ),
              const SizedBox(height: 20),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: teal),
                onPressed: onSignOut,
                child: const Text('تسجيل الخروج'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
