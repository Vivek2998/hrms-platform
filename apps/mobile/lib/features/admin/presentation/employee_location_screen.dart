import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/admin_repository.dart';

class EmployeeLocationScreen extends ConsumerStatefulWidget {
  const EmployeeLocationScreen({super.key});

  @override
  ConsumerState<EmployeeLocationScreen> createState() =>
      _EmployeeLocationScreenState();
}

class _EmployeeLocationScreenState
    extends ConsumerState<EmployeeLocationScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final employeesAsync = ref.watch(employeeListProvider);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Employee Locations')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search employees...',
                prefixIcon: const Icon(Icons.search, size: 20),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              onChanged: (v) => setState(() => _search = v.trim().toLowerCase()),
            ),
          ),
          Expanded(
            child: employeesAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error_outline,
                        size: 48, color: scheme.error),
                    const SizedBox(height: 12),
                    Text('Failed to load employees',
                        style: TextStyle(color: scheme.error)),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () =>
                          ref.invalidate(employeeListProvider),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
              data: (employees) {
                final filtered = _search.isEmpty
                    ? employees
                    : employees
                        .where((e) =>
                            '${e.firstName} ${e.lastName}'
                                .toLowerCase()
                                .contains(_search) ||
                            e.employeeCode
                                .toLowerCase()
                                .contains(_search))
                        .toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Text(
                      'No employees found',
                      style: TextStyle(color: scheme.onSurfaceVariant),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async =>
                      ref.invalidate(employeeListProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) =>
                        const Divider(height: 1, indent: 72),
                    itemBuilder: (context, i) =>
                        _EmployeeTile(employee: filtered[i]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _EmployeeTile extends ConsumerWidget {
  final EmployeeWithLocation employee;
  const _EmployeeTile({required this.employee});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final initials =
        '${employee.firstName[0]}${employee.lastName[0]}'.toUpperCase();
    final locationName =
        employee.officeLocation?.name ?? 'No location assigned';
    final hasLocation = employee.officeLocation != null;

    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: CircleAvatar(
        radius: 22,
        backgroundColor: scheme.primaryContainer,
        child: Text(
          initials,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: scheme.onPrimaryContainer,
          ),
        ),
      ),
      title: Text(
        '${employee.firstName} ${employee.lastName}',
        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
      ),
      subtitle: Row(
        children: [
          Icon(
            Icons.location_on_outlined,
            size: 13,
            color: hasLocation ? scheme.primary : scheme.onSurfaceVariant,
          ),
          const SizedBox(width: 3),
          Expanded(
            child: Text(
              locationName,
              style: TextStyle(
                fontSize: 12,
                color: hasLocation
                    ? scheme.primary
                    : scheme.onSurfaceVariant,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      trailing: Icon(Icons.chevron_right,
          color: scheme.onSurfaceVariant, size: 20),
      onTap: () => _showAssignSheet(context, ref),
    );
  }

  void _showAssignSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _AssignLocationSheet(
        employee: employee,
        onAssigned: () => ref.invalidate(employeeListProvider),
      ),
    );
  }
}

class _AssignLocationSheet extends ConsumerStatefulWidget {
  final EmployeeWithLocation employee;
  final VoidCallback onAssigned;

  const _AssignLocationSheet({
    required this.employee,
    required this.onAssigned,
  });

  @override
  ConsumerState<_AssignLocationSheet> createState() =>
      _AssignLocationSheetState();
}

class _AssignLocationSheetState extends ConsumerState<_AssignLocationSheet> {
  bool _saving = false;

  Future<void> _assign(String? locationId) async {
    setState(() => _saving = true);
    try {
      await ref
          .read(adminRepositoryProvider)
          .assignLocation(widget.employee.id, locationId);
      widget.onAssigned();
      if (mounted) Navigator.of(context).pop();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(locationId == null
                ? 'Location removed for ${widget.employee.firstName}'
                : 'Location assigned successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to update location')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationsAsync = ref.watch(officeLocationsAdminProvider);
    final scheme = Theme.of(context).colorScheme;
    final currentId = widget.employee.officeLocationId;

    return DraggableScrollableSheet(
      initialChildSize: 0.55,
      minChildSize: 0.4,
      maxChildSize: 0.9,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: scheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Assign Office Location',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${widget.employee.firstName} ${widget.employee.lastName}',
                    style: TextStyle(
                        fontSize: 13, color: scheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: _saving
                  ? const Center(child: CircularProgressIndicator())
                  : locationsAsync.when(
                      loading: () =>
                          const Center(child: CircularProgressIndicator()),
                      error: (_, __) => Center(
                        child: Text('Failed to load locations',
                            style: TextStyle(color: scheme.error)),
                      ),
                      data: (locations) => ListView(
                        controller: scrollController,
                        children: [
                          // "No location" option
                          _LocationOption(
                            icon: Icons.location_off_outlined,
                            name: 'No location',
                            subtitle: 'Remove current assignment',
                            isSelected: currentId == null,
                            onTap: currentId == null
                                ? null
                                : () => _assign(null),
                          ),
                          const Divider(height: 1, indent: 56),
                          ...locations.map(
                            (loc) => _LocationOption(
                              icon: Icons.location_on_outlined,
                              name: loc.name,
                              subtitle: '${loc.radiusMeters} m radius',
                              isSelected: currentId == loc.id,
                              onTap: currentId == loc.id
                                  ? null
                                  : () => _assign(loc.id),
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }
}

class _LocationOption extends StatelessWidget {
  final IconData icon;
  final String name;
  final String subtitle;
  final bool isSelected;
  final VoidCallback? onTap;

  const _LocationOption({
    required this.icon,
    required this.name,
    required this.subtitle,
    required this.isSelected,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? scheme.primary : scheme.onSurfaceVariant,
      ),
      title: Text(
        name,
        style: TextStyle(
          fontSize: 14,
          fontWeight:
              isSelected ? FontWeight.w600 : FontWeight.normal,
          color: isSelected ? scheme.primary : null,
        ),
      ),
      subtitle: Text(subtitle,
          style:
              TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
      trailing: isSelected
          ? Icon(Icons.check_circle, color: scheme.primary, size: 20)
          : null,
      onTap: onTap,
    );
  }
}
