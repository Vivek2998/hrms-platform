import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../leaves/providers/leave_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authNotifierProvider);
    final user = auth.valueOrNull?.user;
    final attendanceAsync = ref.watch(attendanceListProvider());
    final balancesAsync = ref.watch(leaveBalancesProvider);
    final scheme = Theme.of(context).colorScheme;
    final today = DateFormat('EEEE, d MMMM y').format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hi, ${user?.firstName ?? ''}!',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(today,
                style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
          ],
        ),
        actions: [
          if (user?.avatarUrl != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: CircleAvatar(
                backgroundImage: NetworkImage(user!.avatarUrl!),
                radius: 18,
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: CircleAvatar(
                radius: 18,
                child: Text(user?.firstName.substring(0, 1) ?? 'U'),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(attendanceListProvider);
          ref.invalidate(leaveBalancesProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _QuickActions(),
            const SizedBox(height: 20),
            Text('This Month',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    )),
            const SizedBox(height: 12),
            attendanceAsync.when(
              data: (records) {
                final present =
                    records.where((r) => r.status == 'PRESENT').length;
                final late = records.where((r) => r.status == 'LATE').length;
                final absent =
                    records.where((r) => r.status == 'ABSENT').length;
                return Row(
                  children: [
                    _StatCard('Present', '$present', Colors.green, context),
                    const SizedBox(width: 10),
                    _StatCard('Late', '$late', Colors.orange, context),
                    const SizedBox(width: 10),
                    _StatCard('Absent', '$absent', Colors.red, context),
                  ],
                );
              },
              loading: () => const LinearProgressIndicator(),
              error: (_, __) =>
                  const Text('Could not load attendance'),
            ),
            const SizedBox(height: 20),
            Text('Leave Balances',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    )),
            const SizedBox(height: 12),
            balancesAsync.when(
              data: (balances) => Column(
                children: balances
                    .where((b) => b.leaveTypeCode != 'LWP')
                    .map((b) => _LeaveBalanceTile(balance: b))
                    .toList(),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) =>
                  const Text('Could not load leave balances'),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      ('Punch In', Icons.fingerprint, '/attendance/punch'),
      ('Apply Leave', Icons.event_note, '/leaves/apply'),
      ('Payslips', Icons.receipt_long, '/payslips'),
    ];
    return Row(
      children: actions
          .map((a) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Card(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => context.go(a.$3),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Column(
                          children: [
                            Icon(a.$2,
                                color:
                                    Theme.of(context).colorScheme.primary),
                            const SizedBox(height: 6),
                            Text(a.$1,
                                style: const TextStyle(fontSize: 11),
                                textAlign: TextAlign.center),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ))
          .toList(),
    );
  }
}

Widget _StatCard(String label, String value, Color color, BuildContext ctx) =>
    Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            children: [
              Text(value,
                  style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: color)),
              const SizedBox(height: 4),
              Text(label,
                  style: const TextStyle(fontSize: 11),
                  textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );

class _LeaveBalanceTile extends StatelessWidget {
  final dynamic balance;
  const _LeaveBalanceTile({required this.balance});

  @override
  Widget build(BuildContext context) {
    final used = balance.usedDays as double;
    final total = balance.totalDays as double;
    final fraction = total > 0 ? (used / total).clamp(0.0, 1.0) : 0.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(balance.leaveTypeName as String,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                      '${balance.remainingDays} / ${balance.totalDays} days left',
                      style: const TextStyle(fontSize: 12)),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: fraction,
                borderRadius: BorderRadius.circular(4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
