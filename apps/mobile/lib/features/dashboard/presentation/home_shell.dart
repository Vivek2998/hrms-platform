import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

class HomeShell extends StatelessWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  static const _tabs = [
    ('/dashboard', Icons.home_outlined, Icons.home_rounded, 'Home'),
    ('/attendance', Icons.fingerprint_outlined, Icons.fingerprint, 'Attendance'),
    ('/leaves', Icons.event_note_outlined, Icons.event_note_rounded, 'Leaves'),
    ('/payslips', Icons.receipt_long_outlined, Icons.receipt_long_rounded, 'Payslips'),
    ('/profile', Icons.person_outline_rounded, Icons.person_rounded, 'Profile'),
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
