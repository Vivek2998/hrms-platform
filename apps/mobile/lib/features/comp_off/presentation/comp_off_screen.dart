import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/comp_off_provider.dart';
import '../data/models/comp_off_model.dart';

class CompOffScreen extends ConsumerWidget {
  const CompOffScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(compOffListProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          _buildHeader(context),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
            sliver: listAsync.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.error_outline,
                          color: AppColors.error, size: 48),
                      const SizedBox(height: 12),
                      Text('Failed to load requests',
                          style: TextStyle(color: AppColors.error)),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () => ref.invalidate(compOffListProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (requests) => requests.isEmpty
                  ? const SliverFillRemaining(child: _EmptyState())
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _RequestCard(request: requests[i]),
                        ),
                        childCount: requests.length,
                      ),
                    ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateSheet(context),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Request Comp-Off'),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 180,
      pinned: true,
      backgroundColor: AppColors.primary,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
        onPressed: () => Navigator.of(context).pop(),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: AppColors.brandGradient,
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 56, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Text(
                    'Comp-Off',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Compensatory off for extra work days',
                    style: TextStyle(
                      color: Colors.white.withAlpha(200),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const CreateCompOffSheet(),
    );
  }
}

// ─── Status helpers ──────────────────────────────────────────────────────────

Color _statusColor(String status) => switch (status.toUpperCase()) {
      'APPROVED' => AppColors.success,
      'REJECTED' => AppColors.error,
      'EXPIRED' => AppColors.warning,
      _ => AppColors.info,
    };

Color _statusBg(String status) => switch (status.toUpperCase()) {
      'APPROVED' => AppColors.successLight,
      'REJECTED' => AppColors.errorLight,
      'EXPIRED' => AppColors.warningLight,
      _ => AppColors.infoLight,
    };

IconData _statusIcon(String status) => switch (status.toUpperCase()) {
      'APPROVED' => Icons.check_circle_rounded,
      'REJECTED' => Icons.cancel_rounded,
      'EXPIRED' => Icons.timer_off_rounded,
      _ => Icons.schedule_rounded,
    };

// ─── Request Card ─────────────────────────────────────────────────────────────

class _RequestCard extends StatelessWidget {
  final CompOffRequest request;
  const _RequestCard({required this.request});

  @override
  Widget build(BuildContext context) {
    final status = request.status.toUpperCase();
    final color = _statusColor(status);
    final bg = _statusBg(status);
    final fmt = DateFormat('dd MMM yyyy');

    DateTime? workedDt;
    DateTime? requestedDt;
    try {
      workedDt = DateTime.parse(request.workedDate).toLocal();
    } catch (_) {}
    try {
      if (request.requestedDate != null) {
        requestedDt = DateTime.parse(request.requestedDate!).toLocal();
      }
    } catch (_) {}

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Worked: ${workedDt != null ? fmt.format(workedDt) : request.workedDate}',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      if (requestedDt != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          'Comp-off on: ${fmt.format(requestedDt)}',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: bg,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_statusIcon(status), color: color, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        status[0] + status.substring(1).toLowerCase(),
                        style: TextStyle(
                          color: color,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.chat_bubble_outline_rounded,
                      size: 14, color: Colors.grey[500]),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      request.reason,
                      style:
                          TextStyle(fontSize: 13, color: Colors.grey[700]),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Submitted ${DateFormat('dd MMM, hh:mm a').format(request.createdAt.toLocal())}',
              style: TextStyle(fontSize: 11, color: Colors.grey[400]),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.beach_access_rounded,
                color: AppColors.primary, size: 40),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Comp-Off Requests',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1E293B)),
          ),
          const SizedBox(height: 6),
          Text(
            'Worked on a holiday or weekend?\nRequest a compensatory day off.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }
}

// ─── Create Sheet ─────────────────────────────────────────────────────────────

class CreateCompOffSheet extends ConsumerStatefulWidget {
  const CreateCompOffSheet({super.key});

  @override
  ConsumerState<CreateCompOffSheet> createState() =>
      _CreateCompOffSheetState();
}

class _CreateCompOffSheetState extends ConsumerState<CreateCompOffSheet> {
  final _formKey = GlobalKey<FormState>();
  final _reasonCtrl = TextEditingController();

  DateTime? _workedDate;
  DateTime? _requestedDate;
  bool _submitting = false;

  static final _fmt = DateFormat('dd MMM yyyy');

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickCompOffDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _requestedDate ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 180)),
      helpText: 'Select Comp-Off Date',
    );
    if (picked == null) return;
    setState(() {
      _requestedDate = picked;
      // Reset worked date if it falls outside the new 90-day window.
      if (_workedDate != null) {
        final earliest = picked.subtract(const Duration(days: 90));
        if (_workedDate!.isBefore(earliest) || _workedDate!.isAfter(picked)) {
          _workedDate = null;
        }
      }
    });
  }

  Future<void> _pickWorkedDate() async {
    if (_requestedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select the comp-off date first'),
        ),
      );
      return;
    }
    final compOffDate = _requestedDate!;
    final earliest = compOffDate.subtract(const Duration(days: 90));
    final picked = await showDatePicker(
      context: context,
      initialDate: _workedDate ??
          (earliest.isBefore(DateTime.now())
              ? DateTime.now().subtract(const Duration(days: 1))
              : earliest),
      firstDate: earliest,
      lastDate: compOffDate,
      helpText: 'Select Date Worked',
    );
    if (picked == null) return;
    setState(() => _workedDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_requestedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select the comp-off date')),
      );
      return;
    }
    if (_workedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select the date you worked')),
      );
      return;
    }

    setState(() => _submitting = true);

    final ok = await ref.read(createCompOffProvider.notifier).create(
          workedDate: DateFormat('yyyy-MM-dd').format(_workedDate!),
          requestedDate: DateFormat('yyyy-MM-dd').format(_requestedDate!),
          reason: _reasonCtrl.text.trim(),
        );

    if (!mounted) return;
    setState(() => _submitting = false);

    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Comp-off request submitted successfully'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      final err = ref.read(createCompOffProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(err.hasError ? err.error.toString() : 'Failed to submit request'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: const EdgeInsets.fromLTRB(8, 0, 8, 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Request Comp-Off',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Claim compensatory leave for extra hours worked',
                style: TextStyle(fontSize: 13, color: Colors.grey[500]),
              ),
              const SizedBox(height: 24),

              // Step 1: Comp-off date (pick this first)
              _DatePickerTile(
                label: 'Comp-Off Date *',
                icon: Icons.beach_access_rounded,
                iconColor: AppColors.success,
                date: _requestedDate,
                fmt: _fmt,
                onTap: _pickCompOffDate,
              ),
              const SizedBox(height: 12),

              // Step 2: Date worked (unlocked after comp-off date is chosen)
              _DatePickerTile(
                label: 'Date Worked *',
                icon: Icons.work_history_rounded,
                iconColor: _requestedDate != null
                    ? AppColors.primary
                    : Colors.grey,
                date: _workedDate,
                fmt: _fmt,
                onTap: _pickWorkedDate,
              ),
              const SizedBox(height: 12),

              // Reason
              TextFormField(
                controller: _reasonCtrl,
                minLines: 3,
                maxLines: 5,
                decoration: InputDecoration(
                  labelText: 'Reason *',
                  hintText: 'Why did you work on this day?',
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide:
                        const BorderSide(color: AppColors.primary, width: 1.5),
                  ),
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Reason is required' : null,
              ),
              const SizedBox(height: 24),

              // Submit button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Submit Request',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Date Picker Tile ─────────────────────────────────────────────────────────

class _DatePickerTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color iconColor;
  final DateTime? date;
  final DateFormat fmt;
  final VoidCallback onTap;

  const _DatePickerTile({
    required this.label,
    required this.icon,
    required this.iconColor,
    required this.date,
    required this.fmt,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasDate = date != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: hasDate ? AppColors.primaryLight : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: hasDate ? AppColors.primary : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withAlpha(20),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hasDate ? fmt.format(date!) : 'Select date',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight:
                          hasDate ? FontWeight.w600 : FontWeight.normal,
                      color: hasDate
                          ? AppColors.primary
                          : Colors.grey[400],
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.calendar_today_rounded,
              size: 16,
              color: hasDate ? AppColors.primary : Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }
}
