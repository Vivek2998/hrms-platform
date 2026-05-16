import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';
import '../data/models/leave_model.dart';
import '../../auth/providers/auth_provider.dart';

class LeavesScreen extends ConsumerWidget {
  const LeavesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leavesAsync = ref.watch(leaveListProvider);
    final balancesAsync = ref.watch(leaveBalancesProvider);
    final auth = ref.watch(authNotifierProvider);
    final role = auth.valueOrNull?.user?.role ?? 'EMPLOYEE';
    final isManager = role != 'EMPLOYEE';

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Leaves'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(leaveListProvider);
              ref.invalidate(leaveBalancesProvider);
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/leaves/apply'),
        icon: const Icon(Icons.add),
        label: const Text('Apply Leave'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(leaveListProvider);
          ref.invalidate(leaveBalancesProvider);
        },
        child: CustomScrollView(
          slivers: [
            if (isManager)
              SliverToBoxAdapter(
                child: _PendingApprovalsBanner(
                  onTap: () => context.push('/leaves/pending'),
                ),
              ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Text('Leave Balances',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
              ),
            ),
            SliverToBoxAdapter(
              child: balancesAsync.when(
                data: (balances) => SizedBox(
                  height: 130,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: balances.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 10),
                    itemBuilder: (_, i) => _BalanceChip(balance: balances[i]),
                  ),
                ),
                loading: () => const Padding(
                  padding: EdgeInsets.all(16),
                  child: LinearProgressIndicator(),
                ),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Text('Leave History',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
              ),
            ),
            leavesAsync.when(
              data: (leaves) {
                if (leaves.isEmpty) {
                  return const SliverFillRemaining(
                    child: Center(child: Text('No leave requests yet')),
                  );
                }
                return SliverPadding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  sliver: SliverList.separated(
                    itemCount: leaves.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _LeaveTile(leave: leaves[i]),
                  ),
                );
              },
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => SliverFillRemaining(
                child: Center(child: Text('Error: $e')),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 80)),
          ],
        ),
      ),
    );
  }
}

class _BalanceChip extends StatelessWidget {
  final LeaveBalance balance;
  const _BalanceChip({required this.balance});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${balance.remainingDays.toStringAsFixed(0)}',
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: scheme.primary),
            ),
            Text(balance.leaveTypeCode,
                style: const TextStyle(fontSize: 11)),
            Text('of ${balance.totalDays.toStringAsFixed(0)} days',
                style:
                    TextStyle(fontSize: 10, color: scheme.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}

class _LeaveTile extends StatelessWidget {
  final CachedLeaveRequest leave;
  const _LeaveTile({required this.leave});

  Color _statusColor(String s) => switch (s) {
        'APPROVED' => Colors.green,
        'REJECTED' => Colors.red,
        'CANCELLED' => Colors.grey,
        _ => Colors.orange,
      };

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(leave.status);
    final fmt = DateFormat('d MMM y');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 52,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(leave.leaveTypeName,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 3),
                  Text(
                    '${fmt.format(leave.startDate)} – ${fmt.format(leave.endDate)}',
                    style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                  Text(
                    '${leave.totalDays} day${leave.totalDays != 1 ? "s" : ""}',
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                leave.status,
                style: TextStyle(
                    color: color,
                    fontSize: 11,
                    fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingApprovalsBanner extends ConsumerWidget {
  final VoidCallback onTap;
  const _PendingApprovalsBanner({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingLeavesProvider);
    final scheme = Theme.of(context).colorScheme;
    final count = pendingAsync.valueOrNull?.length ?? 0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: scheme.tertiaryContainer,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(Icons.pending_actions, color: scheme.onTertiaryContainer),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pending Approvals',
                      style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: scheme.onTertiaryContainer),
                    ),
                    pendingAsync.when(
                      data: (leaves) => Text(
                        count == 0
                            ? 'No pending requests'
                            : '$count request${count != 1 ? "s" : ""} awaiting your decision',
                        style: TextStyle(
                            fontSize: 12, color: scheme.onTertiaryContainer),
                      ),
                      loading: () => Text('Loading...',
                          style: TextStyle(
                              fontSize: 12, color: scheme.onTertiaryContainer)),
                      error: (_, __) => Text('Tap to view',
                          style: TextStyle(
                              fontSize: 12, color: scheme.onTertiaryContainer)),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: scheme.onTertiaryContainer),
            ],
          ),
        ),
      ),
    );
  }
}
