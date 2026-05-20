import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/succession_provider.dart';
import '../data/models/succession_model.dart';

class SuccessionScreen extends ConsumerWidget {
  const SuccessionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(successionPlansProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Succession Planning'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: async.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: TextButton(
              onPressed: () => ref.invalidate(successionPlansProvider),
              child: const Text('Retry')),
        ),
        data: (plans) => plans.isEmpty
            ? Center(
                child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star_border,
                      size: 64, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  const Text('No succession plans',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                ],
              ))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: plans.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: 12),
                itemBuilder: (_, i) =>
                    _PlanCard(plan: plans[i]),
              ),
      ),
    );
  }
}

const _riskColors = {
  'LOW': Color(0xFF10B981),
  'MEDIUM': Color(0xFFF59E0B),
  'HIGH': Color(0xFFEF4444),
};

const _readinessLabels = {
  'READY_NOW': 'Ready Now',
  'ONE_TO_TWO_YEARS': '1-2 Years',
  'THREE_TO_FIVE_YEARS': '3-5 Years',
};

const _readinessColors = {
  'READY_NOW': Color(0xFF10B981),
  'ONE_TO_TWO_YEARS': Color(0xFFF59E0B),
  'THREE_TO_FIVE_YEARS': Color(0xFFF97316),
};

class _PlanCard extends StatefulWidget {
  final SuccessionPlan plan;
  const _PlanCard({required this.plan});

  @override
  State<_PlanCard> createState() => _PlanCardState();
}

class _PlanCardState extends State<_PlanCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final p = widget.plan;
    final riskColor = _riskColors[p.riskLevel] ?? const Color(0xFF9CA3AF);

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
                  child: Row(
                    children: [
                      Text(p.roleTitle,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 15)),
                      if (p.isCritical) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppColors.errorLight,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text('Critical',
                              style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.error)),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: riskColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: riskColor.withAlpha(80)),
                  ),
                  child: Text('${p.riskLevel} Risk',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: riskColor)),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('${p.successors.length} successor(s)',
                style: const TextStyle(fontSize: 12, color: Colors.grey)),
            if (p.notes != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(p.notes!,
                    style: const TextStyle(
                        fontSize: 12, color: Colors.grey)),
              ),
            if (_expanded && p.successors.isNotEmpty) ...[
              const Divider(height: 16),
              ...p.successors.map((s) => _SuccessorTile(s: s)),
            ],
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _expanded ? 'Hide successors' : 'View successors',
                  style: TextStyle(
                      fontSize: 12,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w500),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SuccessorTile extends StatelessWidget {
  final SuccessorNomination s;
  const _SuccessorTile({required this.s});

  @override
  Widget build(BuildContext context) {
    final color = _readinessColors[s.readiness] ?? const Color(0xFF9CA3AF);
    final label = _readinessLabels[s.readiness] ?? s.readiness;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppColors.primaryLight,
            child: Text(s.employee?.initials ?? '??',
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.employee?.fullName ?? 'Unknown',
                    style: const TextStyle(
                        fontSize: 13, fontWeight: FontWeight.w500)),
                if (s.employee?.designation != null)
                  Text(s.employee!.designation!,
                      style: const TextStyle(
                          fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(
                horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: color.withAlpha(25),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: color.withAlpha(80)),
            ),
            child: Text(label,
                style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: color)),
          ),
        ],
      ),
    );
  }
}
