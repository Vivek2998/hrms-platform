import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeShell extends StatelessWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  static const _tabs = [
    ('/dashboard', Icons.dashboard_outlined, Icons.dashboard, 'Home'),
    ('/attendance', Icons.fingerprint_outlined, Icons.fingerprint, 'Attendance'),
    ('/leaves', Icons.event_note_outlined, Icons.event_note, 'Leaves'),
    ('/payslips', Icons.receipt_long_outlined, Icons.receipt_long, 'Payslips'),
    ('/profile', Icons.person_outline, Icons.person, 'Profile'),
  ];

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
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: current,
        onDestinationSelected: (i) => context.go(_tabs[i].$1),
        destinations: _tabs
            .map((t) => NavigationDestination(
                  icon: Icon(t.$2),
                  selectedIcon: Icon(t.$3),
                  label: t.$4,
                ))
            .toList(),
      ),
    );
  }
}
