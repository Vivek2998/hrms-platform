import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../leaves/providers/leave_provider.dart';
import '../../notifications/providers/notifications_provider.dart';
import '../../announcements/providers/announcements_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/shimmer_box.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authNotifierProvider);
    final user = auth.valueOrNull?.user;
    final attendanceAsync = ref.watch(attendanceListProvider());
    final balancesAsync = ref.watch(leaveBalancesProvider);
    final unreadAsync = ref.watch(unreadCountProvider);
    final announcementsAsync = ref.watch(announcementsListProvider);
    final today = DateFormat('EEEE, d MMMM').format(DateTime.now());

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(attendanceListProvider);
          ref.invalidate(leaveBalancesProvider);
          ref.invalidate(announcementsListProvider);
          ref.invalidate(unreadCountProvider);
        },
        child: CustomScrollView(
          slivers: [
            // ── Hero Header ────────────────────────────────────────────
            SliverToBoxAdapter(
              child: _HeroHeader(
                firstName: user?.firstName ?? '',
                avatarUrl: user?.avatarUrl,
                today: today,
                unreadAsync: unreadAsync,
                attendanceAsync: attendanceAsync,
              ),
            ),

            // ── Body Content ────────────────────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // Pinned announcements
                  announcementsAsync.maybeWhen(
                    data: (list) {
                      final pinned = list.where((a) => a.isPinned).toList();
                      if (pinned.isEmpty) return const SizedBox.shrink();
                      return Column(
                        children: [
                          const SizedBox(height: 16),
                          ...pinned.map((a) => _AnnouncementBanner(
                                title: a.title,
                                content: a.content,
                              )),
                        ],
                      );
                    },
                    orElse: () => const SizedBox.shrink(),
                  ),

                  const SizedBox(height: 20),
                  _SectionLabel('Quick Actions'),
                  const SizedBox(height: 12),
                  _QuickActionsGrid(),

                  const SizedBox(height: 24),
                  _SectionLabel('This Month'),
                  const SizedBox(height: 12),
                  _AttendanceStats(attendanceAsync: attendanceAsync),

                  const SizedBox(height: 24),
                  _SectionLabel('Leave Balances'),
                  const SizedBox(height: 12),
                  _LeaveBalancesSection(balancesAsync: balancesAsync),

                  // Latest announcements
                  announcementsAsync.maybeWhen(
                    data: (list) {
                      final unpinned =
                          list.where((a) => !a.isPinned).toList();
                      if (unpinned.isEmpty) return const SizedBox.shrink();
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 24),
                          _SectionLabel('Announcements'),
                          const SizedBox(height: 12),
                          ...unpinned.take(3).map((a) => _AnnouncementCard(
                                title: a.title,
                                content: a.content,
                                date: a.createdAt,
                              )),
                        ],
                      );
                    },
                    orElse: () => const SizedBox.shrink(),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Hero Header ──────────────────────────────────────────────────────────────

class _HeroHeader extends StatelessWidget {
  final String firstName;
  final String? avatarUrl;
  final String today;
  final AsyncValue<int> unreadAsync;
  final AsyncValue<dynamic> attendanceAsync;

  const _HeroHeader({
    required this.firstName,
    required this.avatarUrl,
    required this.today,
    required this.unreadAsync,
    required this.attendanceAsync,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.brandGradient),
      padding: EdgeInsets.only(
        top: MediaQuery.paddingOf(context).top + 16,
        left: 20,
        right: 20,
        bottom: 28,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hi, ${firstName.isEmpty ? 'there' : firstName}! 👋',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      today,
                      style: TextStyle(
                        color: Colors.white.withAlpha(200),
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
              // Notification bell
              _NotificationBell(unreadAsync: unreadAsync),
              const SizedBox(width: 8),
              // Avatar
              _Avatar(avatarUrl: avatarUrl, firstName: firstName),
            ],
          ),
          const SizedBox(height: 20),
          // Today's attendance summary
          _TodayStatus(attendanceAsync: attendanceAsync),
        ],
      ),
    );
  }
}

class _NotificationBell extends StatelessWidget {
  final AsyncValue<int> unreadAsync;
  const _NotificationBell({required this.unreadAsync});

  @override
  Widget build(BuildContext context) {
    final count = unreadAsync.valueOrNull ?? 0;
    return Stack(
      children: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined,
              color: Colors.white, size: 26),
          onPressed: () => context.push('/notifications'),
        ),
        if (count > 0)
          Positioned(
            top: 8,
            right: 8,
            child: IgnorePointer(
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                child: Text(
                  count > 99 ? '99+' : '$count',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _Avatar extends StatelessWidget {
  final String? avatarUrl;
  final String firstName;
  const _Avatar({required this.avatarUrl, required this.firstName});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withAlpha(120), width: 2),
      ),
      child: CircleAvatar(
        radius: 20,
        backgroundColor: Colors.white.withAlpha(40),
        backgroundImage:
            avatarUrl != null ? NetworkImage(avatarUrl!) : null,
        child: avatarUrl == null
            ? Text(
                firstName.isEmpty ? 'U' : firstName[0].toUpperCase(),
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16),
              )
            : null,
      ),
    );
  }
}

class _TodayStatus extends StatelessWidget {
  final AsyncValue<dynamic> attendanceAsync;
  const _TodayStatus({required this.attendanceAsync});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();

    return attendanceAsync.maybeWhen(
      data: (records) {
        final todayRecord = (records as List).cast<dynamic>().firstWhere(
              (r) {
                final d = r.date as DateTime;
                return d.year == now.year &&
                    d.month == now.month &&
                    d.day == now.day;
              },
              orElse: () => null,
            );
        final status =
            todayRecord?.status as String? ?? 'NOT_MARKED';
        final (label, icon, color) = switch (status) {
          'PRESENT' => ('Present Today', Icons.check_circle, AppColors.success),
          'LATE' => ('Late Today', Icons.schedule, AppColors.warning),
          'ABSENT' => ('Absent Today', Icons.cancel, AppColors.error),
          'HALF_DAY' => ('Half Day', Icons.timelapse, AppColors.warning),
          'ON_LEAVE' => ('On Leave', Icons.beach_access, AppColors.info),
          _ => ('Punch In Required', Icons.fingerprint, Colors.white70),
        };
        return _StatusChip(label: label, icon: icon, color: color);
      },
      loading: () => const SizedBox.shrink(),
      orElse: () => const SizedBox.shrink(),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  const _StatusChip(
      {required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withAlpha(25),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withAlpha(60)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Section label ─────────────────────────────────────────────────────────

Widget _SectionLabel(String text) => Text(
      text,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
    );

// ─── Quick Actions Grid ──────────────────────────────────────────────────────

class _QuickActionsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      _Action('Punch In', Icons.fingerprint_rounded, AppColors.primary,
          AppColors.primaryLight, '/attendance/punch'),
      _Action('Apply Leave', Icons.event_note_rounded, AppColors.success,
          AppColors.successLight, '/leaves/apply'),
      _Action('Payslips', Icons.receipt_long_rounded, AppColors.warning,
          AppColors.warningLight, '/payslips'),
      _Action('Team', Icons.people_rounded, AppColors.info, AppColors.infoLight,
          '/team'),
      _Action('Holidays', Icons.celebration_rounded, AppColors.holiday,
          AppColors.holidayBg, '/holidays'),
      _Action('My Docs', Icons.folder_rounded, const Color(0xFF059669),
          const Color(0xFFD1FAE5), '/documents'),
    ];

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 1.05,
      children: actions.map((a) => _QuickActionTile(action: a)).toList(),
    );
  }
}

class _Action {
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final String route;
  const _Action(
      this.label, this.icon, this.color, this.bgColor, this.route);
}

class _QuickActionTile extends StatelessWidget {
  final _Action action;
  const _QuickActionTile({super.key, required this.action});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push(action.route),
        child: Container(
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFE2E8F0)),
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: action.bgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(action.icon, color: action.color, size: 22),
              ),
              const SizedBox(height: 10),
              Text(
                action.label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Attendance Stats ────────────────────────────────────────────────────────

class _AttendanceStats extends StatelessWidget {
  final AsyncValue<dynamic> attendanceAsync;
  const _AttendanceStats({required this.attendanceAsync});

  @override
  Widget build(BuildContext context) {
    return attendanceAsync.when(
      data: (records) {
        final list = (records as List).cast<dynamic>();
        final present = list.where((r) => r.status == 'PRESENT').length;
        final late = list.where((r) => r.status == 'LATE').length;
        final absent = list.where((r) => r.status == 'ABSENT').length;
        final halfDay = list.where((r) => r.status == 'HALF_DAY').length;
        return Row(
          children: [
            _StatTile('Present', present, AppColors.success,
                AppColors.successLight, Icons.check_circle_outline),
            const SizedBox(width: 10),
            _StatTile('Late', late, AppColors.warning, AppColors.warningLight,
                Icons.schedule_outlined),
            const SizedBox(width: 10),
            _StatTile('Absent', absent, AppColors.error, AppColors.errorLight,
                Icons.cancel_outlined),
            const SizedBox(width: 10),
            _StatTile('Half Day', halfDay, AppColors.info, AppColors.infoLight,
                Icons.timelapse_outlined),
          ],
        );
      },
      loading: () => Row(
        children: List.generate(
          4,
          (_) => Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 10),
              child: ShimmerBox(
                  width: double.infinity, height: 88,
                  borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
      ),
      error: (_, __) => const Text('Could not load attendance'),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final Color bgColor;
  final IconData icon;

  const _StatTile(this.label, this.value, this.color, this.bgColor, this.icon);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 8),
            Text(
              '$value',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Leave Balances ──────────────────────────────────────────────────────────

class _LeaveBalancesSection extends StatelessWidget {
  final AsyncValue<dynamic> balancesAsync;
  const _LeaveBalancesSection({required this.balancesAsync});

  @override
  Widget build(BuildContext context) {
    return balancesAsync.when(
      data: (balances) {
        final filtered = (balances as List)
            .cast<dynamic>()
            .where((b) => b.leaveTypeCode != 'LWP')
            .toList();
        return Column(
          children: filtered
              .map((b) => _LeaveBalanceTile(balance: b))
              .toList(),
        );
      },
      loading: () => Column(
        children: List.generate(3, (_) => const ShimmerCard(height: 70)),
      ),
      error: (_, __) => const Text('Could not load leave balances'),
    );
  }
}

class _LeaveBalanceTile extends StatelessWidget {
  final dynamic balance;
  const _LeaveBalanceTile({required this.balance});

  @override
  Widget build(BuildContext context) {
    final used = balance.usedDays as double;
    final total = balance.totalDays as double;
    final remaining = balance.remainingDays as double;
    final fraction =
        total > 0 ? (used / total).clamp(0.0, 1.0) : 0.0;
    final pct =
        total > 0 ? ((used / total) * 100).round() : 0;

    Color barColor = AppColors.success;
    if (pct > 80) barColor = AppColors.error;
    else if (pct > 60) barColor = AppColors.warning;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                balance.leaveTypeName as String,
                style:
                    const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${remaining.toStringAsFixed(0)} / ${total.toStringAsFixed(0)} days',
                  style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: fraction,
              backgroundColor: const Color(0xFFE2E8F0),
              color: barColor,
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Announcement widgets ────────────────────────────────────────────────────

class _AnnouncementBanner extends StatelessWidget {
  final String title;
  final String content;
  const _AnnouncementBanner({required this.title, required this.content});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primaryLight,
            AppColors.primaryLight.withAlpha(200),
          ],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withAlpha(60)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.primary.withAlpha(30),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.campaign, color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryDark,
                        fontSize: 14)),
                const SizedBox(height: 4),
                Text(
                  content,
                  style: TextStyle(
                      fontSize: 13,
                      color: AppColors.primaryDark.withAlpha(200)),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final String title;
  final String content;
  final DateTime date;
  const _AnnouncementCard(
      {required this.title, required this.content, required this.date});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('d MMM').format(date);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.campaign_outlined,
                  size: 16, color: AppColors.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14)),
              ),
              Text(dateStr,
                  style: TextStyle(
                      fontSize: 11,
                      color: Theme.of(context).colorScheme.onSurfaceVariant)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: TextStyle(
                fontSize: 13,
                color: Theme.of(context).colorScheme.onSurfaceVariant),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
