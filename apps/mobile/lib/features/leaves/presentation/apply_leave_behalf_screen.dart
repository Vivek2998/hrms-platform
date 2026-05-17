import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/leave_provider.dart';
import '../data/models/leave_model.dart';
import '../../team/data/models/team_member_model.dart';
import '../../team/providers/team_provider.dart';
import '../../../core/theme/app_theme.dart';

class ApplyLeaveBehalfScreen extends ConsumerStatefulWidget {
  const ApplyLeaveBehalfScreen({super.key});

  @override
  ConsumerState<ApplyLeaveBehalfScreen> createState() =>
      _ApplyLeaveBehalfScreenState();
}

class _ApplyLeaveBehalfScreenState
    extends ConsumerState<ApplyLeaveBehalfScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonCtrl = TextEditingController();
  final _empSearchCtrl = TextEditingController();

  TeamMember? _selectedEmployee;
  ApiLeaveType? _selectedType;
  DateTime? _startDate;
  DateTime? _endDate;
  String _session = 'FIRST_HALF';
  bool _showEmpSearch = false;

  bool get _isHalfDay => _selectedType?.isHalfDay ?? false;

  int get _daysCount {
    if (_startDate == null || _endDate == null) return 0;
    return _endDate!.difference(_startDate!).inDays + 1;
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    _empSearchCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isStart) async {
    final now = DateTime.now();
    final initial =
        isStart ? (_startDate ?? now) : (_endDate ?? _startDate ?? now);
    final first = isStart
        ? now.subtract(const Duration(days: 365))
        : (_startDate ?? now.subtract(const Duration(days: 365)));
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
    if (_selectedEmployee == null) {
      _showSnack('Please select an employee');
      return;
    }
    if (_selectedType == null) {
      _showSnack('Please select a leave type');
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    if (_startDate == null || _endDate == null) {
      _showSnack('Please select leave date(s)');
      return;
    }

    await ref.read(applyLeaveBehalfNotifierProvider.notifier).apply(
          employeeId: _selectedEmployee!.id,
          leaveTypeId: _selectedType!.id,
          startDate: _startDate!,
          endDate: _endDate!,
          reason: _reasonCtrl.text.trim(),
          session: _isHalfDay ? _session : null,
        );

    if (!mounted) return;
    final state = ref.read(applyLeaveBehalfNotifierProvider);
    if (state.hasError) {
      _showSnack(state.error?.toString() ?? 'Failed to submit', isError: true);
    } else {
      _showSnack('Leave applied successfully for ${_selectedEmployee!.fullName}');
      context.pop();
    }
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? AppColors.error : AppColors.success,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final leaveTypesAsync = ref.watch(leaveTypesProvider);
    final applyState = ref.watch(applyLeaveBehalfNotifierProvider);
    final fmt = DateFormat('EEE, d MMM');

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Employee Selector ────────────────────────────────
                    _sectionLabel('Select Employee'),
                    const SizedBox(height: 12),
                    _EmployeeSelector(
                      selected: _selectedEmployee,
                      searchCtrl: _empSearchCtrl,
                      showSearch: _showEmpSearch,
                      onToggleSearch: () =>
                          setState(() => _showEmpSearch = !_showEmpSearch),
                      onSelect: (emp) => setState(() {
                        _selectedEmployee = emp;
                        _showEmpSearch = false;
                        _empSearchCtrl.clear();
                      }),
                    ),

                    const SizedBox(height: 24),

                    // ── Leave Type ────────────────────────────────────────
                    _sectionLabel('Leave Type'),
                    const SizedBox(height: 12),
                    leaveTypesAsync.when(
                      data: (types) => _LeaveTypeGrid(
                        types: types,
                        selected: _selectedType,
                        onSelect: (t) => setState(() {
                          _selectedType = t;
                          if (t.isHalfDay && _startDate != null) {
                            _endDate = _startDate;
                          }
                        }),
                      ),
                      loading: () => const Center(
                          child: CircularProgressIndicator()),
                      error: (_, __) => const Text('Could not load leave types'),
                    ),

                    // ── Session (half-day only) ───────────────────────────
                    if (_isHalfDay) ...[
                      const SizedBox(height: 24),
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

                    const SizedBox(height: 24),

                    // ── Date ─────────────────────────────────────────────
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
                            padding: const EdgeInsets.symmetric(horizontal: 10),
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

                    if (_startDate != null && _endDate != null &&
                        !_isHalfDay) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '$_daysCount day${_daysCount != 1 ? "s" : ""} selected',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),

                    // ── Reason ────────────────────────────────────────────
                    _sectionLabel('Reason'),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _reasonCtrl,
                      maxLines: 3,
                      maxLength: 500,
                      decoration: InputDecoration(
                        hintText: 'Reason for applying leave on behalf…',
                        hintStyle: TextStyle(color: Colors.grey[400]),
                        filled: true,
                        fillColor: Colors.white,
                        counterText: '',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: Colors.grey[200]!),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: Colors.grey[200]!),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                              color: AppColors.primary, width: 1.5),
                        ),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Reason is required'
                          : null,
                    ),

                    const SizedBox(height: 32),

                    // ── Submit ────────────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: applyState.isLoading ? null : _submit,
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
                                    strokeWidth: 2.5, color: Colors.white),
                              )
                            : const Text(
                                'Apply Leave on Behalf',
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.w700),
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

  Widget _buildHeader() {
    final top = MediaQuery.paddingOf(context).top;
    return Container(
      decoration: const BoxDecoration(gradient: AppColors.brandGradient),
      padding: EdgeInsets.fromLTRB(4, top + 8, 20, 24),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: Colors.white, size: 20),
            onPressed: () => context.pop(),
          ),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Apply Leave on Behalf',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  'Apply leave for a team member',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

Widget _sectionLabel(String text) => Text(
      text,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        color: Color(0xFF1E293B),
      ),
    );

// ─── Employee Selector ────────────────────────────────────────────────────────

class _EmployeeSelector extends ConsumerWidget {
  final TeamMember? selected;
  final TextEditingController searchCtrl;
  final bool showSearch;
  final VoidCallback onToggleSearch;
  final ValueChanged<TeamMember> onSelect;

  const _EmployeeSelector({
    required this.selected,
    required this.searchCtrl,
    required this.showSearch,
    required this.onToggleSearch,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membersAsync =
        ref.watch(teamDirectoryProvider(search: null));

    if (selected != null && !showSearch) {
      return GestureDetector(
        onTap: onToggleSearch,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.primary, width: 1.5),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.primary.withAlpha(30),
                backgroundImage: selected!.avatarUrl != null
                    ? NetworkImage(selected!.avatarUrl!)
                    : null,
                child: selected!.avatarUrl == null
                    ? Text(
                        '${selected!.firstName[0]}${selected!.lastName.isNotEmpty ? selected!.lastName[0] : ''}',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      selected!.fullName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    if (selected!.designation != null)
                      Text(
                        selected!.designation!,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.primaryDark),
                      ),
                  ],
                ),
              ),
              const Icon(Icons.edit_outlined,
                  size: 16, color: AppColors.primary),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
        TextField(
          controller: searchCtrl,
          autofocus: showSearch,
          decoration: InputDecoration(
            hintText: 'Search employee by name…',
            prefixIcon: const Icon(Icons.search, size: 20),
            suffixIcon: searchCtrl.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => searchCtrl.clear(),
                  )
                : null,
          ),
          onChanged: (_) {},
        ),
        const SizedBox(height: 8),
        membersAsync.when(
          data: (members) {
            final q = searchCtrl.text.trim().toLowerCase();
            final filtered = q.isEmpty
                ? members
                : members
                    .where((m) =>
                        m.fullName.toLowerCase().contains(q) ||
                        (m.designation ?? '').toLowerCase().contains(q))
                    .toList();
            return Container(
              constraints: const BoxConstraints(maxHeight: 240),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: filtered.length,
                separatorBuilder: (_, __) =>
                    const Divider(height: 1, indent: 56),
                itemBuilder: (_, i) {
                  final m = filtered[i];
                  return ListTile(
                    dense: true,
                    leading: CircleAvatar(
                      radius: 18,
                      backgroundColor: AppColors.primaryLight,
                      backgroundImage: m.avatarUrl != null
                          ? NetworkImage(m.avatarUrl!)
                          : null,
                      child: m.avatarUrl == null
                          ? Text(
                              '${m.firstName[0]}${m.lastName.isNotEmpty ? m.lastName[0] : ''}',
                              style: const TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700),
                            )
                          : null,
                    ),
                    title: Text(m.fullName,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13)),
                    subtitle: m.designation != null
                        ? Text(m.designation!,
                            style: const TextStyle(fontSize: 11))
                        : null,
                    onTap: () => onSelect(m),
                  );
                },
              ),
            );
          },
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, __) => const Text('Failed to load employees'),
        ),
      ],
    );
  }
}

// ─── Leave Type Grid ──────────────────────────────────────────────────────────

class _LeaveTypeGrid extends StatelessWidget {
  final List<ApiLeaveType> types;
  final ApiLeaveType? selected;
  final ValueChanged<ApiLeaveType> onSelect;

  const _LeaveTypeGrid(
      {required this.types, required this.selected, required this.onSelect});

  Color _color(String name) {
    final n = name.toLowerCase();
    if (n.contains('casual')) return AppColors.info;
    if (n.contains('earned') || n.contains('annual')) return AppColors.success;
    if (n.contains('sick') || n.contains('medical')) return AppColors.error;
    if (n.contains('comp')) return AppColors.warning;
    return AppColors.primary;
  }

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: types.map((t) {
        final isSelected = selected?.id == t.id;
        final color = _color(t.name);
        return GestureDetector(
          onTap: () => onSelect(t),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected ? color : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isSelected ? color : Colors.grey[300]!,
                width: isSelected ? 1.5 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: color.withAlpha(50),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                    ]
                  : [],
            ),
            child: Text(
              t.name,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : const Color(0xFF1E293B),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ─── Session Tile ─────────────────────────────────────────────────────────────

class _SessionTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _SessionTile(
      {required this.label,
      required this.icon,
      required this.selected,
      required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryLight : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : Colors.grey[200]!,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon,
                  size: 22,
                  color: selected ? AppColors.primary : Colors.grey[400]),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
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
  const _DateCard(
      {required this.label, this.date, required this.fmt, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final hasDate = date != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: hasDate ? AppColors.primaryLight : Colors.white,
          borderRadius: BorderRadius.circular(12),
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
                color: hasDate ? AppColors.primary : Colors.grey[500],
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.calendar_month_rounded,
                    size: 14,
                    color: hasDate ? AppColors.primary : Colors.grey[400]),
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
