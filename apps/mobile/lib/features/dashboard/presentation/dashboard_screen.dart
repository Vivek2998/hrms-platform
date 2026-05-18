import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../../attendance/providers/attendance_provider.dart';
import '../../notifications/providers/notifications_provider.dart';
import '../../announcements/providers/announcements_provider.dart';
import '../providers/dashboard_provider.dart';
import '../data/dashboard_model.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/shimmer_box.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authNotifierProvider);
    final user = auth.valueOrNull?.user;
    final orgName = auth.valueOrNull?.orgName;
    final orgLogoUrl = auth.valueOrNull?.orgLogoUrl;
    final attendanceAsync = ref.watch(attendanceListProvider());
    final unreadAsync = ref.watch(unreadCountProvider);
    final announcementsAsync = ref.watch(announcementsListProvider);
    final today = DateFormat('EEEE, d MMMM').format(DateTime.now());

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            onPressed: () => context.push('/helpdesk'),
            backgroundColor: const Color(0xFFF97316),
            foregroundColor: Colors.white,
            elevation: 10,
            child: const Icon(Icons.support_agent_rounded, size: 24),
          ),
          const SizedBox(height: 4),
          const Text(
            'Helpdesk',
            style: TextStyle(
              color: Color(0xFFF97316),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(attendanceListProvider);
          ref.invalidate(announcementsListProvider);
          ref.invalidate(unreadCountProvider);
          ref.invalidate(todayBirthdaysProvider);
        },
        child: CustomScrollView(
          slivers: [
            // ── Hero Header ────────────────────────────────────────────
            SliverToBoxAdapter(
              child: _HeroHeader(
                firstName: user?.firstName ?? '',
                avatarUrl: user?.avatarUrl,
                orgName: orgName,
                orgLogoUrl: orgLogoUrl,
                today: today,
                unreadAsync: unreadAsync,
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

                  _BirthdaySection(),

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
  final String? orgName;
  final String? orgLogoUrl;
  final String today;
  final AsyncValue<int> unreadAsync;

  const _HeroHeader({
    required this.firstName,
    required this.avatarUrl,
    required this.orgName,
    required this.orgLogoUrl,
    required this.today,
    required this.unreadAsync,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.brandGradient),
      padding: EdgeInsets.only(
        top: MediaQuery.paddingOf(context).top + 16,
        left: 20,
        right: 20,
        bottom: 24,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: greeting + notification bell + avatar
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
              _NotificationBell(unreadAsync: unreadAsync),
              const SizedBox(width: 8),
              _Avatar(avatarUrl: avatarUrl, firstName: firstName),
            ],
          ),
          const SizedBox(height: 16),
          // Row 2: org branding
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withAlpha(30),
                  border: Border.all(color: Colors.white.withAlpha(80), width: 1.5),
                  image: orgLogoUrl != null
                      ? DecorationImage(
                          image: NetworkImage(orgLogoUrl!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: orgLogoUrl == null
                    ? const Icon(Icons.business_rounded, color: Colors.white, size: 16)
                    : null,
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  orgName ?? 'HRMS',
                  style: TextStyle(
                    color: Colors.white.withAlpha(230),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
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
        radius: 24,
        backgroundColor: Colors.white.withAlpha(40),
        backgroundImage:
            avatarUrl != null ? NetworkImage(avatarUrl!) : null,
        child: avatarUrl == null
            ? Text(
                firstName.isEmpty ? 'U' : firstName[0].toUpperCase(),
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18),
              )
            : null,
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
      _Action('Team', Icons.people_rounded, AppColors.info, AppColors.infoLight,
          '/team'),
      _Action('Holidays', Icons.celebration_rounded, AppColors.holiday,
          AppColors.holidayBg, '/holidays'),
      _Action('My Docs', Icons.folder_rounded, const Color(0xFF059669),
          const Color(0xFFD1FAE5), '/documents'),
      _Action('Regularise', Icons.edit_calendar_rounded,
          const Color(0xFF0891B2), const Color(0xFFCFFAFE), '/regularisation'),
      _Action('Performance', Icons.track_changes_rounded,
          const Color(0xFF7C3AED), const Color(0xFFEDE9FE), '/performance'),
      _Action('IT Declaration', Icons.receipt_long_outlined,
          const Color(0xFF0369A1), const Color(0xFFE0F2FE), '/tax-declaration'),
      _Action('My Shift', Icons.schedule_rounded,
          const Color(0xFF047857), const Color(0xFFD1FAE5), '/shift-schedule'),
      _Action('Expenses', Icons.receipt_long_rounded,
          const Color(0xFFDB2777), const Color(0xFFFCE7F3), '/expenses'),
      _Action('Approvals', Icons.inbox_rounded,
          const Color(0xFF4F46E5), const Color(0xFFEEF2FF), '/approval-inbox'),
      _Action('Kudos', Icons.favorite_rounded,
          const Color(0xFFE11D48), const Color(0xFFFFF1F2), '/kudos'),
      _Action('E-Sign', Icons.draw_rounded,
          const Color(0xFF7C3AED), const Color(0xFFF5F3FF), '/esignatures'),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        mainAxisExtent: 100,
      ),
      itemCount: actions.length,
      itemBuilder: (_, i) => _QuickActionTile(action: actions[i]),
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
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push(action.route),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: action.bgColor,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: action.color.withAlpha(35),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Icon(action.icon, color: action.color, size: 26),
              ),
              const SizedBox(height: 6),
              Text(
                action.label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurface,
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
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 4),
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
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: color,
              ),
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

// ─── Birthday Section ────────────────────────────────────────────────────────

class _BirthdaySection extends ConsumerStatefulWidget {
  @override
  ConsumerState<_BirthdaySection> createState() => _BirthdaySectionState();
}

class _BirthdaySectionState extends ConsumerState<_BirthdaySection> {
  final _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final birthdaysAsync = ref.watch(todayBirthdaysProvider);
    return birthdaysAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (e, _) {
        debugPrint('Birthday fetch error: $e');
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            'Could not load birthday data. Pull down to refresh.',
            style: TextStyle(fontSize: 12, color: Colors.grey[500]),
          ),
        );
      },
      data: (list) {
        // Re-filter client-side in case cache is stale (daysUntil is computed live)
        final upcoming = list.where((e) => e.daysUntil >= 0 && e.daysUntil <= 6).toList()
          ..sort((a, b) => a.daysUntil.compareTo(b.daysUntil));
        if (upcoming.isEmpty) return const SizedBox.shrink();
        final hasToday = upcoming.any((e) => e.isToday);
        final title = hasToday ? 'Birthdays Today 🎂' : 'Upcoming Birthdays 🎂';
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),
            _SectionLabel(title),
            const SizedBox(height: 12),
            LayoutBuilder(
              builder: (context, constraints) => SizedBox(
                height: 150,
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: upcoming.length,
                  onPageChanged: (i) => setState(() => _currentPage = i),
                  itemBuilder: (_, i) => _BirthdayCard(
                    employee: upcoming[i],
                    width: constraints.maxWidth,
                  ),
                ),
              ),
            ),
            if (upcoming.length > 1) ...[
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(upcoming.length, (i) {
                  final active = i == _currentPage;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 18 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(3),
                      color: active
                          ? const Color(0xFF7C3AED)
                          : const Color(0xFF7C3AED).withAlpha(60),
                    ),
                  );
                }),
              ),
            ],
          ],
        );
      },
    );
  }
}

// Stateless — receives a shared animation + a phase offset (radians).
// All sparkles on one card share a single AnimationController.
class _Sparkle extends StatelessWidget {
  final double size;
  final Color color;
  final Animation<double> animation;
  final double phase; // radians, 0 – 2π

  const _Sparkle({
    required this.size,
    required this.color,
    required this.animation,
    required this.phase,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (_, __) {
        final opacity =
            0.15 + math.sin(animation.value * math.pi * 2 + phase).abs() * 0.85;
        return Text(
          '✦',
          style: TextStyle(color: color.withValues(alpha: opacity), fontSize: size),
        );
      },
    );
  }
}

// One AnimationController shared across all 6 sparkles via phase offsets.
// Reduces AnimationController count from 6 → 1, eliminating BLASTBufferQueue overflow.
class _BirthdayCard extends StatefulWidget {
  final BirthdayEmployee employee;
  final double width;
  const _BirthdayCard({required this.employee, required this.width});

  @override
  State<_BirthdayCard> createState() => _BirthdayCardState();
}

class _BirthdayCardState extends State<_BirthdayCard>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _ctrl.repeat();
    } else {
      _ctrl.stop();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _ctrl.dispose();
    super.dispose();
  }

  List<Color> get _gradientColors => widget.employee.isToday
      ? const [Color(0xFF7C3AED), Color(0xFFDB2777)]
      : const [Color(0xFF4F46E5), Color(0xFF7C3AED)];

  Color get _shadowColor => widget.employee.isToday
      ? const Color(0xFF7C3AED)
      : const Color(0xFF4F46E5);

  String get _birthdayDateStr {
    final now = DateTime.now();
    var date = DateTime(now.year, widget.employee.dobMonth, widget.employee.dobDay);
    if (date.isBefore(DateTime(now.year, now.month, now.day))) {
      date = DateTime(now.year + 1, widget.employee.dobMonth, widget.employee.dobDay);
    }
    return DateFormat('d MMMM').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final employee = widget.employee;
    // Six evenly-spaced phase offsets so sparkles twinkle independently
    const step = math.pi / 3; // 60°
    return Container(
      width: widget.width,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: _gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: _shadowColor.withAlpha(70),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            top: -20,
            right: -20,
            child: Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withAlpha(15),
              ),
            ),
          ),
          Positioned(
            bottom: -15,
            left: 60,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withAlpha(10),
              ),
            ),
          ),
          // 6 sparkles, 1 shared controller — visually identical to before
          Positioned(top: 14, right: 32, child: _Sparkle(size: 9, color: Colors.white, animation: _ctrl, phase: 0)),
          Positioned(top: 42, right: 14, child: _Sparkle(size: 6, color: Colors.white, animation: _ctrl, phase: step)),
          Positioned(bottom: 22, right: 26, child: _Sparkle(size: 7, color: Colors.white, animation: _ctrl, phase: step * 2)),
          Positioned(top: 24, left: 118, child: _Sparkle(size: 6, color: Colors.white, animation: _ctrl, phase: step * 3)),
          Positioned(bottom: 16, left: 82, child: _Sparkle(size: 8, color: Colors.white, animation: _ctrl, phase: step * 4)),
          Positioned(top: 58, right: 44, child: _Sparkle(size: 5, color: Colors.white, animation: _ctrl, phase: step * 5)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Avatar with cake badge
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withAlpha(40),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 36,
                        backgroundColor: Colors.white.withAlpha(40),
                        backgroundImage: employee.avatarUrl != null
                            ? NetworkImage(employee.avatarUrl!)
                            : null,
                        child: employee.avatarUrl == null
                            ? Text(
                                employee.initials,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 22,
                                ),
                              )
                            : null,
                      ),
                    ),
                    Positioned(
                      bottom: -4,
                      right: -4,
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: const Text('🎂', style: TextStyle(fontSize: 14)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 18),
                // Info column
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        employee.fullName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (employee.designation != null) ...[
                        const SizedBox(height: 3),
                        Text(
                          employee.designation!,
                          style: TextStyle(
                            color: Colors.white.withAlpha(200),
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 8),
                      if (employee.isToday) ...[
                        Row(
                          children: [
                            Text(
                              'Today!',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const Spacer(),
                            GestureDetector(
                              onTap: () {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                        '🎉 Wished ${employee.firstName} a Happy Birthday!'),
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12)),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 18, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withAlpha(30),
                                      blurRadius: 6,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: const Text(
                                  'Wish 🎉',
                                  style: TextStyle(
                                    color: Color(0xFF7C3AED),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ] else ...[
                        Text(
                          employee.daysUntil == 1 ? 'Tomorrow' : _birthdayDateStr,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
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
