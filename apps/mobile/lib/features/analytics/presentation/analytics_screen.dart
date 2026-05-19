import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../data/models/analytics_model.dart';
import '../providers/analytics_provider.dart';
import '../../../../core/theme/app_theme.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('HR Analytics')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(analyticsOverviewProvider);
          ref.invalidate(headcountTrendProvider);
          ref.invalidate(departmentBreakdownProvider);
          ref.invalidate(attendanceSummaryProvider);
          ref.invalidate(leaveUtilizationProvider);
          ref.invalidate(payrollTrendProvider);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          children: const [
            _OverviewSection(),
            SizedBox(height: 20),
            _HeadcountChart(),
            SizedBox(height: 20),
            _DepartmentChart(),
            SizedBox(height: 20),
            _AttendanceChart(),
            SizedBox(height: 20),
            _PayrollChart(),
          ],
        ),
      ),
    );
  }
}

// ── Overview Cards ────────────────────────────────────────────────────────────

class _OverviewSection extends ConsumerWidget {
  const _OverviewSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(analyticsOverviewProvider);
    return async.when(
      loading: () => _cardGrid([
        _StatCard('Active', '—', AppColors.primary, AppColors.primaryLight, Icons.people_rounded),
        _StatCard('New', '—', AppColors.success, AppColors.successLight, Icons.person_add_rounded),
        _StatCard('Exited', '—', AppColors.error, AppColors.errorLight, Icons.person_remove_rounded),
        _StatCard('Attrition', '—', AppColors.warning, AppColors.warningLight, Icons.trending_down_rounded),
      ]),
      error: (e, _) => Text('Error: $e'),
      data: (o) => _cardGrid([
        _StatCard('Active', '${o.activeEmployees}', AppColors.primary, AppColors.primaryLight, Icons.people_rounded),
        _StatCard('New', '${o.newThisMonth}', AppColors.success, AppColors.successLight, Icons.person_add_rounded),
        _StatCard('Exited', '${o.exitedThisMonth}', AppColors.error, AppColors.errorLight, Icons.person_remove_rounded),
        _StatCard('Attrition', '${o.attritionRate.toStringAsFixed(1)}%', AppColors.warning, AppColors.warningLight, Icons.trending_down_rounded),
      ]),
    );
  }

  Widget _cardGrid(List<_StatCard> cards) => GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.7,
        children: cards,
      );
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final Color bg;
  final IconData icon;

  const _StatCard(this.label, this.value, this.color, this.bg, this.icon);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withAlpha(40),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value,
                    style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: color)),
                Text(label,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: color.withAlpha(180))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Headcount Trend ───────────────────────────────────────────────────────────

class _HeadcountChart extends ConsumerWidget {
  const _HeadcountChart();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(headcountTrendProvider);
    return _ChartCard(
      title: 'Headcount Trend',
      subtitle: 'Last 12 months',
      icon: Icons.show_chart_rounded,
      child: async.when(
        loading: () => const _ChartLoader(),
        error: (e, _) => _ChartError('$e'),
        data: (points) {
          if (points.isEmpty) return const _ChartEmpty();
          final spots = points.asMap().entries
              .map((e) => FlSpot(e.key.toDouble(), e.value.count.toDouble()))
              .toList();
          final max = points.map((p) => p.count).reduce((a, b) => a > b ? a : b);
          return LineChart(
            LineChartData(
              minY: 0,
              maxY: (max * 1.2).ceilToDouble(),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) => FlLine(
                  color: Colors.grey.withAlpha(40),
                  strokeWidth: 1,
                ),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 36,
                    getTitlesWidget: (v, _) => Text(
                      '${v.toInt()}',
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (v, _) {
                      final i = v.toInt();
                      if (i < 0 || i >= points.length) return const SizedBox();
                      final label = points[i].month;
                      final parts = label.split('-');
                      return Text(
                        parts.length == 2
                            ? DateFormat('MMM').format(DateTime(int.parse(parts[0]), int.parse(parts[1])))
                            : label,
                        style: const TextStyle(fontSize: 9, color: Colors.grey),
                      );
                    },
                  ),
                ),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              lineBarsData: [
                LineChartBarData(
                  spots: spots,
                  isCurved: true,
                  color: AppColors.primary,
                  barWidth: 2.5,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    color: AppColors.primary.withAlpha(30),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ── Department Breakdown ──────────────────────────────────────────────────────

class _DepartmentChart extends ConsumerWidget {
  const _DepartmentChart();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(departmentBreakdownProvider);
    return _ChartCard(
      title: 'Department Breakdown',
      subtitle: 'Active employees',
      icon: Icons.business_rounded,
      child: async.when(
        loading: () => const _ChartLoader(),
        error: (e, _) => _ChartError('$e'),
        data: (items) {
          if (items.isEmpty) return const _ChartEmpty();
          final max = items.map((i) => i.count).reduce((a, b) => a > b ? a : b);
          return Column(
            children: items.take(6).map((item) {
              final pct = max > 0 ? item.count / max : 0.0;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    SizedBox(
                      width: 90,
                      child: Text(
                        item.department,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: pct,
                          minHeight: 18,
                          backgroundColor: AppColors.primary.withAlpha(20),
                          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${item.count}',
                      style: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              );
            }).toList(),
          );
        },
      ),
    );
  }
}

// ── Attendance Summary ────────────────────────────────────────────────────────

class _AttendanceChart extends ConsumerWidget {
  const _AttendanceChart();

  static const _colors = {
    'PRESENT': Color(0xFF10B981),
    'LATE': Color(0xFFF59E0B),
    'ABSENT': Color(0xFFEF4444),
    'HALF_DAY': Color(0xFF3B82F6),
    'ON_LEAVE': Color(0xFF8B5CF6),
    'HOLIDAY': Color(0xFFEC4899),
    'WEEKEND': Color(0xFF6B7280),
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(attendanceSummaryProvider);
    return _ChartCard(
      title: 'Attendance Summary',
      subtitle: 'Last 30 days',
      icon: Icons.pie_chart_rounded,
      child: async.when(
        loading: () => const _ChartLoader(),
        error: (e, _) => _ChartError('$e'),
        data: (items) {
          if (items.isEmpty) return const _ChartEmpty();
          final total = items.fold<int>(0, (s, i) => s + i.count);
          final sections = items.where((i) => i.count > 0).map((item) {
            final color = _colors[item.status] ?? Colors.grey;
            return PieChartSectionData(
              value: item.count.toDouble(),
              color: color,
              radius: 52,
              title: '${(item.count / total * 100).toStringAsFixed(0)}%',
              titleStyle: const TextStyle(
                  fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
            );
          }).toList();
          return Row(
            children: [
              SizedBox(
                height: 140,
                width: 140,
                child: PieChart(PieChartData(
                  sections: sections,
                  sectionsSpace: 2,
                  centerSpaceRadius: 30,
                )),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: items.where((i) => i.count > 0).map((item) {
                    final color = _colors[item.status] ?? Colors.grey;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          Container(
                            width: 10, height: 10,
                            decoration: BoxDecoration(
                              color: color, shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              _label(item.status),
                              style: const TextStyle(fontSize: 11),
                            ),
                          ),
                          Text(
                            '${item.count}',
                            style: const TextStyle(
                                fontSize: 11, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _label(String s) => switch (s) {
        'PRESENT' => 'Present',
        'LATE' => 'Late',
        'ABSENT' => 'Absent',
        'HALF_DAY' => 'Half Day',
        'ON_LEAVE' => 'On Leave',
        'HOLIDAY' => 'Holiday',
        'WEEKEND' => 'Weekend',
        _ => s,
      };
}

// ── Payroll Trend ─────────────────────────────────────────────────────────────

class _PayrollChart extends ConsumerWidget {
  const _PayrollChart();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(payrollTrendProvider);
    return _ChartCard(
      title: 'Payroll Trend',
      subtitle: 'Gross vs Net (last 12 months)',
      icon: Icons.account_balance_wallet_rounded,
      child: async.when(
        loading: () => const _ChartLoader(),
        error: (e, _) => _ChartError('$e'),
        data: (points) {
          if (points.isEmpty) return const _ChartEmpty();
          final maxVal = points
              .map((p) => p.gross)
              .reduce((a, b) => a > b ? a : b);
          final fmt = NumberFormat.compactCurrency(symbol: '₹', decimalDigits: 0);

          FlSpot toSpot(int i, double v) => FlSpot(i.toDouble(), v);

          return LineChart(
            LineChartData(
              minY: 0,
              maxY: maxVal * 1.2,
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) =>
                    FlLine(color: Colors.grey.withAlpha(40), strokeWidth: 1),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 48,
                    getTitlesWidget: (v, _) => Text(
                      fmt.format(v),
                      style: const TextStyle(fontSize: 9, color: Colors.grey),
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (v, _) {
                      final i = v.toInt();
                      if (i < 0 || i >= points.length) return const SizedBox();
                      final parts = points[i].month.split('-');
                      return Text(
                        parts.length == 2
                            ? DateFormat('MMM').format(DateTime(int.parse(parts[0]), int.parse(parts[1])))
                            : points[i].month,
                        style: const TextStyle(fontSize: 9, color: Colors.grey),
                      );
                    },
                  ),
                ),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              ),
              lineBarsData: [
                LineChartBarData(
                  spots: points.asMap().entries.map((e) => toSpot(e.key, e.value.gross)).toList(),
                  isCurved: true,
                  color: AppColors.primary,
                  barWidth: 2.5,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    color: AppColors.primary.withAlpha(25),
                  ),
                ),
                LineChartBarData(
                  spots: points.asMap().entries.map((e) => toSpot(e.key, e.value.net)).toList(),
                  isCurved: true,
                  color: AppColors.success,
                  barWidth: 2.5,
                  dotData: const FlDotData(show: false),
                  belowBarData: BarAreaData(
                    show: true,
                    color: AppColors.success.withAlpha(25),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ── Shared card wrapper ───────────────────────────────────────────────────────

class _ChartCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Widget child;

  const _ChartCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: AppColors.primary),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w700)),
                  Text(subtitle,
                      style: TextStyle(
                          fontSize: 11, color: Colors.grey[500])),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(height: 180, child: child),
        ],
      ),
    );
  }
}

class _ChartLoader extends StatelessWidget {
  const _ChartLoader();
  @override
  Widget build(BuildContext context) =>
      const Center(child: CircularProgressIndicator());
}

class _ChartError extends StatelessWidget {
  final String message;
  const _ChartError(this.message);
  @override
  Widget build(BuildContext context) =>
      Center(child: Text('Error: $message', style: const TextStyle(fontSize: 12)));
}

class _ChartEmpty extends StatelessWidget {
  const _ChartEmpty();
  @override
  Widget build(BuildContext context) =>
      const Center(child: Text('No data available', style: TextStyle(color: Colors.grey)));
}
