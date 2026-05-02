import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';

class ApplyLeaveScreen extends ConsumerStatefulWidget {
  const ApplyLeaveScreen({super.key});

  @override
  ConsumerState<ApplyLeaveScreen> createState() => _ApplyLeaveScreenState();
}

class _ApplyLeaveScreenState extends ConsumerState<ApplyLeaveScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonCtrl = TextEditingController();
  String? _selectedLeaveTypeId;
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isStart) async {
    final now = DateTime.now();
    final initial = isStart ? (_startDate ?? now) : (_endDate ?? _startDate ?? now);
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
        if (_endDate != null && _endDate!.isBefore(picked)) {
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
        const SnackBar(content: Text('Select start and end dates')),
      );
      return;
    }
    await ref.read(applyLeaveNotifierProvider.notifier).apply(
          leaveTypeId: _selectedLeaveTypeId!,
          startDate: _startDate!,
          endDate: _endDate!,
          reason: _reasonCtrl.text.trim(),
        );
    if (!mounted) return;
    final state = ref.read(applyLeaveNotifierProvider);
    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error?.toString() ?? 'Failed to apply'),
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
    final balancesAsync = ref.watch(leaveBalancesProvider);
    final applyState = ref.watch(applyLeaveNotifierProvider);
    final isLoading = applyState.isLoading;
    final fmt = DateFormat('d MMM y');

    return Scaffold(
      appBar: AppBar(title: const Text('Apply for Leave')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              balancesAsync.when(
                data: (balances) => DropdownButtonFormField<String>(
                  value: _selectedLeaveTypeId,
                  decoration: const InputDecoration(labelText: 'Leave Type'),
                  items: balances
                      .map((b) => DropdownMenuItem(
                            value: b.leaveTypeId,
                            child: Text(
                              '${b.leaveTypeName} (${b.remainingDays.toStringAsFixed(0)} days left)',
                            ),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _selectedLeaveTypeId = v),
                  validator: (v) =>
                      v == null ? 'Select a leave type' : null,
                ),
                loading: () => const LinearProgressIndicator(),
                error: (_, __) => const Text('Could not load leave types'),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _pickDate(true),
                      borderRadius: BorderRadius.circular(10),
                      child: InputDecorator(
                        decoration:
                            const InputDecoration(labelText: 'Start Date'),
                        child: Text(
                          _startDate != null
                              ? fmt.format(_startDate!)
                              : 'Select',
                          style: TextStyle(
                            color: _startDate != null
                                ? null
                                : Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () => _pickDate(false),
                      borderRadius: BorderRadius.circular(10),
                      child: InputDecorator(
                        decoration:
                            const InputDecoration(labelText: 'End Date'),
                        child: Text(
                          _endDate != null
                              ? fmt.format(_endDate!)
                              : 'Select',
                          style: TextStyle(
                            color: _endDate != null
                                ? null
                                : Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
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
                      color: Theme.of(context).colorScheme.primary,
                      fontWeight: FontWeight.w600),
                ),
              ],
              const SizedBox(height: 16),
              TextFormField(
                controller: _reasonCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Reason',
                  alignLabelWithHint: true,
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Reason is required' : null,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: isLoading ? null : _submit,
                child: isLoading
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
