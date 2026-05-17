import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';
import '../data/models/leave_model.dart';

class PendingLeavesScreen extends ConsumerWidget {
  const PendingLeavesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leavesAsync = ref.watch(pendingLeavesProvider);
    final approvalState = ref.watch(leaveApprovalNotifierProvider);

    ref.listen(leaveApprovalNotifierProvider, (_, next) {
      if (next.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(next.error?.toString() ?? 'Action failed'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ));
      } else if (next.hasValue && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Leave request updated')),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pending Approvals'),
        actions: [
          TextButton.icon(
            onPressed: () => context.push('/leaves/apply-behalf'),
            icon: const Icon(Icons.person_add_outlined, size: 18),
            label: const Text('Apply on Behalf'),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
      body: leavesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Error: $e'),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => ref.invalidate(pendingLeavesProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (leaves) {
          if (leaves.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_outline, size: 56, color: Colors.green),
                  SizedBox(height: 12),
                  Text('No pending leave requests',
                      style: TextStyle(fontSize: 16)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(pendingLeavesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: leaves.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _PendingLeaveTile(
                leave: leaves[i],
                isActioning: approvalState.isLoading,
                onAction: (action, remarks) => ref
                    .read(leaveApprovalNotifierProvider.notifier)
                    .approve(leaves[i].id, action, remarks: remarks),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _PendingLeaveTile extends StatelessWidget {
  final PendingLeaveRequest leave;
  final bool isActioning;
  final void Function(String action, String? remarks) onAction;

  const _PendingLeaveTile({
    required this.leave,
    required this.isActioning,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fmt = DateFormat('d MMM y');
    final appliedFmt = DateFormat('d MMM');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: scheme.primaryContainer,
                  child: Text(
                    leave.employeeName[0],
                    style: TextStyle(
                      color: scheme.onPrimaryContainer,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(leave.employeeName,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(leave.employeeCode,
                          style: TextStyle(
                              fontSize: 11, color: scheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                Text(
                  'Applied ${appliedFmt.format(leave.appliedAt)}',
                  style:
                      TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
                ),
              ],
            ),
            const Divider(height: 20),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(leave.leaveTypeName,
                          style: const TextStyle(fontWeight: FontWeight.w500)),
                      const SizedBox(height: 2),
                      Text(
                        '${fmt.format(leave.startDate)} – ${fmt.format(leave.endDate)}',
                        style: TextStyle(
                            fontSize: 12, color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: scheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${leave.totalDays} day${leave.totalDays != 1 ? "s" : ""}',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: scheme.onSecondaryContainer),
                  ),
                ),
              ],
            ),
            if (leave.reason.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                '"${leave.reason}"',
                style: TextStyle(
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                    color: scheme.onSurfaceVariant),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: isActioning
                        ? null
                        : () => _showActionDialog(context, 'REJECTED'),
                    icon: const Icon(Icons.cancel_outlined, size: 16),
                    label: const Text('Reject'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Theme.of(context).colorScheme.error,
                      side: BorderSide(
                          color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: isActioning
                        ? null
                        : () => _showActionDialog(context, 'APPROVED'),
                    icon: const Icon(Icons.check_circle_outline, size: 16),
                    label: const Text('Approve'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showActionDialog(BuildContext context, String action) {
    final remarksController = TextEditingController();
    final isApprove = action == 'APPROVED';

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isApprove ? 'Approve Leave' : 'Reject Leave'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${leave.employeeName} — ${leave.leaveTypeName}',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: remarksController,
              decoration: InputDecoration(
                labelText: isApprove ? 'Remarks (optional)' : 'Reason for rejection',
                border: const OutlineInputBorder(),
                hintText: isApprove ? 'Add a note...' : 'Please provide a reason',
              ),
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              onAction(action, remarksController.text.trim());
            },
            style: isApprove
                ? null
                : FilledButton.styleFrom(
                    backgroundColor: Theme.of(context).colorScheme.error,
                  ),
            child: Text(isApprove ? 'Approve' : 'Reject'),
          ),
        ],
      ),
    );
  }
}
