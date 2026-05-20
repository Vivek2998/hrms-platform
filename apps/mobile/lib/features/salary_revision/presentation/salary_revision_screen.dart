import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/salary_revision_provider.dart';
import '../data/models/salary_revision_model.dart';

class SalaryRevisionScreen extends ConsumerWidget {
  const SalaryRevisionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final proposalsAsync = ref.watch(salaryRevisionProposalsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Salary Revision'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: proposalsAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, color: AppColors.error, size: 48),
              const SizedBox(height: 12),
              Text('Failed to load proposals',
                  style: TextStyle(color: AppColors.error)),
              TextButton(
                onPressed: () =>
                    ref.invalidate(salaryRevisionProposalsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (proposals) => proposals.isEmpty
            ? const _EmptyState()
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: proposals.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) =>
                    _ProposalCard(proposal: proposals[i]),
              ),
      ),
    );
  }
}

class _ProposalCard extends ConsumerWidget {
  final SalaryRevisionProposal proposal;
  const _ProposalCard({required this.proposal});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(salaryRevisionNotifierProvider.notifier);
    final fmt = NumberFormat('#,##0', 'en_IN');

    Color statusColor;
    String statusLabel;
    switch (proposal.status) {
      case 'APPROVED':
        statusColor = AppColors.success;
        statusLabel = 'Approved';
        break;
      case 'REJECTED':
        statusColor = AppColors.error;
        statusLabel = 'Rejected';
        break;
      default:
        statusColor = AppColors.warning;
        statusLabel = 'Pending';
    }

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
                Expanded(
                  child: Text(
                    proposal.employee?.fullName ?? proposal.employeeId,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withAlpha(80)),
                  ),
                  child: Text(statusLabel,
                      style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _SalaryChip(
                    label: 'Current',
                    amount: '₹${fmt.format(proposal.currentSalary)}',
                    color: AppColors.info),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward, size: 16,
                    color: Colors.grey),
                const SizedBox(width: 8),
                _SalaryChip(
                    label: 'Proposed',
                    amount: '₹${fmt.format(proposal.proposedSalary)}',
                    color: AppColors.success),
              ],
            ),
            if (proposal.reason != null) ...[
              const SizedBox(height: 8),
              Text(proposal.reason!,
                  style: const TextStyle(
                      fontSize: 13, color: Colors.grey),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
            ],
            if (proposal.status == 'PENDING') ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _confirmReject(context, notifier),
                      style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side:
                              BorderSide(color: AppColors.error.withAlpha(120))),
                      child: const Text('Reject'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => notifier.approve(proposal.id),
                      style: FilledButton.styleFrom(
                          backgroundColor: AppColors.success),
                      child: const Text('Approve'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _confirmReject(
      BuildContext context, SalaryRevisionNotifier notifier) async {
    final reasonCtrl = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Reject Proposal'),
        content: TextField(
          controller: reasonCtrl,
          decoration: const InputDecoration(
              hintText: 'Reason (optional)', border: OutlineInputBorder()),
          maxLines: 3,
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Reject')),
        ],
      ),
    );
    if (confirmed == true) {
      await notifier.reject(proposal.id,
          reason: reasonCtrl.text.trim().isNotEmpty
              ? reasonCtrl.text.trim()
              : null);
    }
  }
}

class _SalaryChip extends StatelessWidget {
  final String label;
  final String amount;
  final Color color;
  const _SalaryChip(
      {required this.label, required this.amount, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style:
                const TextStyle(fontSize: 10, color: Colors.grey)),
        Text(amount,
            style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.trending_up, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('No proposals yet',
              style:
                  TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const Text('Salary revision proposals will appear here.',
              style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}
