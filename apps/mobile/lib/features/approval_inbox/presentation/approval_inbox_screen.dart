import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../data/models/approval_inbox_model.dart';
import '../providers/approval_inbox_provider.dart';
import '../../../core/theme/app_theme.dart';

class ApprovalInboxScreen extends ConsumerStatefulWidget {
  const ApprovalInboxScreen({super.key});

  @override
  ConsumerState<ApprovalInboxScreen> createState() => _ApprovalInboxScreenState();
}

class _ApprovalInboxScreenState extends ConsumerState<ApprovalInboxScreen> {
  String? _activeType;

  static const _typeFilters = [
    (label: 'All', value: null),
    (label: 'Leave', value: 'LEAVE'),
    (label: 'Expense', value: 'EXPENSE'),
    (label: 'Reg.', value: 'REGULARISATION'),
    (label: 'Comp-off', value: 'COMP_OFF'),
    (label: 'Helpdesk', value: 'HELPDESK'),
  ];

  static const _typeMeta = {
    'LEAVE': (color: Color(0xFF3B82F6), bg: Color(0xFFEFF6FF)),
    'EXPENSE': (color: Color(0xFFDB2777), bg: Color(0xFFFDF2F8)),
    'REGULARISATION': (color: Color(0xFF0891B2), bg: Color(0xFFECFEFF)),
    'COMP_OFF': (color: Color(0xFF7C3AED), bg: Color(0xFFF5F3FF)),
    'HELPDESK': (color: Color(0xFFF97316), bg: Color(0xFFFFF7ED)),
  };

  @override
  Widget build(BuildContext context) {
    final itemsAsync = ref.watch(
      approvalInboxItemsProvider(type: _activeType),
    );
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Approval Inbox'),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: scheme.onSurface,
      ),
      body: Column(
        children: [
          // ── Type filter chips ──────────────────────────────
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _typeFilters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final f = _typeFilters[i];
                final selected = _activeType == f.value;
                return FilterChip(
                  label: Text(f.label),
                  selected: selected,
                  onSelected: (_) => setState(() => _activeType = f.value),
                  selectedColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: selected ? Colors.white : scheme.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                  backgroundColor: scheme.surfaceContainerHighest,
                  side: BorderSide.none,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // ── Items list ─────────────────────────────────────
          Expanded(
            child: itemsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline_rounded, size: 48, color: Colors.red),
                    const SizedBox(height: 12),
                    const Text('Failed to load inbox'),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => ref.invalidate(approvalInboxItemsProvider),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
              data: (items) {
                if (items.isEmpty) {
                  return _EmptyInbox();
                }
                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(approvalInboxItemsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _InboxCard(
                      item: items[i],
                      meta: _typeMeta[items[i].type] ??
                          (color: const Color(0xFF6B7280), bg: const Color(0xFFF9FAFB)),
                      onApprove: () => _act(items[i], approve: true),
                      onReject: () => _act(items[i], approve: false),
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

  Future<void> _act(ApprovalInboxItem item, {required bool approve}) async {
    if (!item.canApprove) return;
    final label = approve ? 'Approve' : 'Reject';
    final typeLabel = kInboxTypeLabels[item.type] ?? item.type;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('$label $typeLabel'),
        content: Text('${approve ? 'Approve' : 'Reject'} "${item.title}" by ${item.employeeName}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: approve ? const Color(0xFF10B981) : Colors.red,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: Text(label),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    if (approve) {
      await ref.read(approvalInboxNotifierProvider.notifier).approve(item);
    } else {
      await ref.read(approvalInboxNotifierProvider.notifier).reject(item);
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${approve ? 'Approved' : 'Rejected'}: ${item.title}')),
      );
    }
  }
}

// ── Inbox Card ────────────────────────────────────────────────────────────────

class _InboxCard extends StatelessWidget {
  final ApprovalInboxItem item;
  final ({Color color, Color bg}) meta;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  const _InboxCard({
    required this.item,
    required this.meta,
    required this.onApprove,
    required this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final typeLabel = kInboxTypeLabels[item.type] ?? item.type;
    final age = _timeAgo(item.createdAt);

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header row ───────────────────────────────────
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: meta.bg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: meta.color.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    typeLabel,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: meta.color,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  age,
                  style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // ── Title & subtitle ─────────────────────────────
            Text(
              item.title,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              item.subtitle,
              style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 6),

            // ── Employee & actions ───────────────────────────
            Row(
              children: [
                const Icon(Icons.person_outline_rounded, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    item.employeeName,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (item.canApprove) ...[
                  const SizedBox(width: 8),
                  _ActionBtn(
                    label: 'Reject',
                    color: Colors.red,
                    onTap: onReject,
                  ),
                  const SizedBox(width: 6),
                  _ActionBtn(
                    label: 'Approve',
                    color: const Color(0xFF10B981),
                    onTap: onApprove,
                    filled: true,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('dd MMM').format(dt);
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool filled;

  const _ActionBtn({
    required this.label,
    required this.color,
    required this.onTap,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: filled ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: filled ? Colors.white : color,
          ),
        ),
      ),
    );
  }
}

// ── Empty State ───────────────────────────────────────────────────────────────

class _EmptyInbox extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.inbox_rounded, size: 48, color: AppColors.primary),
          ),
          const SizedBox(height: 20),
          const Text('All caught up!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          const Text(
            'No pending approvals at this time.',
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
