import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../data/models/travel_model.dart';
import '../providers/travel_provider.dart';

const _approverRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const _modeLabels = {
  'FLIGHT': '✈ Flight',
  'TRAIN': '🚆 Train',
  'BUS': '🚌 Bus',
  'CAR': '🚗 Car',
  'OTHER': '🚀 Other',
};

const _statusColors = {
  'PENDING': Color(0xFFF59E0B),
  'APPROVED': Color(0xFF10B981),
  'REJECTED': Color(0xFFEF4444),
  'CANCELLED': Color(0xFF9CA3AF),
};

class TravelScreen extends ConsumerStatefulWidget {
  const TravelScreen({super.key});

  @override
  ConsumerState<TravelScreen> createState() => _TravelScreenState();
}

class _TravelScreenState extends ConsumerState<TravelScreen> {
  String _filter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final requestsAsync = ref.watch(travelRequestsProvider);
    final auth = ref.watch(authNotifierProvider);
    final user = auth.valueOrNull?.user;
    final isApprover = _approverRoles.contains(user?.role);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Travel Requests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => _showCreateSheet(context),
          ),
        ],
      ),
      body: requestsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: ${e.toString()}')),
        data: (requests) {
          final filtered = _filter == 'ALL'
              ? requests
              : requests.where((r) => r.status == _filter).toList();

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(travelRequestsProvider),
            child: Column(
              children: [
                _FilterBar(
                  selected: _filter,
                  onSelect: (s) => setState(() => _filter = s),
                ),
                Expanded(
                  child: filtered.isEmpty
                      ? const _EmptyState()
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          itemCount: filtered.length,
                          itemBuilder: (context, i) => _TravelCard(
                            request: filtered[i],
                            isApprover: isApprover,
                            currentEmployeeId: user?.employeeId ?? '',
                            onApprove: () => _approve(context, filtered[i].id),
                            onReject: () => _showRejectSheet(context, filtered[i]),
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
    final ok = await ref.read(travelNotifierProvider.notifier).approveRequest(id);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok ? 'Request approved' : 'Failed to approve'),
        backgroundColor: ok ? AppColors.success : AppColors.error,
      ));
    }
  }

  void _showRejectSheet(BuildContext context, TravelRequest req) {
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
              const Text('Reject Request', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('${req.fromCity} → ${req.toCity}', style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 16),
              TextField(
                controller: reasonCtrl,
                decoration: const InputDecoration(
                  labelText: 'Reason (optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(backgroundColor: AppColors.error),
                      onPressed: () async {
                        Navigator.pop(context);
                        final reason = reasonCtrl.text.trim();
                        final ok = await ref
                            .read(travelNotifierProvider.notifier)
                            .rejectRequest(req.id, reason: reason.isEmpty ? null : reason);
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

  void _confirmCancel(BuildContext context, TravelRequest req) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel Request'),
        content: Text('Cancel your travel request to ${req.toCity}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Keep')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              Navigator.pop(context);
              final ok = await ref.read(travelNotifierProvider.notifier).cancelRequest(req.id);
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
      builder: (_) => const _CreateTravelSheet(),
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
    const filters = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    const labels = {
      'ALL': 'All', 'PENDING': 'Pending', 'APPROVED': 'Approved',
      'REJECTED': 'Rejected', 'CANCELLED': 'Cancelled',
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

// ── Travel Card ───────────────────────────────────────────────────────────────

class _TravelCard extends StatelessWidget {
  final TravelRequest request;
  final bool isApprover;
  final String currentEmployeeId;
  final VoidCallback onApprove;
  final VoidCallback onReject;
  final VoidCallback onCancel;

  const _TravelCard({
    required this.request,
    required this.isApprover,
    required this.currentEmployeeId,
    required this.onApprove,
    required this.onReject,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColors[request.status] ?? Colors.grey;
    final fmt = DateFormat('dd MMM yyyy');
    String fmtDate(String? d) => d != null ? fmt.format(DateTime.parse(d)) : '—';

    final isOwn = request.employeeId == currentEmployeeId;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          )
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
                    '${request.fromCity} → ${request.toCity}',
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
                    request.status,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(request.purpose, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 13)),

            if (isApprover) ...[
              const SizedBox(height: 4),
              Text(
                '${request.employee.firstName} ${request.employee.lastName} · ${request.employee.employeeCode}',
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
              ),
            ],

            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 10),

            Row(
              children: [
                _Info('Mode', _modeLabels[request.travelMode] ?? request.travelMode),
                const SizedBox(width: 16),
                _Info('Depart', fmtDate(request.departureDate)),
                if (request.returnDate != null) ...[
                  const SizedBox(width: 16),
                  _Info('Return', fmtDate(request.returnDate)),
                ],
              ],
            ),
            if (request.estimatedBudget != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  _Info('Budget', '₹${request.estimatedBudget!.toStringAsFixed(0)}'),
                  if (request.hotelRequired) ...[
                    const SizedBox(width: 16),
                    _Info('Hotel', '✓ Required'),
                  ],
                ],
              ),
            ],

            if (request.rejectedReason != null && request.rejectedReason!.isNotEmpty) ...[
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
                        request.rejectedReason!,
                        style: const TextStyle(fontSize: 12, color: Color(0xFFB91C1C)),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            if (request.isPending && (isApprover || isOwn)) ...[
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (isApprover) ...[
                    _ActionButton(
                      label: 'Approve',
                      color: const Color(0xFF10B981),
                      onTap: onApprove,
                    ),
                    const SizedBox(width: 8),
                    _ActionButton(
                      label: 'Reject',
                      color: const Color(0xFFEF4444),
                      onTap: onReject,
                    ),
                    const SizedBox(width: 8),
                  ],
                  if (isOwn || isApprover)
                    _ActionButton(
                      label: 'Cancel',
                      color: const Color(0xFF9CA3AF),
                      onTap: onCancel,
                    ),
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

class _ActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionButton({required this.label, required this.color, required this.onTap});

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
        child: Text(
          label,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color),
        ),
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
            height: 72,
            width: 72,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(36),
            ),
            child: const Icon(Icons.flight_takeoff_rounded, size: 36, color: Color(0xFF3B82F6)),
          ),
          const SizedBox(height: 16),
          const Text('No travel requests', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          const Text('Tap + to raise a new request', style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}

// ── Create Sheet ──────────────────────────────────────────────────────────────

class _CreateTravelSheet extends ConsumerStatefulWidget {
  const _CreateTravelSheet();

  @override
  ConsumerState<_CreateTravelSheet> createState() => _CreateTravelSheetState();
}

class _CreateTravelSheetState extends ConsumerState<_CreateTravelSheet> {
  final _formKey = GlobalKey<FormState>();
  final _purposeCtrl = TextEditingController();
  final _fromCtrl = TextEditingController();
  final _toCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _mode = 'FLIGHT';
  DateTime? _departureDate;
  DateTime? _returnDate;
  bool _hotelRequired = false;
  bool _advanceRequired = false;
  bool _loading = false;

  @override
  void dispose() {
    _purposeCtrl.dispose();
    _fromCtrl.dispose();
    _toCtrl.dispose();
    _budgetCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isDeparture}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: isDeparture ? (_departureDate ?? now) : (_returnDate ?? (_departureDate ?? now)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isDeparture) {
          _departureDate = picked;
        } else {
          _returnDate = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_departureDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a departure date')),
      );
      return;
    }
    setState(() => _loading = true);
    final fmt = DateFormat('yyyy-MM-dd');
    final ok = await ref.read(travelNotifierProvider.notifier).createRequest(
          purpose: _purposeCtrl.text.trim(),
          fromCity: _fromCtrl.text.trim(),
          toCity: _toCtrl.text.trim(),
          departureDate: fmt.format(_departureDate!),
          returnDate: _returnDate != null ? fmt.format(_returnDate!) : null,
          travelMode: _mode,
          estimatedBudget: _budgetCtrl.text.isEmpty ? null : double.tryParse(_budgetCtrl.text),
          hotelRequired: _hotelRequired,
          advanceRequired: _advanceRequired,
          notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        );
    setState(() => _loading = false);
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok ? 'Request submitted' : 'Failed to submit request'),
        backgroundColor: ok ? AppColors.success : AppColors.error,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd MMM yyyy');
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollCtrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 12),
            const Text('New Travel Request', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
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
                        label: 'Purpose *',
                        child: TextFormField(
                          controller: _purposeCtrl,
                          maxLines: 2,
                          decoration: const InputDecoration(
                            hintText: 'Business meeting, conference…',
                            border: OutlineInputBorder(),
                          ),
                          validator: (v) => (v == null || v.trim().length < 3) ? 'Min 3 characters' : null,
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _Field(
                              label: 'From City *',
                              child: TextFormField(
                                controller: _fromCtrl,
                                decoration: const InputDecoration(hintText: 'Mumbai', border: OutlineInputBorder()),
                                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _Field(
                              label: 'To City *',
                              child: TextFormField(
                                controller: _toCtrl,
                                decoration: const InputDecoration(hintText: 'Delhi', border: OutlineInputBorder()),
                                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                              ),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _Field(
                              label: 'Departure *',
                              child: GestureDetector(
                                onTap: () => _pickDate(isDeparture: true),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.grey),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    _departureDate != null ? fmt.format(_departureDate!) : 'Select date',
                                    style: TextStyle(
                                      color: _departureDate != null ? Colors.black : Colors.grey,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _Field(
                              label: 'Return',
                              child: GestureDetector(
                                onTap: () => _pickDate(isDeparture: false),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: Colors.grey),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    _returnDate != null ? fmt.format(_returnDate!) : 'Optional',
                                    style: TextStyle(
                                      color: _returnDate != null ? Colors.black : Colors.grey,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      _Field(
                        label: 'Travel Mode',
                        child: DropdownButtonFormField<String>(
                          initialValue: _mode,
                          decoration: const InputDecoration(border: OutlineInputBorder()),
                          items: _modeLabels.entries
                              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                              .toList(),
                          onChanged: (v) => setState(() => _mode = v!),
                        ),
                      ),
                      _Field(
                        label: 'Estimated Budget (₹)',
                        child: TextFormField(
                          controller: _budgetCtrl,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: '5000', border: OutlineInputBorder()),
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: CheckboxListTile(
                              value: _hotelRequired,
                              onChanged: (v) => setState(() => _hotelRequired = v!),
                              title: const Text('Hotel', style: TextStyle(fontSize: 14)),
                              controlAffinity: ListTileControlAffinity.leading,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                          Expanded(
                            child: CheckboxListTile(
                              value: _advanceRequired,
                              onChanged: (v) => setState(() => _advanceRequired = v!),
                              title: const Text('Advance', style: TextStyle(fontSize: 14)),
                              controlAffinity: ListTileControlAffinity.leading,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ],
                      ),
                      _Field(
                        label: 'Notes',
                        child: TextFormField(
                          controller: _notesCtrl,
                          maxLines: 2,
                          decoration: const InputDecoration(
                            hintText: 'Any additional details…',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _loading ? null : _submit,
                          child: _loading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
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
          Text(
            label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
          ),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }
}
