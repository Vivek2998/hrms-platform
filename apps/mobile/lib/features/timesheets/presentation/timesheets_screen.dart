import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/timesheet_provider.dart';
import '../data/models/timesheet_model.dart';

class TimesheetsScreen extends ConsumerWidget {
  const TimesheetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(projectsProvider);
    final entriesAsync = ref.watch(timesheetEntriesProvider);
    final weekStart = ref.watch(selectedWeekStartProvider);
    final notifier = ref.read(timesheetNotifierProvider.notifier);

    final weekStartDate = DateTime.parse(weekStart);
    final weekEndDate = weekStartDate.add(const Duration(days: 6));

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Timesheets'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: () async {
              final ok = await notifier.submitWeek(weekStart);
              if (ok && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Timesheet submitted')));
              }
            },
            child: const Text('Submit Week'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Week navigator
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () {
                    final d = weekStartDate
                        .subtract(const Duration(days: 7));
                    ref.read(selectedWeekStartProvider.notifier).state =
                        DateFormat('yyyy-MM-dd').format(d);
                  },
                ),
                Text(
                  '${DateFormat('dd MMM').format(weekStartDate)} – ${DateFormat('dd MMM yyyy').format(weekEndDate)}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () {
                    final d = weekStartDate
                        .add(const Duration(days: 7));
                    ref.read(selectedWeekStartProvider.notifier).state =
                        DateFormat('yyyy-MM-dd').format(d);
                  },
                ),
              ],
            ),
          ),
          Expanded(
            child: projectsAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: TextButton(
                    onPressed: () => ref.invalidate(projectsProvider),
                    child: const Text('Retry')),
              ),
              data: (projects) {
                if (projects.isEmpty) {
                  return const Center(
                      child: Text(
                          'No projects. Ask HR to create one.',
                          style: TextStyle(color: Colors.grey)));
                }
                return entriesAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (e, _) => const Center(child: Text('Error loading entries')),
                  data: (entries) => ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: projects.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: 12),
                    itemBuilder: (_, i) => _ProjectRow(
                      project: projects[i],
                      entries: entries
                          .where((e) => e.projectId == projects[i].id)
                          .toList(),
                      weekStart: weekStart,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ProjectRow extends ConsumerWidget {
  final Project project;
  final List<TimesheetEntry> entries;
  final String weekStart;

  const _ProjectRow({
    required this.project,
    required this.entries,
    required this.weekStart,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weekStartDate = DateTime.parse(weekStart);
    final days = List.generate(7, (i) => weekStartDate.add(Duration(days: i)));
    final total =
        entries.fold<double>(0, (s, e) => s + e.hours);

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(project.name,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14)),
                ),
                Text('${total}h total',
                    style: const TextStyle(
                        fontSize: 12, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: days.map((day) {
                final dateStr = DateFormat('yyyy-MM-dd').format(day);
                final entry = entries.firstWhere(
                  (e) => e.date.startsWith(dateStr),
                  orElse: () => TimesheetEntry(
                      id: '',
                      projectId: project.id,
                      date: dateStr,
                      hours: 0,
                      status: 'DRAFT'),
                );
                return _DayCell(
                  day: day,
                  entry: entry,
                  onSave: (hours) {
                    ref
                        .read(timesheetNotifierProvider.notifier)
                        .upsertEntry(
                          projectId: project.id,
                          date: dateStr,
                          hours: hours,
                          weekStart: weekStart,
                        );
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}

class _DayCell extends StatefulWidget {
  final DateTime day;
  final TimesheetEntry entry;
  final ValueChanged<double> onSave;
  const _DayCell(
      {required this.day, required this.entry, required this.onSave});

  @override
  State<_DayCell> createState() => _DayCellState();
}

class _DayCellState extends State<_DayCell> {
  late TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(
        text: widget.entry.hours > 0
            ? widget.entry.hours.toString()
            : '');
  }

  @override
  void didUpdateWidget(_DayCell old) {
    super.didUpdateWidget(old);
    if (old.entry.hours != widget.entry.hours) {
      _ctrl.text = widget.entry.hours > 0
          ? widget.entry.hours.toString()
          : '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWeekend = widget.day.weekday >= 6;
    return SizedBox(
      width: 36,
      child: Column(
        children: [
          Text(DateFormat('E').format(widget.day)[0],
              style: TextStyle(
                  fontSize: 10,
                  color: isWeekend ? Colors.grey : Colors.black87)),
          Text(widget.day.day.toString(),
              style: const TextStyle(fontSize: 10, color: Colors.grey)),
          const SizedBox(height: 4),
          SizedBox(
            height: 32,
            child: TextField(
              controller: _ctrl,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12),
              decoration: InputDecoration(
                contentPadding: EdgeInsets.zero,
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide:
                        BorderSide(color: Colors.grey.shade300)),
                filled: isWeekend,
                fillColor: Colors.grey.shade100,
              ),
              onSubmitted: (v) {
                final h = double.tryParse(v);
                if (h != null) widget.onSave(h);
              },
            ),
          ),
        ],
      ),
    );
  }
}
