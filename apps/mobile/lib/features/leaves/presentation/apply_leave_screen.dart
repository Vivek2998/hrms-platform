import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';
import '../data/models/leave_model.dart';

class ApplyLeaveScreen extends ConsumerStatefulWidget {
  const ApplyLeaveScreen({super.key});

  @override
  ConsumerState<ApplyLeaveScreen> createState() => _ApplyLeaveScreenState();
}

class _ApplyLeaveScreenState extends ConsumerState<ApplyLeaveScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonCtrl = TextEditingController();

  ApiLeaveType? _selectedType;
  DateTime? _startDate;
  DateTime? _endDate;
  String _session = 'FIRST_HALF';

  bool get _isHalfDay => _selectedType?.isHalfDay ?? false;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isStart) async {
    final now = DateTime.now();
    final initial =
        isStart ? (_startDate ?? now) : (_endDate ?? _startDate ?? now);
    final first = isStart ? now : (_startDate ?? now);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: first,
      lastDate: DateTime(now.year + 1),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
        if (_isHalfDay) {
          _endDate = picked; // half-day: start == end
        } else if (_endDate != null && _endDate!.isBefore(picked)) {
          _endDate = picked;
        }
      } else {
        _endDate = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select leave date(s)')),
      );
      return;
    }
    await ref.read(applyLeaveNotifierProvider.notifier).apply(
          leaveTypeId: _selectedType!.id,
          startDate: _startDate!,
          endDate: _endDate!,
          reason: _reasonCtrl.text.trim(),
          session: _isHalfDay ? _session : null,
        );
    if (!mounted) return;
    final state = ref.read(applyLeaveNotifierProvider);
    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error?.toString() ?? 'Failed to submit'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Leave request submitted'),
          backgroundColor: Colors.green,
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final leaveTypesAsync = ref.watch(leaveTypesProvider);
    final balancesAsync = ref.watch(leaveBalancesProvider);
    final applyState = ref.watch(applyLeaveNotifierProvider);
    final fmt = DateFormat('d MMM y');
    final scheme = Theme.of(context).colorScheme;

    // Balance map for annotating the dropdown
    final balanceMap = {
      for (final b in (balancesAsync.valueOrNull ?? [])) b.leaveTypeId: b,
    };

    return Scaffold(
      appBar: AppBar(title: const Text('Apply for Leave')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Leave type dropdown ────────────────────────────────
              leaveTypesAsync.when(
                data: (types) => DropdownButtonFormField<ApiLeaveType>(
                  value: _selectedType,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Leave Type',
                    border: OutlineInputBorder(),
                  ),
                  items: types.map((t) {
                    final bal = balanceMap[t.id];
                    final note = bal != null
                        ? '${bal.remainingDays.toStringAsFixed(0)} days left'
                        : t.daysAllowed > 0
                            ? '${t.daysAllowed} days/yr'
                            : '';
                    return DropdownMenuItem<ApiLeaveType>(
                      value: t,
                      child: Row(
                        children: [
                          Expanded(child: Text(t.name)),
                          if (note.isNotEmpty)
                            Text(
                              note,
                              style: TextStyle(
                                  fontSize: 11, color: scheme.onSurfaceVariant),
                            ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (v) {
                    setState(() {
                      _selectedType = v;
                      // If switching to half-day, lock end == start
                      if (v != null && v.isHalfDay && _startDate != null) {
                        _endDate = _startDate;
                      }
                    });
                  },
                  validator: (v) => v == null ? 'Select a leave type' : null,
                ),
                loading: () => const LinearProgressIndicator(),
                error: (_, __) => const Text('Could not load leave types'),
              ),

              const SizedBox(height: 20),

              // ── Half-day session selector ──────────────────────────
              if (_isHalfDay) ...[
                Text('Session',
                    style: Theme.of(context)
                        .textTheme
                        .labelMedium
                        ?.copyWith(color: scheme.onSurfaceVariant)),
                const SizedBox(height: 8),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(
                      value: 'FIRST_HALF',
                      label: Text('First Half'),
                      icon: Icon(Icons.wb_sunny_outlined, size: 16),
                    ),
                    ButtonSegment(
                      value: 'SECOND_HALF',
                      label: Text('Second Half'),
                      icon: Icon(Icons.nights_stay_outlined, size: 16),
                    ),
                  ],
                  selected: {_session},
                  onSelectionChanged: (val) =>
                      setState(() => _session = val.first),
                ),
                const SizedBox(height: 20),
              ],

              // ── Date picker(s) ─────────────────────────────────────
              if (_isHalfDay) ...[
                // Single date for half-day leave
                InkWell(
                  onTap: () => _pickDate(true),
                  borderRadius: BorderRadius.circular(8),
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Date',
                      border: OutlineInputBorder(),
                      suffixIcon: Icon(Icons.calendar_today, size: 18),
                    ),
                    child: Text(
                      _startDate != null ? fmt.format(_startDate!) : 'Select date',
                      style: TextStyle(
                        color: _startDate != null
                            ? null
                            : scheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
              ] else ...[
                // Start + end dates for multi-day leave
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => _pickDate(true),
                        borderRadius: BorderRadius.circular(8),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'Start Date',
                            border: OutlineInputBorder(),
                            suffixIcon: Icon(Icons.calendar_today, size: 16),
                          ),
                          child: Text(
                            _startDate != null
                                ? fmt.format(_startDate!)
                                : 'Select',
                            style: TextStyle(
                              color: _startDate != null
                                  ? null
                                  : scheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: () => _pickDate(false),
                        borderRadius: BorderRadius.circular(8),
                        child: InputDecorator(
                          decoration: const InputDecoration(
                            labelText: 'End Date',
                            border: OutlineInputBorder(),
                            suffixIcon: Icon(Icons.calendar_today, size: 16),
                          ),
                          child: Text(
                            _endDate != null
                                ? fmt.format(_endDate!)
                                : 'Select',
                            style: TextStyle(
                              color: _endDate != null
                                  ? null
                                  : scheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                if (_startDate != null && _endDate != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    '${_endDate!.difference(_startDate!).inDays + 1} day(s)',
                    style: TextStyle(
                        color: scheme.primary, fontWeight: FontWeight.w600),
                  ),
                ],
              ],

              const SizedBox(height: 20),

              // ── Reason ─────────────────────────────────────────────
              TextFormField(
                controller: _reasonCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Reason',
                  alignLabelWithHint: true,
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Reason is required' : null,
              ),

              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: applyState.isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                ),
                child: applyState.isLoading
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
