import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/helpdesk_provider.dart';
import '../data/models/helpdesk_model.dart';
import '../../../core/theme/app_theme.dart';

class HelpdeskScreen extends ConsumerWidget {
  const HelpdeskScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticketsAsync = ref.watch(helpdeskTicketsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateSheet(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('New Ticket'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(helpdeskTicketsProvider),
        child: ticketsAsync.when(
          data: (tickets) {
            if (tickets.isEmpty) {
              return _EmptyState(
                  onNew: () => _showCreateSheet(context, ref));
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              itemCount: tickets.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _TicketCard(
                ticket: tickets[i],
                onTap: () =>
                    _showDetailSheet(context, ref, tickets[i].id),
              ),
            );
          },
          loading: () =>
              const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.error_outline,
                    size: 48,
                    color: Theme.of(context).colorScheme.error),
                const SizedBox(height: 12),
                Text('Could not load tickets',
                    style: TextStyle(
                        color:
                            Theme.of(context).colorScheme.error)),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () =>
                      ref.invalidate(helpdeskTicketsProvider),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showCreateSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CreateTicketSheet(),
    );
  }

  void _showDetailSheet(
      BuildContext context, WidgetRef ref, String ticketId) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _TicketDetailSheet(ticketId: ticketId),
    );
  }
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────

class _TicketCard extends StatelessWidget {
  final HelpdeskTicket ticket;
  final VoidCallback onTap;
  const _TicketCard({required this.ticket, required this.onTap});

  Color _statusColor(String s) => switch (s) {
        'OPEN' => AppColors.info,
        'IN_PROGRESS' => AppColors.warning,
        'RESOLVED' => AppColors.success,
        'CLOSED' => Colors.grey,
        _ => AppColors.info,
      };

  Color _priorityColor(String p) => switch (p) {
        'LOW' => Colors.grey,
        'MEDIUM' => AppColors.info,
        'HIGH' => AppColors.warning,
        'URGENT' => AppColors.error,
        _ => AppColors.info,
      };

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final statusColor = _statusColor(ticket.status);
    final priorityColor = _priorityColor(ticket.priority);
    final fmt = DateFormat('d MMM');

    return Material(
      color: scheme.brightness == Brightness.dark
          ? scheme.surfaceContainer
          : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: IntrinsicHeight(
            child: Row(
              children: [
                Container(
                  width: 4,
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(14),
                      bottomLeft: Radius.circular(14),
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                ticket.subject,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            _StatusBadge(
                                status: ticket.status,
                                color: statusColor),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          ticket.description,
                          style: TextStyle(
                            fontSize: 12,
                            color: scheme.onSurfaceVariant,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            _CategoryChip(label: ticket.category),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color:
                                    priorityColor.withAlpha(18),
                                borderRadius:
                                    BorderRadius.circular(8),
                              ),
                              child: Text(
                                ticket.priority,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: priorityColor,
                                ),
                              ),
                            ),
                            const Spacer(),
                            if (ticket.commentCount > 0)
                              Row(
                                children: [
                                  Icon(Icons.chat_bubble_outline,
                                      size: 12,
                                      color: scheme.onSurfaceVariant),
                                  const SizedBox(width: 3),
                                  Text(
                                    '${ticket.commentCount}',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: scheme.onSurfaceVariant,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                              ),
                            Text(
                              fmt.format(ticket.createdAt),
                              style: TextStyle(
                                fontSize: 11,
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  final Color color;
  const _StatusBadge({required this.status, required this.color});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withAlpha(18),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          status.replaceAll('_', ' '),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      );
}

class _CategoryChip extends StatelessWidget {
  final String label;
  const _CategoryChip({required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color:
                Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      );
}

// ─── Create Ticket Sheet ──────────────────────────────────────────────────────

class _CreateTicketSheet extends ConsumerStatefulWidget {
  const _CreateTicketSheet();

  @override
  ConsumerState<_CreateTicketSheet> createState() =>
      _CreateTicketSheetState();
}

class _CreateTicketSheetState
    extends ConsumerState<_CreateTicketSheet> {
  final _formKey = GlobalKey<FormState>();
  final _subjectCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _category = 'GENERAL';
  String _priority = 'MEDIUM';

  static const _categories = [
    ('GENERAL', 'General'),
    ('PAYROLL', 'Payroll'),
    ('ATTENDANCE', 'Attendance'),
    ('LEAVE', 'Leave'),
    ('IT', 'IT Support'),
    ('HR', 'HR'),
    ('OTHER', 'Other'),
  ];

  static const _priorities = [
    ('LOW', 'Low', Colors.grey),
    ('MEDIUM', 'Medium', AppColors.info),
    ('HIGH', 'High', AppColors.warning),
    ('URGENT', 'Urgent', AppColors.error),
  ];

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await ref
        .read(createTicketNotifierProvider.notifier)
        .create(
          subject: _subjectCtrl.text.trim(),
          description: _descCtrl.text.trim(),
          category: _category,
          priority: _priority,
        );
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ticket submitted successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to create ticket')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createTicketNotifierProvider);
    final scheme = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.viewInsetsOf(context).bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: scheme.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Raise a Support Ticket',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 20),

              // Subject
              TextFormField(
                controller: _subjectCtrl,
                decoration: const InputDecoration(
                  labelText: 'Subject',
                  hintText: 'Brief summary of the issue',
                  prefixIcon: Icon(Icons.subject_rounded, size: 20),
                ),
                validator: (v) =>
                    v == null || v.trim().length < 5
                        ? 'At least 5 characters'
                        : null,
              ),
              const SizedBox(height: 14),

              // Description
              TextFormField(
                controller: _descCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  hintText: 'Describe the issue in detail...',
                  alignLabelWithHint: true,
                  prefixIcon: Padding(
                    padding: EdgeInsets.only(bottom: 40),
                    child: Icon(Icons.description_outlined, size: 20),
                  ),
                ),
                validator: (v) =>
                    v == null || v.trim().length < 10
                        ? 'Please provide more detail'
                        : null,
              ),
              const SizedBox(height: 20),

              // Category
              const Text('Category',
                  style: TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 7,
                runSpacing: 7,
                children: _categories.map((c) {
                  final selected = _category == c.$1;
                  return GestureDetector(
                    onTap: () =>
                        setState(() => _category = c.$1),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: selected
                            ? AppColors.primaryLight
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: selected
                              ? AppColors.primary
                              : scheme.outlineVariant,
                          width: selected ? 1.5 : 1,
                        ),
                      ),
                      child: Text(
                        c.$2,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: selected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color:
                              selected ? AppColors.primary : null,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Priority
              const Text('Priority',
                  style: TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(
                children: _priorities.map((p) {
                  final selected = _priority == p.$1;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () =>
                          setState(() => _priority = p.$1),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: EdgeInsets.only(
                            right:
                                p.$1 != 'URGENT' ? 8 : 0),
                        padding: const EdgeInsets.symmetric(
                            vertical: 10),
                        decoration: BoxDecoration(
                          color: selected
                              ? p.$3.withAlpha(20)
                              : Colors.transparent,
                          borderRadius:
                              BorderRadius.circular(10),
                          border: Border.all(
                            color: selected
                                ? p.$3
                                : scheme.outlineVariant,
                            width: selected ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.flag_rounded,
                                size: 16,
                                color: selected
                                    ? p.$3
                                    : scheme.onSurfaceVariant),
                            const SizedBox(height: 3),
                            Text(
                              p.$2,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: selected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: selected
                                    ? p.$3
                                    : null,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: state.isLoading ? null : _submit,
                child: state.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Submit Ticket'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Ticket Detail Sheet ──────────────────────────────────────────────────────

class _TicketDetailSheet extends ConsumerStatefulWidget {
  final String ticketId;
  const _TicketDetailSheet({required this.ticketId});

  @override
  ConsumerState<_TicketDetailSheet> createState() =>
      _TicketDetailSheetState();
}

class _TicketDetailSheetState
    extends ConsumerState<_TicketDetailSheet> {
  final _commentCtrl = TextEditingController();

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitComment() async {
    final body = _commentCtrl.text.trim();
    if (body.isEmpty) return;
    final ok = await ref
        .read(addCommentNotifierProvider.notifier)
        .addComment(ticketId: widget.ticketId, body: body);
    if (ok && mounted) {
      _commentCtrl.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Comment added'),
            backgroundColor: Colors.green),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketAsync =
        ref.watch(helpdeskTicketDetailProvider(widget.ticketId));
    final commentState = ref.watch(addCommentNotifierProvider);
    final scheme = Theme.of(context).colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding:
          EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.92,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: scheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
          Flexible(
            child: ticketAsync.when(
              data: (ticket) => _TicketDetailContent(
                ticket: ticket,
                commentCtrl: _commentCtrl,
                commentState: commentState,
                onSubmitComment: _submitComment,
              ),
              loading: () => const Center(
                  child: CircularProgressIndicator()),
              error: (e, _) => Center(
                  child: Text('Error: $e',
                      style:
                          TextStyle(color: scheme.error))),
            ),
          ),
        ],
      ),
    );
  }
}

class _TicketDetailContent extends StatelessWidget {
  final HelpdeskTicketDetail ticket;
  final TextEditingController commentCtrl;
  final AsyncValue<void> commentState;
  final VoidCallback onSubmitComment;

  const _TicketDetailContent({
    required this.ticket,
    required this.commentCtrl,
    required this.commentState,
    required this.onSubmitComment,
  });

  Color _statusColor(String s) => switch (s) {
        'OPEN' => AppColors.info,
        'IN_PROGRESS' => AppColors.warning,
        'RESOLVED' => AppColors.success,
        'CLOSED' => Colors.grey,
        _ => AppColors.info,
      };

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final statusColor = _statusColor(ticket.status);
    final isClosed = ticket.status == 'CLOSED';
    final fmt = DateFormat('d MMM yyyy, hh:mm a');

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title & badges
                Text(
                  ticket.subject,
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _StatusBadge(
                        status: ticket.status,
                        color: statusColor),
                    _CategoryChip(label: ticket.category),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: scheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        ticket.priority,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Description
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: scheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(ticket.description,
                      style: const TextStyle(fontSize: 14)),
                ),
                const SizedBox(height: 20),

                // Comments
                Row(
                  children: [
                    Text(
                      'Comments (${ticket.comments.length})',
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (ticket.comments.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'No comments yet',
                      style: TextStyle(
                          color: scheme.onSurfaceVariant,
                          fontSize: 13),
                    ),
                  )
                else
                  ...ticket.comments.map((c) => _CommentTile(
                        comment: c,
                        fmt: fmt,
                      )),

                const SizedBox(height: 8),
              ],
            ),
          ),
        ),

        // Comment Input
        if (!isClosed)
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
            decoration: BoxDecoration(
              color: scheme.surface,
              border: Border(
                top: BorderSide(color: scheme.outlineVariant),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: commentCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Add a comment...',
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                    ),
                    maxLines: null,
                  ),
                ),
                const SizedBox(width: 10),
                IconButton.filled(
                  onPressed: commentState.isLoading
                      ? null
                      : onSubmitComment,
                  icon: commentState.isLoading
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.send_rounded),
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _CommentTile extends StatelessWidget {
  final HelpdeskComment comment;
  final DateFormat fmt;
  const _CommentTile({required this.comment, required this.fmt});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: comment.isInternal
            ? AppColors.warningLight
            : scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: comment.isInternal
            ? Border.all(color: AppColors.warning.withAlpha(60))
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                comment.authorId.length > 8
                    ? '${comment.authorId.substring(0, 8)}...'
                    : comment.authorId,
                style: const TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600),
              ),
              if (comment.isInternal) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                        color: AppColors.warning.withAlpha(80)),
                  ),
                  child: const Text('Internal',
                      style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: AppColors.warning)),
                ),
              ],
              const Spacer(),
              Text(
                fmt.format(comment.createdAt.toLocal()),
                style: TextStyle(
                    fontSize: 10, color: scheme.onSurfaceVariant),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(comment.body, style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final VoidCallback onNew;
  const _EmptyState({required this.onNew});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: AppColors.infoLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.headset_mic_rounded,
                  size: 48, color: AppColors.info),
            ),
            const SizedBox(height: 20),
            const Text(
              'No tickets yet',
              style:
                  TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Raise a support ticket and we\'ll help you out',
              style: TextStyle(
                fontSize: 13,
                color:
                    Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onNew,
              icon: const Icon(Icons.add),
              label: const Text('Raise a Ticket'),
            ),
          ],
        ),
      );
}
