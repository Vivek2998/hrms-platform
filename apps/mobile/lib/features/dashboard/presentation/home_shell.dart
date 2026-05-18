import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/geofence/geofence_manager.dart';
import '../../attendance/providers/geofence_provider.dart';

class HomeShell extends ConsumerStatefulWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  @override
  ConsumerState<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends ConsumerState<HomeShell> {
  static const _tabs = [
    ('/dashboard', Icons.home_outlined, Icons.home_rounded, 'Home'),
    ('/attendance', Icons.fingerprint_outlined, Icons.fingerprint, 'Attendance'),
    ('/leaves', Icons.event_note_outlined, Icons.event_note_rounded, 'Leaves'),
    ('/payslips', Icons.receipt_long_outlined, Icons.receipt_long_rounded, 'Payslips'),
    ('/profile', Icons.person_outline_rounded, Icons.person_rounded, 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    GeofenceManager.instance.onNotificationTapped = () {
      if (mounted) context.go('/attendance/punch');
    };
    _maybeStartGeofence();
  }

  Future<void> _maybeStartGeofence() async {
    try {
      final enabled = await ref.read(smartPunchNotifierProvider.future);
      if (!enabled || !mounted) return;
      final config = await ref.read(geofenceConfigProvider.future);
      if (config != null) {
        await GeofenceManager.instance.start(config: config);
      }
    } catch (_) {}
  }

  int _indexOf(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    for (var i = 0; i < _tabs.length; i++) {
      if (loc.startsWith(_tabs[i].$1)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final current = _indexOf(context);
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(15),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: NavigationBar(
          selectedIndex: current,
          onDestinationSelected: (i) => context.go(_tabs[i].$1),
          height: 64,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          animationDuration: const Duration(milliseconds: 300),
          destinations: _tabs
              .map((t) => NavigationDestination(
                    icon: Icon(t.$2, size: 24),
                    selectedIcon: Icon(t.$3,
                        size: 24, color: AppColors.primary),
                    label: t.$4,
                  ))
              .toList(),
        ),
      ),
    );
  }
}
