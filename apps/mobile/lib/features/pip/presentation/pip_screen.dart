import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/pip_provider.dart';
import '../data/models/pip_model.dart';

class PIPScreen extends ConsumerWidget {
  const PIPScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pipsAsync = ref.watch(pipListProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Performance Improvement Plans'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: pipsAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: TextButton(
              onPressed: () => ref.invalidate(pipListProvider),
              child: const Text('Retry')),
        ),
        data: (pips) => pips.isEmpty
            ? Center(
                child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_outline,
                      size: 64, color: AppColors.success.withAlpha(120)),
                  const SizedBox(height: 16),
                  const Text('No active PIPs',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                ],
              ))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: pips.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: 12),
                itemBuilder: (_, i) => _PIPCard(pip: pips[i]),
              ),
      ),
    );
  }
}

const _pipStatusColors = {
  'ACTIVE': Color(0xFF3B82F6),
  'EXTENDED': Color(0xFFF59E0B),
  'COMPLETED': Color(0xFF10B981),
  'FAILED': Color(0xFFEF4444),
};

class _PIPCard extends ConsumerStatefulWidget {
  final PIP pip;
  const _PIPCard({required this.pip});

  @override
  ConsumerState<_PIPCard> createState() => _PIPCardState();
}

class _PIPCardState extends ConsumerState<_PIPCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final p = widget.pip;
    final color = _pipStatusColors[p.status] ?? const Color(0xFF9CA3AF);

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                      p.employee?.fullName ?? 'Employee',
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 15)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: color.withAlpha(25),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: color.withAlpha(80)),
                  ),
                  child: Text(p.status,
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: color)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${DateFormat('dd MMM yyyy').format(DateTime.parse(p.startDate))} – ${DateFormat('dd MMM yyyy').format(DateTime.parse(p.endDate))}',
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
            const SizedBox(height: 6),
            Text(p.reason,
                maxLines: _expanded ? null : 2,
                overflow: _expanded ? null : TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13)),
            if (p.goals.isNotEmpty && _expanded) ...[
              const SizedBox(height: 10),
              const Text('Goals',
                  style: TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 12)),
              ...p.goals.map((g) => Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Row(
                      children: [
                        Icon(
                          g.isCompleted
                              ? Icons.check_circle
                              : Icons.radio_button_unchecked,
                          size: 16,
                          color: g.isCompleted
                              ? AppColors.success
                              : Colors.grey,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                            child: Text(g.description,
                                style: const TextStyle(fontSize: 12))),
                      ],
                    ),
                  )),
            ],
            if (p.checkIns.isNotEmpty && _expanded) ...[
              const SizedBox(height: 10),
              const Text('Check-ins',
                  style: TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 12)),
              ...p.checkIns.take(3).map((ci) => Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            DateFormat('dd MMM')
                                .format(ci.createdAt),
                            style: const TextStyle(
                                fontSize: 11, color: Colors.grey)),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(ci.note,
                                style: const TextStyle(fontSize: 12))),
                        if (ci.progressPct != null)
                          Text('${ci.progressPct}%',
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600)),
                      ],
                    ),
                  )),
            ],
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Text(
                _expanded ? 'Show less' : 'Show details',
                style: TextStyle(
                    fontSize: 12,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
