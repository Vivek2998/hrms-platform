import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';
import '../data/models/leave_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../../comp_off/providers/comp_off_provider.dart';
import '../../../core/theme/app_theme.dart';

class LeavesScreen extends ConsumerWidget {
  const LeavesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leavesAsync = ref.watch(leaveListProvider);
    final balancesAsync = ref.watch(leaveBalancesProvider);
    final compOffAsync = ref.watch(compOffListProvider);
    final auth = ref.watch(authNotifierProvider);
    final role = auth.valueOrNull?.user?.role ?? 'EMPLOYEE';
    final isManager = role != 'EMPLOYEE';

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(leaveListProvider);
          ref.invalidate(leaveBalancesProvider);
          ref.invalidate(leaveTypesProvider);
          ref.invalidate(pendingLeavesProvider);
          ref.invalidate(compOffListProvider);
        },
        child: CustomScrollView(
          slivers: [
            // ── AppBar ─────────────────────────────────────────────
            SliverAppBar(
              title: const Text('My Leaves'),
              floating: true,
              snap: true,
              elevation: 0,
              scrolledUnderElevation: 0,
            ),

            // ── Manager banner ─────────────────────────────────────
            if (isManager)
              SliverToBoxAdapter(
                child: _PendingApprovalsBanner(
                  onTap: () => context.push('/leaves/pending'),
                ),
              ),

            // ── Leave Balances ─────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: const Text(
                  'Leave Balances',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverToBoxAdapter(
                child: balancesAsync.when(
                  data: (balances) {
                    final filtered = balances
                        .where((b) => b.leaveTypeCode != 'LWP')
                        .toList();
                    final compOffList = compOffAsync.valueOrNull ?? [];
                    final approvedCount = compOffList
                        .where((r) => r.status.toUpperCase() == 'APPROVED')
                        .length;
                    final totalCount = compOffList.length;
                    if (filtered.isEmpty) return const SizedBox.shrink();
                    final itemCount = filtered.length + 1;
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        mainAxisExtent: 88,
                      ),
                      itemCount: itemCount,
                      itemBuilder: (_, i) {
                        if (i < filtered.length) {
                          return _BalanceCard(balance: filtered[i]);
                        }
                        return _CompOffBalanceCard(
                          approved: approvedCount,
                          total: totalCount,
                        );
                      },
                    );
                  },
                  loading: () => const _BalanceSkeleton(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
            ),

            // ── WFH / On-Duty Quick Apply ──────────────────────────
            SliverToBoxAdapter(
              child: _QuickApplyRow(
                leaveTypesAsync: ref.watch(leaveTypesProvider),
              ),
            ),

            // ── History Header ─────────────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
              sliver: SliverToBoxAdapter(
                child: Text(
                  'Leave History',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
            ),

            // ── Leave List ─────────────────────────────────────────
            leavesAsync.when(
              data: (leaves) {
                if (leaves.isEmpty) {
                  return const SliverFillRemaining(child: _EmptyLeaves());
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 4),
                  sliver: SliverList.separated(
                    itemCount: leaves.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: 8),
                    itemBuilder: (_, i) =>
                        _LeaveTile(leave: leaves[i]),
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

            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/leaves/apply'),
        icon: const Icon(Icons.add),
        label: const Text('Apply Leave'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
    );
  }
}

// ─── Balance Card ─────────────────────────────────────────────────────────────

class _BalanceCard extends StatelessWidget {
  final LeaveBalance balance;
  const _BalanceCard({required this.balance});

  Color _typeColor(String code) => switch (code) {
        'EL' || 'AL' => AppColors.success,
        'SL' => AppColors.error,
        'CL' => AppColors.info,
        'ML' || 'PL' => AppColors.holiday,
        'CO' || 'COL' => AppColors.warning,
        _ => AppColors.primary,
      };

  @override
  Widget build(BuildContext context) {
    final color = _typeColor(balance.leaveTypeCode);
    final used = balance.usedDays;
    final total = balance.totalDays;
    final hasAny = total > 0;
    final activeColor = hasAny ? color : Colors.grey[400]!;
    final badgeBg = hasAny ? color.withAlpha(18) : Colors.grey[100]!;
    final cardBg = hasAny
        ? (Theme.of(context).brightness == Brightness.dark
            ? Theme.of(context).colorScheme.surfaceContainer
            : Colors.white)
        : (Theme.of(context).brightness == Brightness.dark
            ? Theme.of(context).colorScheme.surfaceContainerLow
            : const Color(0xFFF8FAFC));
    final fraction = hasAny ? (used / total).clamp(0.0, 1.0) : 0.0;

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasAny ? activeColor.withAlpha(60) : const Color(0xFFEEF0F2),
        ),
        boxShadow: hasAny
            ? [BoxShadow(color: Colors.black.withAlpha(6), blurRadius: 8, offset: const Offset(0, 2))]
            : [],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: badgeBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              balance.leaveTypeCode,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: activeColor,
                letterSpacing: 0.5,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: balance.remainingDays.toStringAsFixed(0),
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: activeColor,
                      ),
                    ),
                    TextSpan(
                      text: ' / ${total.toStringAsFixed(0)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                hasAny ? balance.leaveTypeName : 'Not applicable',
                style: TextStyle(
                  fontSize: 11,
                  color: hasAny
                      ? Theme.of(context).colorScheme.onSurfaceVariant
                      : Colors.grey[400],
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: fraction,
                  backgroundColor: activeColor.withAlpha(20),
                  color: activeColor,
                  minHeight: 4,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BalanceSkeleton extends StatelessWidget {
  const _BalanceSkeleton();

  @override
  Widget build(BuildContext context) => GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.6,
        children: List.generate(
          4,
          (_) => Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      );
}

// ─── WFH / On-Duty Quick Apply ────────────────────────────────────────────────

class _QuickApplyRow extends StatelessWidget {
  final AsyncValue<List<ApiLeaveType>> leaveTypesAsync;
  const _QuickApplyRow({required this.leaveTypesAsync});

  static bool _isWfh(ApiLeaveType t) {
    final c = t.code.toUpperCase();
    final n = t.name.toLowerCase();
    return c == 'WFH' || c == 'WH' || n.contains('work from home');
  }

  static bool _isOnDuty(ApiLeaveType t) {
    final c = t.code.toUpperCase();
    final n = t.name.toLowerCase();
    return c == 'OD' || c == 'ONDUTY' || n.contains('on duty') ||
        n.contains('on-duty');
  }

  @override
  Widget build(BuildContext context) {
    return leaveTypesAsync.when(
      data: (types) {
        final wfh = types.where(_isWfh).firstOrNull;
        final od = types.where(_isOnDuty).firstOrNull;
        if (wfh == null && od == null) return const SizedBox.shrink();

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Quick Requests',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  if (wfh != null) ...[
                    Expanded(
                      child: _QuickTile(
                        label: 'Work From Home',
                        icon: Icons.home_work_outlined,
                        color: AppColors.info,
                        onTap: () => context.push(
                            '/leaves/apply?typeId=${wfh.id}'),
                      ),
                    ),
                    if (od != null) const SizedBox(width: 10),
                  ],
                  if (od != null)
                    Expanded(
                      child: _QuickTile(
                        label: 'On Duty',
                        icon: Icons.work_outline_rounded,
                        color: AppColors.warning,
                        onTap: () => context.push(
                            '/leaves/apply?typeId=${od.id}'),
                      ),
                    ),
                ],
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _QuickTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _QuickTile(
      {required this.label,
      required this.icon,
      required this.color,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withAlpha(60)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
            Icon(Icons.add_circle_outline_rounded, color: color, size: 18),
          ],
        ),
      ),
    );
  }
}

// ─── Leave Tile ───────────────────────────────────────────────────────────────

class _LeaveTile extends ConsumerWidget {
  final CachedLeaveRequest leave;
  const _LeaveTile({required this.leave});

  Color _statusColor(String s) => switch (s) {
        'APPROVED' => AppColors.success,
        'REJECTED' => AppColors.error,
        'CANCELLED' => Colors.grey,
        _ => AppColors.warning,
      };

  IconData _statusIcon(String s) => switch (s) {
        'APPROVED' => Icons.check_circle_rounded,
        'REJECTED' => Icons.cancel_rounded,
        'CANCELLED' => Icons.remove_circle_rounded,
        _ => Icons.schedule_rounded,
      };

  bool get _canCancel =>
      leave.status == 'PENDING' || leave.status == 'APPROVED';

  void _showDetails(BuildContext context, WidgetRef ref) {
    final color = _statusColor(leave.status);
    final fmt = DateFormat('d MMM yyyy');
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: Text(
                    leave.leaveTypeName,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: color.withAlpha(20),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    leave.status,
                    style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.w700,
                        fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _DetailRow(Icons.calendar_today_outlined, 'Period',
                '${fmt.format(leave.startDate)} – ${fmt.format(leave.endDate)}'),
            _DetailRow(Icons.access_time_outlined, 'Duration',
                '${leave.totalDays} day${leave.totalDays != 1 ? "s" : ""}'),
            _DetailRow(Icons.notes_outlined, 'Reason', leave.reason),
            if (leave.remarks != null && leave.remarks!.isNotEmpty)
              _DetailRow(Icons.comment_outlined, 'Remarks', leave.remarks!),
            _DetailRow(Icons.schedule_outlined, 'Applied on',
                DateFormat('d MMM yyyy, h:mm a').format(leave.appliedAt)),
            if (_canCancel) ...[
              const SizedBox(height: 24),
              Consumer(builder: (ctx, cRef, _) {
                final cancelState =
                    cRef.watch(cancelLeaveNotifierProvider);
                return SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton.icon(
                    onPressed: cancelState.isLoading
                        ? null
                        : () => _confirmCancel(ctx, cRef),
                    icon: cancelState.isLoading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.cancel_outlined, size: 18),
                    label: Text(cancelState.isLoading
                        ? 'Cancelling…'
                        : 'Cancel This Leave'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }

  void _confirmCancel(BuildContext context, WidgetRef ref) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Leave'),
        content: Text(
            'Are you sure you want to cancel your ${leave.leaveTypeName} request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('No'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: AppColors.error),
            onPressed: () async {
              Navigator.of(ctx).pop();
              await ref
                  .read(cancelLeaveNotifierProvider.notifier)
                  .cancel(leave.leaveId);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final color = _statusColor(leave.status);
    final fmt = DateFormat('d MMM');
    final scheme = Theme.of(context).colorScheme;
    final isSameDay = leave.startDate.isAtSameMomentAs(leave.endDate);

    return GestureDetector(
      onTap: () => _showDetails(context, ref),
      child: Container(
        decoration: BoxDecoration(
          color: scheme.brightness == Brightness.dark
              ? scheme.surfaceContainer
              : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: IntrinsicHeight(
          child: Row(
            children: [
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(14),
                    bottomLeft: Radius.circular(14),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              leave.leaveTypeName,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700, fontSize: 14),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              isSameDay
                                  ? fmt.format(leave.startDate)
                                  : '${fmt.format(leave.startDate)} – ${fmt.format(leave.endDate)}',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: scheme.onSurfaceVariant),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${leave.totalDays} day${leave.totalDays != 1 ? "s" : ""}',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: scheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: color.withAlpha(18),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(_statusIcon(leave.status),
                                    size: 12, color: color),
                                const SizedBox(width: 4),
                                Text(
                                  leave.status,
                                  style: TextStyle(
                                    color: color,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (_canCancel)
                            Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                'Tap to cancel',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        fontSize: 11,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w500)),
                Text(value,
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyLeaves extends StatelessWidget {
  const _EmptyLeaves();

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.event_note_rounded,
                  size: 48, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            const Text(
              'No leave requests yet',
              style:
                  TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Your leave history will appear here',
              style: TextStyle(
                  fontSize: 13,
                  color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ],
        ),
      );
}

// ─── Comp-Off Balance Card ────────────────────────────────────────────────────

class _CompOffBalanceCard extends StatelessWidget {
  final int approved;
  final int total;
  const _CompOffBalanceCard({required this.approved, required this.total});

  @override
  Widget build(BuildContext context) {
    final hasAny = total > 0;
    final color = hasAny ? AppColors.warning : Colors.grey[400]!;
    final badgeBg = hasAny ? AppColors.warning.withAlpha(18) : Colors.grey[100]!;
    final cardBg = hasAny
        ? (Theme.of(context).brightness == Brightness.dark
            ? Theme.of(context).colorScheme.surfaceContainer
            : Colors.white)
        : (Theme.of(context).brightness == Brightness.dark
            ? Theme.of(context).colorScheme.surfaceContainerLow
            : const Color(0xFFF8FAFC));
    final fraction = hasAny ? (approved / total).clamp(0.0, 1.0) : 0.0;

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasAny ? color.withAlpha(60) : const Color(0xFFEEF0F2),
        ),
        boxShadow: hasAny
            ? [BoxShadow(color: Colors.black.withAlpha(6), blurRadius: 8, offset: const Offset(0, 2))]
            : [],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: badgeBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'CO',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: color,
                letterSpacing: 0.5,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: '$approved',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: color,
                      ),
                    ),
                    TextSpan(
                      text: ' / $total',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'Comp-Off',
                style: TextStyle(
                  fontSize: 11,
                  color: hasAny
                      ? Theme.of(context).colorScheme.onSurfaceVariant
                      : Colors.grey[400],
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: fraction,
                  backgroundColor: color.withAlpha(20),
                  color: color,
                  minHeight: 4,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Pending Approvals Banner ─────────────────────────────────────────────────

class _PendingApprovalsBanner extends ConsumerWidget {
  final VoidCallback onTap;
  const _PendingApprovalsBanner({required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingAsync = ref.watch(pendingLeavesProvider);
    final count = pendingAsync.valueOrNull?.length ?? 0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.warning.withAlpha(30),
                  AppColors.warning.withAlpha(10),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: AppColors.warning.withAlpha(80)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.pending_actions_rounded,
                      color: AppColors.warning, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Pending Approvals',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      Text(
                        count == 0
                            ? 'No pending requests'
                            : '$count request${count != 1 ? "s" : ""} awaiting your decision',
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context)
                              .colorScheme
                              .onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
