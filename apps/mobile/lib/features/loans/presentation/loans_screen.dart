import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/loan_model.dart';
import '../providers/loan_provider.dart';

const _approverRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

class LoansScreen extends ConsumerStatefulWidget {
  const LoansScreen({super.key});

  @override
  ConsumerState<LoansScreen> createState() => _LoansScreenState();
}

class _LoansScreenState extends ConsumerState<LoansScreen> {
  String _filter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final loansAsync = ref.watch(loanRequestsProvider);
    final auth = ref.watch(authNotifierProvider);
    final user = auth.valueOrNull?.user;
    final isApprover = _approverRoles.contains(user?.role);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Loans & Advances'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => _showCreateSheet(context),
          ),
        ],
      ),
      body: loansAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
        data: (loans) {
          final filtered = _filter == 'ALL'
              ? loans
              : loans.where((l) => l.status == _filter).toList();

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(loanRequestsProvider),
            child: Column(
              children: [
                _FilterBar(selected: _filter, onSelect: (s) => setState(() => _filter = s)),
                Expanded(
                  child: filtered.isEmpty
                      ? const _EmptyState()
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          itemCount: filtered.length,
                          itemBuilder: (context, i) => _LoanCard(
                            loan: filtered[i],
                            isApprover: isApprover,
                            currentEmployeeId: user?.employeeId ?? '',
                            onApprove: () => _approve(context, filtered[i].id),
                            onReject: () => _showRejectSheet(context, filtered[i]),
                            onDisburse: () => _disburse(context, filtered[i].id),
                            onCancel: () => _confirmCancel(context, filtered[i]),
                          ),
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _approve(BuildContext context, String id) async {
    final ok = await ref.read(loanNotifierProvider.notifier).approveLoan(id);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok ? 'Loan approved' : 'Failed to approve'),
        backgroundColor: ok ? AppColors.success : AppColors.error,
      ));
    }
  }

  Future<void> _disburse(BuildContext context, String id) async {
    final ok = await ref.read(loanNotifierProvider.notifier).disburseLoan(id);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok ? 'Marked as disbursed' : 'Failed'),
        backgroundColor: ok ? AppColors.success : AppColors.error,
      ));
    }
  }

  void _showRejectSheet(BuildContext context, LoanRequest loan) {
    final reasonCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Reject Loan Request', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                '${kLoanTypeLabels[loan.loanType] ?? loan.loanType} — ₹${loan.amount.toStringAsFixed(0)}',
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: reasonCtrl,
                decoration: const InputDecoration(labelText: 'Reason (optional)', border: OutlineInputBorder()),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel'))),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(backgroundColor: AppColors.error),
                      onPressed: () async {
                        Navigator.pop(context);
                        final reason = reasonCtrl.text.trim();
                        final ok = await ref.read(loanNotifierProvider.notifier)
                            .rejectLoan(loan.id, reason: reason.isEmpty ? null : reason);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(ok ? 'Request rejected' : 'Failed to reject'),
                            backgroundColor: ok ? AppColors.success : AppColors.error,
                          ));
                        }
                      },
                      child: const Text('Reject'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmCancel(BuildContext context, LoanRequest loan) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel Request'),
        content: Text('Cancel your ${kLoanTypeLabels[loan.loanType] ?? loan.loanType} of ₹${loan.amount.toStringAsFixed(0)}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Keep')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              Navigator.pop(context);
              final ok = await ref.read(loanNotifierProvider.notifier).cancelLoan(loan.id);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(ok ? 'Request cancelled' : 'Failed to cancel'),
                  backgroundColor: ok ? AppColors.success : AppColors.error,
                ));
              }
            },
            child: const Text('Cancel Request'),
          ),
        ],
      ),
    );
  }

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CreateLoanSheet(),
    );
  }
}

// ── Filter Bar ────────────────────────────────────────────────────────────────

class _FilterBar extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onSelect;
  const _FilterBar({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    const filters = ['ALL', 'PENDING', 'APPROVED', 'DISBURSED', 'CLOSED', 'REJECTED'];
    const labels = {
      'ALL': 'All', 'PENDING': 'Pending', 'APPROVED': 'Approved',
      'DISBURSED': 'Disbursed', 'CLOSED': 'Closed', 'REJECTED': 'Rejected',
    };
    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        children: filters.map((f) {
          final active = selected == f;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onSelect(f),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                decoration: BoxDecoration(
                  color: active ? AppColors.primary : const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  labels[f]!,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: active ? Colors.white : const Color(0xFF6B7280),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Loan Card ─────────────────────────────────────────────────────────────────

class _LoanCard extends StatelessWidget {
  final LoanRequest loan;
  final bool isApprover;
  final String currentEmployeeId;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  final VoidCallback onDisburse;
  final VoidCallback onCancel;

  const _LoanCard({
    required this.loan,
    required this.isApprover,
    required this.currentEmployeeId,
    required this.onApprove,
    required this.onReject,
    required this.onDisburse,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = Color(kLoanStatusColors[loan.status] ?? 0xFF9CA3AF);
    final fmt = DateFormat('dd MMM yyyy');
    final isOwn = loan.employeeId == currentEmployeeId;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 2)),
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
                  child: Text(
                    kLoanTypeLabels[loan.loanType] ?? loan.loanType,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    loan.status,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: statusColor),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '₹${loan.amount.toStringAsFixed(0)}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF111827)),
            ),
            const SizedBox(height: 4),
            Text(loan.purpose, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13)),

            if (isApprover) ...[
              const SizedBox(height: 4),
              Text(
                '${loan.employee.firstName} ${loan.employee.lastName} · ${loan.employee.employeeCode}',
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
              ),
            ],

            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 10),

            Row(
              children: [
                if (loan.tenure != null) ...[
                  _Info('Tenure', '${loan.tenure} months'),
                  const SizedBox(width: 16),
                ],
                _Info('Applied', fmt.format(DateTime.parse(loan.createdAt))),
                if (loan.disbursedAt != null) ...[
                  const SizedBox(width: 16),
                  _Info('Disbursed', fmt.format(DateTime.parse(loan.disbursedAt!))),
                ],
              ],
            ),

            if (loan.rejectedReason != null && loan.rejectedReason!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, color: Color(0xFFEF4444), size: 14),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        loan.rejectedReason!,
                        style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C)),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if ((isApprover && (loan.isPending || loan.isApproved)) ||
                (isOwn && loan.isPending)) ...[
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (isApprover && loan.isPending) ...[
                    _ActionBtn(label: 'Approve', color: AppColors.success, onTap: onApprove),
                    const SizedBox(width: 8),
                    _ActionBtn(label: 'Reject', color: AppColors.error, onTap: onReject),
                    const SizedBox(width: 8),
                  ],
                  if (isApprover && loan.isApproved) ...[
                    _ActionBtn(label: 'Disburse', color: const Color(0xFF3B82F6), onTap: onDisburse),
                    const SizedBox(width: 8),
                  ],
                  if (isOwn && loan.isPending)
                    _ActionBtn(label: 'Cancel', color: const Color(0xFF9CA3AF), onTap: onCancel),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Info extends StatelessWidget {
  final String label;
  final String value;
  const _Info(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF9CA3AF), fontWeight: FontWeight.w500)),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionBtn({required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
      ),
    );
  }
}

// ── Empty State ───────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 72, width: 72,
            decoration: BoxDecoration(
              color: const Color(0xFFF5F3FF),
              borderRadius: BorderRadius.circular(36),
            ),
            child: const Icon(Icons.credit_card_rounded, size: 36, color: Color(0xFF7C3AED)),
          ),
          const SizedBox(height: 16),
          const Text('No loan requests', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          const Text('Tap + to apply for a loan or advance', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

// ── Create Sheet ──────────────────────────────────────────────────────────────

class _CreateLoanSheet extends ConsumerStatefulWidget {
  const _CreateLoanSheet();

  @override
  ConsumerState<_CreateLoanSheet> createState() => _CreateLoanSheetState();
}

class _CreateLoanSheetState extends ConsumerState<_CreateLoanSheet> {
  final _formKey = GlobalKey<FormState>();
  final _purposeCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _tenureCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _loanType = 'SALARY_ADVANCE';
  bool _loading = false;

  @override
  void dispose() {
    _purposeCtrl.dispose();
    _amountCtrl.dispose();
    _tenureCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    final ok = await ref.read(loanNotifierProvider.notifier).createLoan(
          loanType: _loanType,
          amount: double.tryParse(_amountCtrl.text) ?? 0,
          tenure: _tenureCtrl.text.isEmpty ? null : int.tryParse(_tenureCtrl.text),
          purpose: _purposeCtrl.text.trim(),
          notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        );
    setState(() => _loading = false);
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok ? 'Request submitted' : 'Failed to submit'),
        backgroundColor: ok ? AppColors.success : AppColors.error,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.9,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(width: 40, height: 4,
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            const Text('Request Loan / Advance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(height: 20),
            Expanded(
              child: SingleChildScrollView(
                controller: scrollCtrl,
                padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _Field(
                        label: 'Loan Type',
                        child: DropdownButtonFormField<String>(
                          initialValue: _loanType,
                          decoration: const InputDecoration(border: OutlineInputBorder()),
                          items: kLoanTypeLabels.entries
                              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                              .toList(),
                          onChanged: (v) => setState(() => _loanType = v!),
                        ),
                      ),
                      Row(children: [
                        Expanded(
                          child: _Field(
                            label: 'Amount (₹) *',
                            child: TextFormField(
                              controller: _amountCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: '50000', border: OutlineInputBorder()),
                              validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _Field(
                            label: 'Tenure (months)',
                            child: TextFormField(
                              controller: _tenureCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(hintText: '12', border: OutlineInputBorder()),
                            ),
                          ),
                        ),
                      ]),
                      _Field(
                        label: 'Purpose *',
                        child: TextFormField(
                          controller: _purposeCtrl,
                          maxLines: 2,
                          decoration: const InputDecoration(
                            hintText: 'Medical emergency, home renovation…',
                            border: OutlineInputBorder(),
                          ),
                          validator: (v) => (v == null || v.trim().length < 3) ? 'Min 3 characters' : null,
                        ),
                      ),
                      _Field(
                        label: 'Notes',
                        child: TextFormField(
                          controller: _notesCtrl,
                          maxLines: 2,
                          decoration: const InputDecoration(hintText: 'Any additional details…', border: OutlineInputBorder()),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _loading ? null : _submit,
                          child: _loading
                              ? const SizedBox(height: 18, width: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Text('Submit Request'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final Widget child;
  const _Field({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }
}
