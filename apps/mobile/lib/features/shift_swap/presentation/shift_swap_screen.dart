import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/shift_swap_provider.dart';
import '../data/models/shift_swap_model.dart';

class ShiftSwapScreen extends ConsumerWidget {
  const ShiftSwapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(shiftSwapListProvider);

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
                      Icon(Icons.error_outline, color: AppColors.error, size: 48),
                      const SizedBox(height: 12),
                      Text('Failed to load', style: TextStyle(color: AppColors.error)),
                      TextButton(
                        onPressed: () => ref.invalidate(shiftSwapListProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (swaps) => swaps.isEmpty
                  ? const SliverFillRemaining(child: _EmptyState())
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _SwapCard(swap: swaps[i]),
                        ),
                        childCount: swaps.length,
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
        icon: const Icon(Icons.swap_horiz_rounded),
        label: const Text('Request Swap'),
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
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 56, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Text('Shift Swap',
                      style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Exchange shifts with a colleague',
                      style: TextStyle(color: Colors.white.withAlpha(200), fontSize: 14)),
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
      builder: (_) => const _CreateSwapSheet(),
    );
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

Color _statusColor(String s) => switch (s.toUpperCase()) {
      'APPROVED' => AppColors.success,
      'REJECTED' => AppColors.error,
      'PENDING_APPROVAL' => const Color(0xFFF97316),
      _ => AppColors.info,
    };

Color _statusBg(String s) => switch (s.toUpperCase()) {
      'APPROVED' => AppColors.successLight,
      'REJECTED' => AppColors.errorLight,
      'PENDING_APPROVAL' => const Color(0xFFFFF7ED),
      _ => AppColors.infoLight,
    };

String _statusLabel(String s) => switch (s.toUpperCase()) {
      'PENDING_ACCEPTANCE' => 'Awaiting Accept',
      'PENDING_APPROVAL' => 'Awaiting Approval',
      'APPROVED' => 'Approved',
      'REJECTED' => 'Rejected',
      'CANCELLED' => 'Cancelled',
      _ => s,
    };

// ─── Swap Card ────────────────────────────────────────────────────────────────

class _SwapCard extends StatelessWidget {
  final ShiftSwapRequest swap;
  const _SwapCard({required this.swap});

  @override
  Widget build(BuildContext context) {
    final status = swap.status.toUpperCase();
    final color = _statusColor(status);
    final bg = _statusBg(status);
    final fmt = DateFormat('dd MMM yyyy');

    DateTime? myDate, theirDate;
    try { myDate = DateTime.parse(swap.requesterDate).toLocal(); } catch (_) {}
    try { theirDate = DateTime.parse(swap.targetDate).toLocal(); } catch (_) {}

    final targetName = swap.target != null
        ? '${swap.target!['firstName'] ?? ''} ${swap.target!['lastName'] ?? ''}'.trim()
        : 'Colleague';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: [
          BoxShadow(color: Colors.black.withAlpha(10), blurRadius: 8, offset: const Offset(0, 2)),
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
                      Text('With $targetName',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          _DateChip(
                            label: 'Your date',
                            date: myDate != null ? fmt.format(myDate) : swap.requesterDate,
                            color: AppColors.primary,
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 6),
                            child: Icon(Icons.swap_horiz_rounded, size: 16, color: Colors.grey),
                          ),
                          _DateChip(
                            label: 'Their date',
                            date: theirDate != null ? fmt.format(theirDate) : swap.targetDate,
                            color: AppColors.info,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
                  child: Text(_statusLabel(status),
                      style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            if (swap.reason != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(8)),
                child: Row(
                  children: [
                    Icon(Icons.chat_bubble_outline_rounded, size: 14, color: Colors.grey[500]),
                    const SizedBox(width: 6),
                    Expanded(child: Text(swap.reason!, style: TextStyle(fontSize: 13, color: Colors.grey[700]))),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              'Submitted ${DateFormat('dd MMM, hh:mm a').format(swap.createdAt.toLocal())}',
              style: TextStyle(fontSize: 11, color: Colors.grey[400]),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateChip extends StatelessWidget {
  final String label, date;
  final Color color;
  const _DateChip({required this.label, required this.date, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 9, color: Colors.grey[500])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withAlpha(20),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(date, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
        ),
      ],
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
            width: 80, height: 80,
            decoration: BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
            child: const Icon(Icons.swap_horiz_rounded, color: AppColors.primary, size: 40),
          ),
          const SizedBox(height: 16),
          const Text('No Shift Swaps',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
          const SizedBox(height: 6),
          Text('Need to swap a shift? Send a request to a colleague.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[500])),
        ],
      ),
    );
  }
}

// ─── Create Sheet ─────────────────────────────────────────────────────────────

class _CreateSwapSheet extends ConsumerStatefulWidget {
  const _CreateSwapSheet();

  @override
  ConsumerState<_CreateSwapSheet> createState() => _CreateSwapSheetState();
}

class _CreateSwapSheetState extends ConsumerState<_CreateSwapSheet> {
  final _formKey = GlobalKey<FormState>();
  final _targetEmpCtrl = TextEditingController();
  final _targetEmpIdCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();
  DateTime? _myDate, _theirDate;
  bool _submitting = false;
  static final _fmt = DateFormat('dd MMM yyyy');

  @override
  void dispose() {
    _targetEmpCtrl.dispose();
    _targetEmpIdCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isMyDate) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
      helpText: isMyDate ? 'Your shift date' : 'Their shift date',
    );
    if (picked != null) {
      setState(() {
        if (isMyDate) { _myDate = picked; }
        else { _theirDate = picked; }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_myDate == null || _theirDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select both dates')),
      );
      return;
    }
    if (_targetEmpIdCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the target employee ID')),
      );
      return;
    }
    setState(() => _submitting = true);
    final ok = await ref.read(createShiftSwapProvider.notifier).create(
          targetEmployeeId: _targetEmpIdCtrl.text.trim(),
          requesterDate: DateFormat('yyyy-MM-dd').format(_myDate!),
          targetDate: DateFormat('yyyy-MM-dd').format(_theirDate!),
          reason: _reasonCtrl.text.trim().isEmpty ? null : _reasonCtrl.text.trim(),
        );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Shift swap request sent'), backgroundColor: AppColors.success),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to send request'), backgroundColor: AppColors.error),
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
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Request Shift Swap',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              const SizedBox(height: 4),
              Text('Exchange your shift date with a colleague',
                  style: TextStyle(fontSize: 13, color: Colors.grey[500])),
              const SizedBox(height: 24),

              TextFormField(
                controller: _targetEmpIdCtrl,
                decoration: InputDecoration(
                  labelText: 'Target Employee ID *',
                  hintText: 'Enter colleague\'s employee ID',
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
                ),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: _DateTile(
                      label: 'Your date *',
                      date: _myDate != null ? _fmt.format(_myDate!) : null,
                      color: AppColors.primary,
                      onTap: () => _pickDate(true),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _DateTile(
                      label: 'Their date *',
                      date: _theirDate != null ? _fmt.format(_theirDate!) : null,
                      color: AppColors.info,
                      onTap: () => _pickDate(false),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              TextFormField(
                controller: _reasonCtrl,
                minLines: 2,
                maxLines: 4,
                decoration: InputDecoration(
                  labelText: 'Reason (optional)',
                  hintText: 'Why do you need to swap?',
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 22, height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text('Send Request',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DateTile extends StatelessWidget {
  final String label;
  final String? date;
  final Color color;
  final VoidCallback onTap;
  const _DateTile({required this.label, required this.date, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final hasDate = date != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: hasDate ? color.withAlpha(20) : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: hasDate ? color : Colors.transparent, width: 1.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[500])),
            const SizedBox(height: 4),
            Text(
              date ?? 'Select',
              style: TextStyle(
                fontSize: 13,
                fontWeight: hasDate ? FontWeight.w600 : FontWeight.normal,
                color: hasDate ? color : Colors.grey[400],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
