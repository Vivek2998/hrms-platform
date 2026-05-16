import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Fires when the auth interceptor clears tokens due to an expired/invalid session.
/// AuthNotifier listens to this and transitions to unauthenticated state.
final sessionExpiredProvider = StateProvider<int>((ref) => 0);
