import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';
import '../data/models/leave_model.dart';
import '../../../core/theme/app_theme.dart';
import '../../comp_off/presentation/comp_off_screen.dart';
import '../../comp_off/providers/comp_off_provider.dart';

class ApplyLeaveScreen extends ConsumerStatefulWidget {
  /// Optional leave type id pre-selected (e.g. WFH or On-Duty quick apply).
  final String? preSelectedTypeId;
  const ApplyLeaveScreen({super.key, this.preSelectedTypeId});

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
  bool _didPreSelect = false;

  bool get _isHalfDay => _selectedType?.isHalfDay ?? false;

  int get _daysCount {
    if (_startDate == null || _endDate == null) return 0;
    return _endDate!.difference(_startDate!).inDays + 1;
  }

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
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme:
              Theme.of(ctx).colorScheme.copyWith(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked == null) return;
    setState(() {
      if (isStart) {
        _startDate = picked;
        if (_isHalfDay) {
          _endDate = picked;
        } else if (_endDate != null && _endDate!.isBefore(picked)) {
          _endDate = picked;
        }
      } else {
        _endDate = picked;
      }
    });
  }

  Future<void> _submit() async {
    if (_selectedType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a leave type')),
      );
      return;
    }
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
          backgroundColor: AppColors.error,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Leave request submitted successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final leaveTypesAsync = ref.watch(leaveTypesProvider);
    final balancesAsync = ref.watch(leaveBalancesProvider);
    final compOffAsync = ref.watch(compOffListProvider);
    final applyState = ref.watch(applyLeaveNotifierProvider);
    final fmt = DateFormat('EEE, d MMM');

    final approvedCompOff = compOffAsync.valueOrNull
            ?.where((r) => r.status.toUpperCase() == 'APPROVED')
            .length ??
        0;

    final Map<String, dynamic> balanceMap = {
      for (final b in (balancesAsync.valueOrNull ?? []))
        b.leaveTypeId as String: b,
    };
    final selectedBalance =
        _selectedType != null ? balanceMap[_selectedType!.id] : null;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Column(
        children: [
          _Header(
            selectedBalance: selectedBalance,
            onBack: () => context.pop(),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionLabel('Select Leave Type'),
                    const SizedBox(height: 12),
                    leaveTypesAsync.when(
                      data: (types) {
                        // Auto-select type from query param (WFH/OD quick apply)
                        if (!_didPreSelect &&
                            widget.preSelectedTypeId != null) {
                          final match = types.where(
                              (t) => t.id == widget.preSelectedTypeId).firstOrNull;
                          if (match != null) {
                            WidgetsBinding.instance.addPostFrameCallback((_) {
                              if (mounted) {
                                setState(() {
                                  _selectedType = match;
                                  _didPreSelect = true;
                                });
                              }
                            });
                          }
                        }
                        return _LeaveTypeSelector(
                          types: types,
                          balanceMap: balanceMap,
                          selected: _selectedType,
                          compOffApprovedCount: approvedCompOff,
                          onSelect: (t) => setState(() {
                            _selectedType = t;
                            _didPreSelect = true;
                            if (t.isHalfDay && _startDate != null) {
                              _endDate = _startDate;
                            }
                          }),
                          onCompOffTap: approvedCompOff > 0
                              ? () => showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (_) => const CreateCompOffSheet(),
                                  )
                              : null,
                        );
                      },
                      loading: () => _LeaveTypeSelectorSkeleton(),
                      error: (_, __) => Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Could not load leave types',
                                style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                            const SizedBox(height: 8),
                            OutlinedButton.icon(
                              onPressed: () => ref.invalidate(leaveTypesProvider),
                              icon: const Icon(Icons.refresh_rounded, size: 16),
                              label: const Text('Retry'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                side: const BorderSide(color: AppColors.primary),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10)),
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    if (_isHalfDay) ...[
                      const SizedBox(height: 28),
                      _sectionLabel('Session'),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _SessionTile(
                              label: 'First Half',
                              icon: Icons.wb_sunny_rounded,
                              selected: _session == 'FIRST_HALF',
                              onTap: () =>
                                  setState(() => _session = 'FIRST_HALF'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _SessionTile(
                              label: 'Second Half',
                              icon: Icons.nights_stay_rounded,
                              selected: _session == 'SECOND_HALF',
                              onTap: () =>
                                  setState(() => _session = 'SECOND_HALF'),
                            ),
                          ),
                        ],
                      ),
                    ],

                    const SizedBox(height: 28),
                    _sectionLabel(_isHalfDay ? 'Date' : 'Leave Period'),
                    const SizedBox(height: 12),
                    if (_isHalfDay)
                      _DateCard(
                        label: 'Date',
                        date: _startDate,
                        fmt: fmt,
                        onTap: () => _pickDate(true),
                      )
                    else
                      Row(
                        children: [
                          Expanded(
                            child: _DateCard(
                              label: 'From',
                              date: _startDate,
                              fmt: fmt,
                              onTap: () => _pickDate(true),
                            ),
                          ),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 10),
                            child: Icon(Icons.arrow_forward_rounded,
                                size: 18, color: Colors.grey[400]),
                          ),
                          Expanded(
                            child: _DateCard(
                              label: 'To',
                              date: _endDate,
                              fmt: fmt,
                              onTap: () => _pickDate(false),
                            ),
                          ),
                        ],
                      ),

                    if (_startDate != null && _endDate != null) ...[
                      const SizedBox(height: 14),
                      _DurationSummary(
                        days: _daysCount,
                        isHalfDay: _isHalfDay,
                        remaining: selectedBalance?.remainingDays,
                      ),
                    ],

                    const SizedBox(height: 28),
                    _sectionLabel('Reason for Leave'),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _reasonCtrl,
                      maxLines: 4,
                      maxLength: 500,
                      decoration: InputDecoration(
                        hintText: 'Describe the reason for your leave…',
                        hintStyle: TextStyle(color: Colors.grey[400]),
                        filled: true,
                        fillColor: Colors.white,
                        counterText: '',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide:
                              BorderSide(color: Colors.grey[200]!),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide:
                              BorderSide(color: Colors.grey[200]!),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 1.5),
                        ),
                      ),
                      validator: (v) =>
                          v == null || v.trim().isEmpty
                              ? 'Reason is required'
                              : null,
                    ),

                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed:
                            (_selectedType == null || applyState.isLoading)
                                ? null
                                : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor:
                              AppColors.primary.withAlpha(80),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: applyState.isLoading
                            ? const SizedBox(
                                height: 22,
                                width: 22,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2.5,
                                    color: Colors.white),
                              )
                            : const Text(
                                'Submit Leave Request',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Header ───────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final dynamic selectedBalance;
  final VoidCallback onBack;
  const _Header({required this.selectedBalance, required this.onBack});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.brandGradient),
      padding: EdgeInsets.fromLTRB(4, top + 8, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: Colors.white, size: 20),
                onPressed: onBack,
              ),
              const Expanded(
                child: Text(
                  'Apply for Leave',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: selectedBalance != null
                ? Row(
                    children: [
                      _Pill(
                          icon: Icons.event_available_rounded,
                          label:
                              '${(selectedBalance.remainingDays as double).toStringAsFixed(0)} days remaining'),
                      const SizedBox(width: 8),
                      _Pill(
                          icon: Icons.history_rounded,
                          label:
                              '${(selectedBalance.usedDays as double).toStringAsFixed(0)} / ${(selectedBalance.totalDays as double).toStringAsFixed(0)} used'),
                    ],
                  )
                : Text(
                    'Select a leave type to view your balance',
                    style: TextStyle(
                        color: Colors.white.withAlpha(180), fontSize: 13),
                  ),
          ),
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Pill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.white.withAlpha(30),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withAlpha(60)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: Colors.white),
            const SizedBox(width: 5),
            Text(label,
                style: const TextStyle(
                    fontSize: 12,
                    color: Colors.white,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      );
}

// ─── Section Label ─────────────────────────────────────────────────────────────

Widget _sectionLabel(String text) => Text(
      text,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: Color(0xFF1E293B),
        letterSpacing: 0.1,
      ),
    );

// ─── Leave Type Colors & Icons ────────────────────────────────────────────────

Color _leaveColor(String name) {
  final n = name.toLowerCase();
  if (n.contains('casual') || n.contains('cl')) return AppColors.info;
  if (n.contains('earned') || n.contains('annual') || n.contains('el') || n.contains('al')) return AppColors.success;
  if (n.contains('sick') || n.contains('sl') || n.contains('medical')) return AppColors.error;
  if (n.contains('maternity') || n.contains('paternity') || n.contains('parental')) return AppColors.holiday;
  if (n.contains('comp') || n.contains('co')) return AppColors.warning;
  if (n.contains('without pay') || n.contains('lwp') || n.contains('unpaid')) return const Color(0xFF64748B);
  return AppColors.primary;
}

IconData _leaveIcon(String name) {
  final n = name.toLowerCase();
  if (n.contains('casual')) return Icons.weekend_rounded;
  if (n.contains('sick') || n.contains('medical')) return Icons.local_hospital_rounded;
  if (n.contains('earned') || n.contains('annual')) return Icons.beach_access_rounded;
  if (n.contains('maternity')) return Icons.child_care_rounded;
  if (n.contains('paternity')) return Icons.family_restroom_rounded;
  if (n.contains('comp')) return Icons.access_time_filled_rounded;
  if (n.contains('without pay') || n.contains('unpaid')) return Icons.money_off_rounded;
  return Icons.event_note_rounded;
}

// ─── Leave Type Selector (horizontal scroll) ──────────────────────────────────

class _LeaveTypeSelector extends StatelessWidget {
  final List<ApiLeaveType> types;
  final Map<String, dynamic> balanceMap;
  final ApiLeaveType? selected;
  final ValueChanged<ApiLeaveType> onSelect;
  final VoidCallback? onCompOffTap;
  final int compOffApprovedCount;

  const _LeaveTypeSelector({
    required this.types,
    required this.balanceMap,
    required this.selected,
    required this.onSelect,
    required this.compOffApprovedCount,
    this.onCompOffTap,
  });

  @override
  Widget build(BuildContext context) {
    final totalCount = types.length + 1;
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        mainAxisExtent: 88,
      ),
      itemCount: totalCount,
      itemBuilder: (_, i) {
          if (i == types.length) {
            final hasCompOff = compOffApprovedCount > 0;
            if (!hasCompOff) {
              return Container(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Icon(Icons.access_time_filled_rounded,
                            size: 20, color: Colors.grey[350]),
                        Icon(Icons.lock_outline_rounded,
                            size: 12, color: Colors.grey[350]),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Comp-Off',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[400]),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '0 days earned',
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: Colors.grey[350]),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }
            return GestureDetector(
              onTap: onCompOffTap,
              child: Container(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey[200]!, width: 1),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(8),
                      blurRadius: 6,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Icon(Icons.access_time_filled_rounded,
                        size: 20, color: AppColors.warning),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Comp-Off',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1E293B)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '$compOffApprovedCount day${compOffApprovedCount != 1 ? 's' : ''} earned',
                          style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: AppColors.warning),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }
          final t = types[i];
          final bal = balanceMap[t.id];
          final totalDays = bal?.totalDays as double? ?? 0;
          final isDisabled = bal == null || totalDays == 0;
          final isSelected = !isDisabled && selected?.id == t.id;
          final color = _leaveColor(t.name);
          final icon = _leaveIcon(t.name);
          final remaining = bal?.remainingDays as double?;

          if (isDisabled) {
            return Container(
              width: 130,
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Icon(icon, size: 20, color: Colors.grey[350]),
                      Icon(Icons.lock_outline_rounded,
                          size: 12, color: Colors.grey[350]),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t.name,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[400],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'Not applicable',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[350],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }

          return GestureDetector(
            onTap: () => onSelect(t),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
              decoration: BoxDecoration(
                color: isSelected ? color : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected ? color : Colors.grey[200]!,
                  width: isSelected ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isSelected
                        ? color.withAlpha(60)
                        : Colors.black.withAlpha(8),
                    blurRadius: isSelected ? 10 : 6,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Icon(icon,
                          size: 20,
                          color: isSelected ? Colors.white : color),
                      if (isSelected)
                        Container(
                          padding: const EdgeInsets.all(2),
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.check_rounded,
                              size: 10, color: color),
                        ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        t.name,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : const Color(0xFF1E293B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        remaining != null
                            ? '${remaining.toStringAsFixed(0)} days left'
                            : '—',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: isSelected
                              ? Colors.white.withAlpha(200)
                              : color,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
    );
  }
}

class _LeaveTypeSelectorSkeleton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      childAspectRatio: 1.4,
      children: List.generate(
        6,
        (_) => Container(
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    );
  }
}

// ─── Session Tile ─────────────────────────────────────────────────────────────

class _SessionTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _SessionTile({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryLight : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.primary : Colors.grey[200]!,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon,
                  size: 22,
                  color: selected ? AppColors.primary : Colors.grey[500]),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight:
                      selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? AppColors.primary : Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      );
}

// ─── Date Card ────────────────────────────────────────────────────────────────

class _DateCard extends StatelessWidget {
  final String label;
  final DateTime? date;
  final DateFormat fmt;
  final VoidCallback onTap;
  const _DateCard({
    required this.label,
    this.date,
    required this.fmt,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final hasDate = date != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: hasDate ? AppColors.primaryLight : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasDate ? AppColors.primary : Colors.grey[200]!,
            width: hasDate ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color:
                    hasDate ? AppColors.primary : Colors.grey[500],
                letterSpacing: 0.3,
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Icon(
                  Icons.calendar_month_rounded,
                  size: 14,
                  color:
                      hasDate ? AppColors.primary : Colors.grey[400],
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    hasDate ? fmt.format(date!) : 'Select',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight:
                          hasDate ? FontWeight.w700 : FontWeight.w400,
                      color: hasDate
                          ? AppColors.primaryDark
                          : Colors.grey[400],
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Duration Summary ─────────────────────────────────────────────────────────

class _DurationSummary extends StatelessWidget {
  final int days;
  final bool isHalfDay;
  final double? remaining;
  const _DurationSummary(
      {required this.days, required this.isHalfDay, this.remaining});

  @override
  Widget build(BuildContext context) {
    final effective = isHalfDay ? 0.5 : days.toDouble();
    final overBalance = remaining != null && effective > remaining!;
    final color = overBalance ? AppColors.error : AppColors.success;
    final bgColor =
        overBalance ? AppColors.errorLight : AppColors.successLight;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Row(
        children: [
          Icon(
            overBalance
                ? Icons.warning_amber_rounded
                : Icons.check_circle_rounded,
            color: color,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isHalfDay
                      ? 'Half Day Leave (0.5 day)'
                      : '$days ${days == 1 ? 'Day' : 'Days'} Selected',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: color,
                  ),
                ),
                if (overBalance)
                  Text(
                    'Exceeds balance · ${remaining!.toStringAsFixed(0)} days available',
                    style: TextStyle(fontSize: 12, color: AppColors.error),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
