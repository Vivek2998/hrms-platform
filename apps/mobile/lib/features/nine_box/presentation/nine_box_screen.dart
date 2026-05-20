import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/nine_box_provider.dart';
import '../data/models/nine_box_model.dart';

class NineBoxScreen extends ConsumerWidget {
  const NineBoxScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(nineBoxDataProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Nine-Box Grid'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: async.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: TextButton(
              onPressed: () => ref.invalidate(nineBoxDataProvider),
              child: const Text('Retry')),
        ),
        data: (data) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Low', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  Text('← Performance →',
                      style: TextStyle(fontSize: 11, color: Colors.grey)),
                  Text('High',
                      style: TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              ),
              const SizedBox(height: 4),
              _NineBoxGrid(grid: data.grid),
              const SizedBox(height: 20),
              const Text('All Assessments',
                  style: TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 8),
              if (data.assessments.isEmpty)
                const Text('No assessments yet.',
                    style: TextStyle(color: Colors.grey))
              else
                ...data.assessments.map((a) => _AssessmentTile(a: a)),
            ],
          ),
        ),
      ),
    );
  }
}

const _boxColors = {
  '1-1': Color(0xFFFEE2E2), '2-1': Color(0xFFFEE2E2),
  '3-1': Color(0xFFFEF3C7), '1-2': Color(0xFFFEF3C7),
  '2-2': Color(0xFFFEF3C7), '3-2': Color(0xFFD1FAE5),
  '1-3': Color(0xFFFEF3C7), '2-3': Color(0xFFD1FAE5),
  '3-3': Color(0xFFECFDF5),
};

class _NineBoxGrid extends StatelessWidget {
  final Map<String, List<NineBoxAssessment>> grid;
  const _NineBoxGrid({required this.grid});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [3, 2, 1].map((potential) {
        return Row(
          children: [1, 2, 3].map((performance) {
            final key = '$performance-$potential';
            final items = grid[key] ?? [];
            final label = NineBoxAssessment._boxLabels[key] ?? '';
            final color = _boxColors[key] ?? const Color(0xFFF3F4F6);
            return Expanded(
              child: Container(
                height: 90,
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(label,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            fontSize: 9, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    if (items.isEmpty)
                      const Text('—',
                          style: TextStyle(
                              color: Colors.grey, fontSize: 11))
                    else
                      ...items.take(2).map((a) => Text(
                            a.employee?.initials ?? '??',
                            style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700),
                          )),
                    if (items.length > 2)
                      Text('+${items.length - 2}',
                          style: const TextStyle(
                              fontSize: 9, color: Colors.grey)),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      }).toList(),
    );
  }
}

class _AssessmentTile extends StatelessWidget {
  final NineBoxAssessment a;
  const _AssessmentTile({required this.a});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        radius: 18,
        backgroundColor: AppColors.primaryLight,
        child: Text(a.employee?.initials ?? '??',
            style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppColors.primary)),
      ),
      title: Text(a.employee?.fullName ?? 'Unknown',
          style: const TextStyle(fontSize: 14)),
      subtitle: Text(a.boxLabel,
          style: const TextStyle(fontSize: 11, color: Colors.grey)),
      trailing: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('P${a.performance}',
              style: const TextStyle(
                  fontSize: 11, fontWeight: FontWeight.w600)),
          Text('Pot${a.potential}',
              style: const TextStyle(fontSize: 11, color: Colors.grey)),
        ],
      ),
    );
  }
}
