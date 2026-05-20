import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/compliance_provider.dart';
import '../data/models/compliance_model.dart';

class ComplianceScreen extends ConsumerWidget {
  const ComplianceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(complianceCalendarProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Compliance Calendar'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: async.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, color: AppColors.error, size: 48),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () =>
                    ref.invalidate(complianceCalendarProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (deadlines) {
          if (deadlines.isEmpty) {
            return const Center(child: Text('No deadlines found.'));
          }
          final grouped = <String, List<ComplianceDeadline>>{};
          for (final d in deadlines) {
            final key =
                DateFormat('MMMM yyyy').format(d.dueDate);
            grouped.putIfAbsent(key, () => []).add(d);
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: grouped.entries
                .map((e) => _MonthGroup(month: e.key, items: e.value))
                .toList(),
          );
        },
      ),
    );
  }
}

class _MonthGroup extends StatelessWidget {
  final String month;
  final List<ComplianceDeadline> items;
  const _MonthGroup({required this.month, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(month,
              style: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 14,
                  color: Colors.grey)),
        ),
        ...items.map((d) => _DeadlineTile(deadline: d)),
        const SizedBox(height: 8),
      ],
    );
  }
}

const _typeColors = {
  'PF': Color(0xFF3B82F6),
  'ESI': Color(0xFF8B5CF6),
  'PT': Color(0xFFF59E0B),
  'TDS': Color(0xFFEF4444),
  'QUARTERLY': Color(0xFF10B981),
};

class _DeadlineTile extends StatelessWidget {
  final ComplianceDeadline deadline;
  const _DeadlineTile({required this.deadline});

  @override
  Widget build(BuildContext context) {
    final color =
        _typeColors[deadline.type] ?? const Color(0xFF6B7280);
    final isOverdue = deadline.isOverdue;
    final isToday = deadline.isToday;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: isOverdue
                ? AppColors.error.withAlpha(120)
                : isToday
                    ? AppColors.warning.withAlpha(120)
                    : Colors.grey.shade200),
      ),
      child: ListTile(
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(deadline.type.substring(0, 2),
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: color)),
          ),
        ),
        title: Text(deadline.description,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        subtitle: Text(
          DateFormat('dd MMM yyyy').format(deadline.dueDate) +
              (isOverdue ? ' • Overdue' : isToday ? ' • Today' : ''),
          style: TextStyle(
              fontSize: 11,
              color: isOverdue
                  ? AppColors.error
                  : isToday
                      ? AppColors.warning
                      : Colors.grey),
        ),
        trailing: Icon(
          isOverdue
              ? Icons.warning_amber_rounded
              : Icons.calendar_today_outlined,
          size: 18,
          color: isOverdue ? AppColors.error : Colors.grey,
        ),
      ),
    );
  }
}
