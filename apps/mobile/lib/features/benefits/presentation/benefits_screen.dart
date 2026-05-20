import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/benefit_provider.dart';
import '../data/models/benefit_model.dart';

class BenefitsScreen extends ConsumerWidget {
  const BenefitsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(benefitPlansProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Benefits'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: plansAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: TextButton(
              onPressed: () => ref.invalidate(benefitPlansProvider),
              child: const Text('Retry')),
        ),
        data: (plans) => plans.isEmpty
            ? const Center(
                child: Text('No benefit plans available.',
                    style: TextStyle(color: Colors.grey)))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: plans.length,
                separatorBuilder: (_, __) =>
                    const SizedBox(height: 12),
                itemBuilder: (_, i) => _BenefitCard(plan: plans[i]),
              ),
      ),
    );
  }
}

const _typeColors = {
  'HEALTH': Color(0xFFEF4444),
  'DENTAL': Color(0xFFEC4899),
  'VISION': Color(0xFF8B5CF6),
  'LIFE': Color(0xFF3B82F6),
  'RETIREMENT': Color(0xFF10B981),
  'WELLNESS': Color(0xFF14B8A6),
  'OTHER': Color(0xFF9CA3AF),
};

class _BenefitCard extends ConsumerWidget {
  final BenefitPlan plan;
  const _BenefitCard({required this.plan});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(benefitNotifierProvider.notifier);
    final color =
        _typeColors[plan.type] ?? const Color(0xFF9CA3AF);
    final fmt = NumberFormat('#,##0', 'en_IN');

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withAlpha(25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.favorite_border,
                      color: color, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(plan.name,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15)),
                      if (plan.provider != null)
                        Text(plan.provider!,
                            style: const TextStyle(
                                fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                ),
                if (plan.isEnrolled)
                  const Icon(Icons.check_circle,
                      color: AppColors.success, size: 22),
              ],
            ),
            if (plan.description != null) ...[
              const SizedBox(height: 8),
              Text(plan.description!,
                  style: const TextStyle(
                      fontSize: 12, color: Colors.grey)),
            ],
            if (plan.employeeContribution != null ||
                plan.employerContribution != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  if (plan.employeeContribution != null)
                    Text(
                      'You: ₹${fmt.format(plan.employeeContribution!)}/mo',
                      style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500),
                    ),
                  if (plan.employeeContribution != null &&
                      plan.employerContribution != null)
                    const Text(' · ',
                        style: TextStyle(color: Colors.grey)),
                  if (plan.employerContribution != null)
                    Text(
                      'Employer: ₹${fmt.format(plan.employerContribution!)}/mo',
                      style: const TextStyle(
                          fontSize: 12, color: Colors.grey),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: plan.isWaived
                        ? null
                        : () => notifier.enroll(plan.id, waive: true),
                    child: Text(
                        plan.isWaived ? 'Waived' : 'Waive'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: () => notifier.enroll(plan.id),
                    style: FilledButton.styleFrom(
                        backgroundColor: plan.isEnrolled
                            ? AppColors.success
                            : AppColors.primary),
                    child: Text(
                        plan.isEnrolled ? 'Enrolled ✓' : 'Enroll'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
