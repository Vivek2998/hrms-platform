import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/models/team_member_model.dart';
import '../providers/team_provider.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/theme/app_theme.dart';

class TeamScreen extends ConsumerStatefulWidget {
  const TeamScreen({super.key});

  @override
  ConsumerState<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends ConsumerState<TeamScreen> {
  final _searchCtrl = TextEditingController();
  String _search = '';
  String? _selectedDept;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(
      teamDirectoryProvider(search: _search.isEmpty ? null : _search),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Team Directory'),
        actions: [
          IconButton(
            tooltip: 'Org Chart',
            icon: const Icon(Icons.account_tree_outlined),
            onPressed: () => context.push('/org-chart'),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(64),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search by name, role, or ID...',
                prefixIcon:
                    const Icon(Icons.search, size: 20),
                suffixIcon: _search.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 18),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() => _search = '');
                        },
                      )
                    : null,
              ),
              onChanged: (v) {
                if (mounted) setState(() => _search = v.trim());
              },
            ),
          ),
        ),
      ),
      body: membersAsync.when(
        data: (members) {
          // Filter by selected department
          final filtered = _selectedDept == null
              ? members
              : members
                  .where((m) => m.department?.name == _selectedDept)
                  .toList();

          // Department chips
          final depts = {for (final m in members) m.department?.name}
              .whereType<String>()
              .toList()
            ..sort();

          if (filtered.isEmpty) {
            return _EmptyState(search: _search);
          }

          return Column(
            children: [
              if (depts.isNotEmpty)
                _DeptFilter(
                  depts: depts,
                  selected: _selectedDept,
                  onSelect: (d) =>
                      setState(() => _selectedDept = d),
                ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) =>
                      _MemberTile(member: filtered[i]),
                ),
              ),
            ],
          );
        },
        loading: () => const ShimmerList(count: 8, itemHeight: 72),
        error: (err, _) => Center(
          child: Text('Failed to load directory\n$err',
              textAlign: TextAlign.center),
        ),
      ),
    );
  }
}

class _DeptFilter extends StatelessWidget {
  final List<String> depts;
  final String? selected;
  final ValueChanged<String?> onSelect;

  const _DeptFilter(
      {required this.depts, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _Chip(label: 'All', selected: selected == null,
              onTap: () => onSelect(null)),
          ...depts.map((d) => _Chip(
                label: d,
                selected: selected == d,
                onTap: () => onSelect(selected == d ? null : d),
              )),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Chip(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.primaryLight,
        checkmarkColor: AppColors.primary,
        labelStyle: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 12,
          color: selected
              ? AppColors.primary
              : Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        side: BorderSide(
          color: selected ? AppColors.primary : const Color(0xFFE2E8F0),
        ),
        backgroundColor: Colors.white,
      ),
    );
  }
}

class _MemberTile extends StatelessWidget {
  final TeamMember member;
  const _MemberTile({required this.member});

  @override
  Widget build(BuildContext context) {
    final initials =
        '${member.firstName[0]}${member.lastName.isNotEmpty ? member.lastName[0] : ''}'
            .toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          radius: 24,
          backgroundColor: AppColors.primaryLight,
          backgroundImage:
              member.avatarUrl != null ? NetworkImage(member.avatarUrl!) : null,
          child: member.avatarUrl == null
              ? Text(
                  initials,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                )
              : null,
        ),
        title: Text(
          member.fullName,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (member.designation != null)
              Text(
                member.designation!,
                style: TextStyle(
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            if (member.department != null)
              Text(
                member.department!.name,
                style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600),
              ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (member.phone != null)
              IconButton(
                icon: const Icon(Icons.phone_outlined,
                    size: 20, color: AppColors.success),
                onPressed: () => launchUrl(Uri.parse('tel:${member.phone}')),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.email_outlined,
                  size: 20, color: AppColors.primary),
              onPressed: () =>
                  launchUrl(Uri.parse('mailto:${member.workEmail}')),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
          ],
        ),
        isThreeLine: member.department != null,
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String search;
  const _EmptyState({required this.search});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.people_outline, size: 64,
              color: Theme.of(context).colorScheme.outlineVariant),
          const SizedBox(height: 16),
          Text(
            search.isEmpty ? 'No employees found' : 'No results for "$search"',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            'Try a different name or department',
            style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
