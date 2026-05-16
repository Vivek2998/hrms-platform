import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../data/models/holiday_model.dart';
import '../providers/holiday_provider.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/theme/app_theme.dart';

class HolidaysScreen extends ConsumerStatefulWidget {
  const HolidaysScreen({super.key});

  @override
  ConsumerState<HolidaysScreen> createState() => _HolidaysScreenState();
}

class _HolidaysScreenState extends ConsumerState<HolidaysScreen> {
  late int _year = DateTime.now().year;

  @override
  Widget build(BuildContext context) {
    final holidaysAsync = ref.watch(holidaysProvider(_year));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Holiday Calendar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () => setState(() => _year--),
            tooltip: 'Previous year',
          ),
          TextButton(
            onPressed: () => setState(() => _year = DateTime.now().year),
            child: Text(
              '$_year',
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                color: AppColors.primary,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () => setState(() => _year++),
            tooltip: 'Next year',
          ),
        ],
      ),
      body: holidaysAsync.when(
        data: (holidays) {
          if (holidays.isEmpty) {
            return _EmptyState(year: _year);
          }
          final upcoming =
              holidays.where((h) => h.isUpcoming).length;
          return Column(
            children: [
              _SummaryBanner(total: holidays.length, upcoming: upcoming),
              _TypeLegend(),
              Expanded(
                child: _HolidayGroupedList(holidays: holidays),
              ),
            ],
          );
        },
        loading: () => ListView(
          padding: const EdgeInsets.all(16),
          children: List.generate(6, (_) => const ShimmerCard(height: 68)),
        ),
        error: (err, _) => Center(
          child: Text('Failed to load holidays\n$err',
              textAlign: TextAlign.center),
        ),
      ),
    );
  }
}

class _SummaryBanner extends StatelessWidget {
  final int total;
  final int upcoming;
  const _SummaryBanner({required this.total, required this.upcoming});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.celebration_rounded, color: Colors.white, size: 32),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$total Holidays',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                '$upcoming upcoming this year',
                style: TextStyle(
                    color: Colors.white.withAlpha(210), fontSize: 13),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TypeLegend extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: [
          _LegendDot('National', AppColors.error),
          const SizedBox(width: 16),
          _LegendDot('Regional', AppColors.warning),
          const SizedBox(width: 16),
          _LegendDot('Optional', AppColors.info),
        ],
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final String label;
  final Color color;
  const _LegendDot(this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class _HolidayGroupedList extends StatelessWidget {
  final List<Holiday> holidays;
  const _HolidayGroupedList({required this.holidays});

  @override
  Widget build(BuildContext context) {
    // Group by month
    final grouped = <int, List<Holiday>>{};
    for (final h in holidays) {
      grouped.putIfAbsent(h.date.month, () => []).add(h);
    }
    final months = grouped.keys.toList()..sort();

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      itemCount: months.length,
      itemBuilder: (context, i) {
        final month = months[i];
        final items = grouped[month]!;
        final monthName = DateFormat('MMMM yyyy')
            .format(DateTime(_holidays_year(holidays), month));

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: EdgeInsets.only(bottom: 10, top: i == 0 ? 0 : 16),
              child: Text(
                monthName,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: AppColors.primary,
                ),
              ),
            ),
            ...items.map((h) => _HolidayTile(holiday: h)),
          ],
        );
      },
    );
  }

  int _holidays_year(List<Holiday> h) => h.first.year;
}

class _HolidayTile extends StatelessWidget {
  final Holiday holiday;
  const _HolidayTile({required this.holiday});

  Color get _typeColor => switch (holiday.type) {
        'NATIONAL' => AppColors.error,
        'REGIONAL' => AppColors.warning,
        'OPTIONAL' => AppColors.info,
        _ => AppColors.primary,
      };

  Color get _typeBg => switch (holiday.type) {
        'NATIONAL' => AppColors.errorLight,
        'REGIONAL' => AppColors.warningLight,
        'OPTIONAL' => AppColors.infoLight,
        _ => AppColors.primaryLight,
      };

  @override
  Widget build(BuildContext context) {
    final dayName = DateFormat('EEE').format(holiday.date);
    final dayNum = holiday.date.day.toString();
    final isToday = holiday.isToday;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isToday ? AppColors.primaryLight : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isToday ? AppColors.primary : const Color(0xFFE2E8F0),
          width: isToday ? 2 : 1,
        ),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: _typeBg,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                dayNum,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: _typeColor,
                ),
              ),
              Text(
                dayName,
                style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: _typeColor),
              ),
            ],
          ),
        ),
        title: Text(
          holiday.name,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        subtitle: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: _typeBg,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                holiday.type[0] +
                    holiday.type.substring(1).toLowerCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: _typeColor,
                ),
              ),
            ),
            if (isToday) ...[
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Today',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final int year;
  const _EmptyState({required this.year});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.calendar_month_outlined,
              size: 64,
              color: Theme.of(context).colorScheme.outlineVariant),
          const SizedBox(height: 16),
          Text(
            'No holidays for $year',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            'Your HR team hasn\'t added holidays yet',
            style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
