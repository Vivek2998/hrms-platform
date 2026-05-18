import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/regularisation_provider.dart';
import '../data/models/regularisation_model.dart';
import '../../../core/theme/app_theme.dart';

class RegularisationScreen extends ConsumerWidget {
  const RegularisationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(regularisationListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Attendance Regularisation')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('New Request'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async =>
            ref.invalidate(regularisationListProvider),
        child: listAsync.when(
          data: (requests) {
            if (requests.isEmpty) {
              return _EmptyState(
                  onNew: () => _showCreateSheet(context));
            }
            return ListView.separated(
              padding:
                  const EdgeInsets.fromLTRB(16, 16, 16, 100),
              itemCount: requests.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: 10),
              itemBuilder: (_, i) =>
                  _RequestCard(request: requests[i]),
            );
          },
          loading: () =>
              const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
        ),
      ),
    );
  }

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CreateRegularisationSheet(),
    );
  }
}

// ─── Request Card ─────────────────────────────────────────────────────────────

class _RequestCard extends StatelessWidget {
  final RegularisationRequest request;
  const _RequestCard({required this.request});

  Color _statusColor(String s) => switch (s) {
        'APPROVED' => AppColors.success,
        'REJECTED' => AppColors.error,
        _ => AppColors.warning,
      };

  IconData _statusIcon(String s) => switch (s) {
        'APPROVED' => Icons.check_circle_rounded,
        'REJECTED' => Icons.cancel_rounded,
        _ => Icons.schedule_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final statusColor = _statusColor(request.status);
    final dateFmt = DateFormat('EEE, d MMM yyyy');
    final timeFmt = DateFormat('hh:mm a');
    final date = DateTime.tryParse(request.date) ?? DateTime.now();

    String? inTime;
    String? outTime;
    if (request.requestedIn != null) {
      final dt = DateTime.tryParse(request.requestedIn!);
      if (dt != null) inTime = timeFmt.format(dt.toLocal());
    }
    if (request.requestedOut != null) {
      final dt = DateTime.tryParse(request.requestedOut!);
      if (dt != null) outTime = timeFmt.format(dt.toLocal());
    }

    return Container(
      decoration: BoxDecoration(
        color: scheme.brightness == Brightness.dark
            ? scheme.surfaceContainer
            : Colors.white,
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
                      children: [
                        Icon(Icons.calendar_today_rounded,
                            size: 14, color: scheme.onSurfaceVariant),
                        const SizedBox(width: 6),
                        Text(
                          dateFmt.format(date),
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withAlpha(18),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(_statusIcon(request.status),
                                  size: 12, color: statusColor),
                              const SizedBox(width: 4),
                              Text(
                                request.status,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: statusColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (inTime != null || outTime != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (inTime != null) ...[
                            Icon(Icons.login_rounded,
                                size: 13,
                                color: AppColors.success),
                            const SizedBox(width: 4),
                            Text(inTime,
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.success)),
                            const SizedBox(width: 16),
                          ],
                          if (outTime != null) ...[
                            Icon(Icons.logout_rounded,
                                size: 13,
                                color: AppColors.error),
                            const SizedBox(width: 4),
                            Text(outTime,
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.error)),
                          ],
                        ],
                      ),
                    ],
                    const SizedBox(height: 6),
                    Text(
                      request.reason,
                      style: TextStyle(
                          fontSize: 12, color: scheme.onSurfaceVariant),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Create Sheet ─────────────────────────────────────────────────────────────

class _CreateRegularisationSheet extends ConsumerStatefulWidget {
  const _CreateRegularisationSheet();

  @override
  ConsumerState<_CreateRegularisationSheet> createState() =>
      _CreateRegularisationSheetState();
}

class _CreateRegularisationSheetState
    extends ConsumerState<_CreateRegularisationSheet> {
  final _formKey = GlobalKey<FormState>();
  final _reasonCtrl = TextEditingController();
  DateTime? _date;
  TimeOfDay? _inTime;
  TimeOfDay? _outTime;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? now,
      firstDate: now.subtract(const Duration(days: 60)),
      lastDate: now,
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: Theme.of(ctx)
              .colorScheme
              .copyWith(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime(bool isIn) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isIn
          ? (_inTime ?? const TimeOfDay(hour: 9, minute: 0))
          : (_outTime ?? const TimeOfDay(hour: 18, minute: 0)),
    );
    if (picked == null) return;
    setState(() {
      if (isIn) {
        _inTime = picked;
      } else {
        _outTime = picked;
      }
    });
  }

  String _toIsoString(DateTime date, TimeOfDay time) {
    final dt = DateTime(
        date.year, date.month, date.day, time.hour, time.minute);
    return dt.toIso8601String();
  }

  Future<void> _submit() async {
    if (_date == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a date')),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    final ok = await ref
        .read(createRegularisationProvider.notifier)
        .create(
          date: _date!.toIso8601String().split('T').first,
          requestedIn: _inTime != null
              ? _toIsoString(_date!, _inTime!)
              : null,
          requestedOut: _outTime != null
              ? _toIsoString(_date!, _outTime!)
              : null,
          reason: _reasonCtrl.text.trim(),
        );

    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Regularisation request submitted'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      final state = ref.read(createRegularisationProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error?.toString() ?? 'Failed to submit'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createRegularisationProvider);
    final scheme = Theme.of(context).colorScheme;
    final dateFmt = DateFormat('EEE, d MMM yyyy');

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
                'Regularisation Request',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 4),
              Text(
                'Submit a request to correct missed punch-in/out',
                style: TextStyle(
                    fontSize: 13, color: scheme.onSurfaceVariant),
              ),
              const SizedBox(height: 24),

              // Date picker
              const Text('Date',
                  style: TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              GestureDetector(
                onTap: _pickDate,
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _date != null
                        ? AppColors.primaryLight
                        : scheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _date != null
                          ? AppColors.primary.withAlpha(100)
                          : scheme.outlineVariant,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.calendar_today_rounded,
                          size: 18,
                          color: _date != null
                              ? AppColors.primary
                              : scheme.onSurfaceVariant),
                      const SizedBox(width: 10),
                      Text(
                        _date != null
                            ? dateFmt.format(_date!)
                            : 'Select attendance date',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: _date != null
                              ? FontWeight.w700
                              : FontWeight.w400,
                          color: _date != null
                              ? AppColors.primaryDark
                              : scheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Time pickers
              const Text('Correct Times (optional)',
                  style: TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _TimeTile(
                      label: 'Punch In',
                      icon: Icons.login_rounded,
                      color: AppColors.success,
                      time: _inTime,
                      onTap: () => _pickTime(true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _TimeTile(
                      label: 'Punch Out',
                      icon: Icons.logout_rounded,
                      color: AppColors.error,
                      time: _outTime,
                      onTap: () => _pickTime(false),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Reason
              TextFormField(
                controller: _reasonCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Reason',
                  hintText:
                      'Explain why this regularisation is needed...',
                  alignLabelWithHint: true,
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty
                        ? 'Reason is required'
                        : null,
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
                    : const Text('Submit Request'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimeTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final TimeOfDay? time;
  final VoidCallback onTap;
  const _TimeTile({
    required this.label,
    required this.icon,
    required this.color,
    this.time,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final hasTime = time != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: hasTime
              ? color.withAlpha(15)
              : scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color:
                hasTime ? color.withAlpha(80) : scheme.outlineVariant,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon,
                size: 18,
                color: hasTime ? color : scheme.onSurfaceVariant),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                  fontSize: 11, color: scheme.onSurfaceVariant),
            ),
            const SizedBox(height: 2),
            Text(
              hasTime ? time!.format(context) : 'Not set',
              style: TextStyle(
                fontSize: 14,
                fontWeight:
                    hasTime ? FontWeight.w700 : FontWeight.w400,
                color: hasTime ? color : scheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
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
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.warning.withAlpha(18),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.edit_calendar_rounded,
                    size: 48, color: AppColors.warning),
              ),
              const SizedBox(height: 20),
              const Text(
                'No regularisation requests',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'If you missed punching in/out, submit a request here and HR will review it',
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
                label: const Text('Submit Request'),
              ),
            ],
          ),
        ),
      );
}
