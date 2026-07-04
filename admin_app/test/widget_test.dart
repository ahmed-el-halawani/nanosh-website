// Placeholder test. The app requires Supabase initialization + platform channels,
// so UI is validated via CI builds and on-device, not here.
import 'package:flutter_test/flutter_test.dart';

import 'package:nanosh_admin/data/constants.dart';

void main() {
  test('fmt formats thousands', () {
    expect(fmt(1750), '1,750 ج.م');
    expect(fmt(0), '0 ج.م');
  });
}
