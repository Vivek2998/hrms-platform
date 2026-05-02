import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/attendance_provider.dart';
import '../data/models/attendance_model.dart';

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final now = DateTime.now();
    final attendanceAsync =
        ref.watch(attendanceListProvider(month: now.month, year: now.year));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(attendanceListProvider),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/attendance/punch'),
        icon: const Icon(Icons.fingerprint),
        label: const Text('Punch In/Out'),
      ),
      body: attendanceAsync.when(
        data: (records) {
          if (records.isEmpty) {
            return const Center(child: Text('No attendance records this month'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: records.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) => _AttendanceTile(record: records[i]),
          );
        },
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class _AttendanceTile extends StatelessWidget {
  final CachedAttendanceRecord record;
  const _AttendanceTile({required this.record});

  Color _statusColor(String status) => switch (status) {
        'PRESENT' => Colors.green,
        'LATE' => Colors.orange,
        'ABSENT' => Colors.red,
        'HALF_DAY' => Colors.amber,
        'ON_LEAVE' => Colors.blue,
        'HOLIDAY' => Colors.purple,
        _ => Colors.grey,
      };

  String _formatTime(DateTime? dt) =>
      dt != null ? DateFormat('hh:mm a').format(dt.toLocal()) : '--:--';

  @override
  Widget build(BuildContext context) {
    final color = _statusColor(record.status);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 48,
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
                  Text(
                    DateFormat('EEE, d MMM').format(record.date),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'In: ${_formatTime(record.punchIn)}  •  Out: ${_formatTime(record.punchOut)}',
                    style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    record.status.replaceAll('_', ' '),
                    style: TextStyle(
                        color: color,
                        fontSize: 11,
                        fontWeight: FontWeight.w600),
                  ),
                ),
                if (record.workingMinutes != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${(record.workingMinutes! / 60).toStringAsFixed(1)}h',
                    style: const TextStyle(fontSize: 11),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
