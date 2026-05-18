import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/shift_model.dart';
import '../providers/shift_provider.dart';

class ShiftScheduleScreen extends ConsumerWidget {
  const ShiftScheduleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authNotifierProvider);
    final user = auth.valueOrNull?.user;
    final employeeId = user?.employeeId ?? '';

    final assignmentAsync = ref.watch(myShiftAssignmentProvider(employeeId));
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('My Shift')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(shiftAssignmentsProvider);
          ref.invalidate(myShiftAssignmentProvider);
        },
        child: assignmentAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _ErrorState(message: e.toString()),
          data: (assignment) {
            if (assignment == null || assignment.shift == null) {
              return _NoShiftState(scheme: scheme);
            }
            return _ShiftContent(assignment: assignment, shift: assignment.shift!);
          },
        ),
      ),
    );
  }
}

// ── No Shift State ────────────────────────────────────────────────────────────

class _NoShiftState extends StatelessWidget {
  final ColorScheme scheme;
  const _NoShiftState({required this.scheme});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 100),
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.schedule_outlined,
                  size: 40, color: scheme.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            const Text('No Shift Assigned',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              'You haven\'t been assigned to a shift yet.\nContact your HR to get assigned.',
              textAlign: TextAlign.center,
              style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 14),
            ),
          ],
        ),
      ],
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  const _ErrorState({required this.message});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 100),
        Center(child: Text('Could not load shift: $message')),
      ],
    );
  }
}

// ── Main Content ──────────────────────────────────────────────────────────────

class _ShiftContent extends StatelessWidget {
  final ShiftAssignment assignment;
  final Shift shift;
  const _ShiftContent({required this.assignment, required this.shift});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Hero shift card
        _ShiftHeroCard(shift: shift, scheme: scheme),
        const SizedBox(height: 16),

        // Assignment period
        _InfoCard(
          icon: Icons.date_range_outlined,
          title: 'Assignment Period',
          scheme: scheme,
          child: Column(
            children: [
              _InfoRow(
                label: 'Effective From',
                value: DateFormat('d MMM yyyy').format(assignment.effectiveFrom),
              ),
              const SizedBox(height: 8),
              _InfoRow(
                label: 'Effective To',
                value: assignment.effectiveTo != null
                    ? DateFormat('d MMM yyyy').format(assignment.effectiveTo!)
                    : 'Ongoing',
              ),
              const SizedBox(height: 8),
              _InfoRow(
                label: 'Status',
                value: assignment.isActive ? 'Active' : 'Inactive',
                valueColor: assignment.isActive ? Colors.green : Colors.grey,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Shift details
        _InfoCard(
          icon: Icons.tune_outlined,
          title: 'Shift Details',
          scheme: scheme,
          child: Column(
            children: [
              _InfoRow(label: 'Code', value: shift.code),
              const SizedBox(height: 8),
              _InfoRow(
                  label: 'Grace Period', value: '${shift.graceMinutes} min'),
              const SizedBox(height: 8),
              _InfoRow(
                  label: 'Break Duration',
                  value: '${shift.breakDurationMinutes} min'),
              const SizedBox(height: 8),
              _InfoRow(
                  label: 'Half Day After',
                  value: '${shift.halfDayAfterMinutes} min'),
              const SizedBox(height: 8),
              _InfoRow(
                  label: 'Absent After',
                  value: '${shift.absentAfterMinutes} min'),
              if (shift.isNightShift) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text('Night Shift',
                        style: TextStyle(
                            color: scheme.onSurfaceVariant, fontSize: 13)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.indigo.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.nightlight_round,
                              size: 13, color: Colors.indigo),
                          const SizedBox(width: 4),
                          Text('Yes',
                              style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.indigo,
                                  fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Weekly schedule
        _InfoCard(
          icon: Icons.calendar_view_week_outlined,
          title: 'Weekly Schedule',
          scheme: scheme,
          child: _WeekdayGrid(weeklyOffDays: shift.weeklyOffDays, scheme: scheme),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

// ── Hero Card ─────────────────────────────────────────────────────────────────

class _ShiftHeroCard extends StatelessWidget {
  final Shift shift;
  final ColorScheme scheme;
  const _ShiftHeroCard({required this.shift, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [scheme.primary, scheme.primary.withValues(alpha: 0.75)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: scheme.primary.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(shift.code,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 12)),
              ),
              if (shift.isNightShift) ...[
                const SizedBox(width: 8),
                const Icon(Icons.nightlight_round,
                    color: Colors.white70, size: 16),
              ],
              const Spacer(),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(shift.isActive ? 'Active' : 'Inactive',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(shift.name,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.access_time, color: Colors.white70, size: 18),
              const SizedBox(width: 6),
              Text(shift.formattedTime,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Info Card ─────────────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget child;
  final ColorScheme scheme;

  const _InfoCard({
    required this.icon,
    required this.title,
    required this.child,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: scheme.primary),
                const SizedBox(width: 8),
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14)),
              ],
            ),
            const Divider(height: 20),
            child,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  const _InfoRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Text(label,
            style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13)),
        const Spacer(),
        Text(value,
            style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: valueColor ?? scheme.onSurface)),
      ],
    );
  }
}

// ── Weekday Grid ──────────────────────────────────────────────────────────────

class _WeekdayGrid extends StatelessWidget {
  final List<int> weeklyOffDays;
  final ColorScheme scheme;

  const _WeekdayGrid({required this.weeklyOffDays, required this.scheme});

  static const _days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(7, (i) {
            final isOff = weeklyOffDays.contains(i);
            return _DayPill(
              label: _days[i],
              isOff: isOff,
              scheme: scheme,
            );
          }),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            _Legend(color: scheme.primary, label: 'Working day'),
            const SizedBox(width: 16),
            _Legend(color: scheme.surfaceContainerHighest, label: 'Day off', textDark: true),
          ],
        ),
      ],
    );
  }
}

class _DayPill extends StatelessWidget {
  final String label;
  final bool isOff;
  final ColorScheme scheme;
  const _DayPill({required this.label, required this.isOff, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: isOff ? scheme.surfaceContainerHighest : scheme.primary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            label.substring(0, 1),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: isOff ? scheme.onSurfaceVariant : Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Icon(
            isOff ? Icons.close : Icons.check,
            size: 12,
            color: isOff ? scheme.onSurfaceVariant : Colors.white,
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  final bool textDark;
  const _Legend({required this.color, required this.label, this.textDark = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 6),
        Text(label,
            style: TextStyle(
                fontSize: 11,
                color: Theme.of(context).colorScheme.onSurfaceVariant)),
      ],
    );
  }
}
