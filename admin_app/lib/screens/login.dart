import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../theme.dart';

const _redirect = 'com.nanosh.admin://login-callback';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _show(String msg) => setState(() => _error = msg);

  Future<void> _loginEmail() async {
    final email = _email.text.trim();
    final pass = _password.text;
    if (email.isEmpty || pass.isEmpty) return _show('يرجى إدخال البريد وكلمة المرور');
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.signInWithPassword(email: email, password: pass);
      // AuthGate reacts to the auth state change.
    } on AuthException catch (e) {
      _show(_translate(e.message));
    } catch (e) {
      _show(e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _oauth(OAuthProvider provider) async {
    setState(() => _error = null);
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        provider,
        redirectTo: _redirect,
        authScreenLaunchMode: LaunchMode.externalApplication,
      );
    } catch (e) {
      _show('تعذّر تسجيل الدخول — تأكدي من الإعداد.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: cream,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 8),
                  const Text('نانوش',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: teal)),
                  const SizedBox(height: 6),
                  const Text('لوحة الإدارة',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 15, color: muted)),
                  const SizedBox(height: 28),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    textDirection: TextDirection.ltr,
                    decoration: const InputDecoration(
                        labelText: 'البريد الإلكتروني', hintText: 'you@example.com'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    textDirection: TextDirection.ltr,
                    decoration: const InputDecoration(labelText: 'كلمة المرور'),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(11),
                      decoration: BoxDecoration(
                          color: const Color(0xFFFBEEEE),
                          borderRadius: BorderRadius.circular(12)),
                      child: Text(_error!,
                          style: const TextStyle(color: Color(0xFFA15B5B), fontSize: 13)),
                    ),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 52,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                          backgroundColor: teal,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
                      onPressed: _busy ? null : _loginEmail,
                      child: _busy
                          ? const SizedBox(
                              width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('تسجيل الدخول',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(children: [
                    const Expanded(child: Divider(color: Color(0xFFE7DDCE))),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Text('أو تابعي عبر', style: TextStyle(color: muted, fontSize: 12.5)),
                    ),
                    const Expanded(child: Divider(color: Color(0xFFE7DDCE))),
                  ]),
                  const SizedBox(height: 16),
                  _OAuthButton(
                    label: 'المتابعة عبر Google',
                    bg: Colors.white,
                    fg: const Color(0xFF3C4043),
                    border: const Color(0xFFE2D8C8),
                    onPressed: () => _oauth(OAuthProvider.google),
                  ),
                  const SizedBox(height: 10),
                  _OAuthButton(
                    label: 'المتابعة عبر Facebook',
                    bg: const Color(0xFF1877F2),
                    fg: Colors.white,
                    border: const Color(0xFF1877F2),
                    onPressed: () => _oauth(OAuthProvider.facebook),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OAuthButton extends StatelessWidget {
  final String label;
  final Color bg, fg, border;
  final VoidCallback onPressed;
  const _OAuthButton(
      {required this.label,
      required this.bg,
      required this.fg,
      required this.border,
      required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 50,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          side: BorderSide(color: border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        onPressed: onPressed,
        child: Text(label, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

String _translate(String m) {
  if (RegExp('Invalid login credentials', caseSensitive: false).hasMatch(m)) {
    return 'بيانات الدخول غير صحيحة';
  }
  if (RegExp('Email not confirmed', caseSensitive: false).hasMatch(m)) {
    return 'يرجى تأكيد بريدك أولًا';
  }
  return m;
}
