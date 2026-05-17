import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/shimmer_box.dart';

// ─── Model ───────────────────────────────────────────────────────────────────

class OrgEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;
  final String? avatarUrl;
  final String? managerId;
  final String? departmentName;
  List<OrgEmployee> children = [];

  OrgEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.designation,
    this.avatarUrl,
    this.managerId,
    this.departmentName,
  });

  String get fullName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
          .toUpperCase();

  factory OrgEmployee.fromJson(Map<String, dynamic> json) => OrgEmployee(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        designation: json['designation'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        managerId: json['managerId'] as String?,
        departmentName: json['department'] != null
            ? (json['department'] as Map<String, dynamic>)['name'] as String?
            : null,
      );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

final orgChartProvider = FutureProvider<List<OrgEmployee>>((ref) async {
  final dio = ref.read(dioClientProvider);
  final res = await dio.get('/employees/org-chart');
  final flat = (res.data['data'] as List)
      .map((e) => OrgEmployee.fromJson(e as Map<String, dynamic>))
      .toList();
  return _buildTree(flat);
});

List<OrgEmployee> _buildTree(List<OrgEmployee> flat) {
  final map = <String, OrgEmployee>{for (final e in flat) e.id: e};
  final roots = <OrgEmployee>[];
  for (final e in flat) {
    if (e.managerId == null || !map.containsKey(e.managerId)) {
      roots.add(e);
    } else {
      map[e.managerId]!.children.add(e);
    }
  }
  return roots;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

class OrgChartScreen extends ConsumerStatefulWidget {
  const OrgChartScreen({super.key});

  @override
  ConsumerState<OrgChartScreen> createState() => _OrgChartScreenState();
}

class _OrgChartScreenState extends ConsumerState<OrgChartScreen> {
  final _searchCtrl = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chartAsync = ref.watch(orgChartProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Org Chart'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search by name or designation…',
                prefixIcon: const Icon(Icons.search, size: 20),
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
              onChanged: (v) => setState(() => _search = v.trim().toLowerCase()),
            ),
          ),
        ),
      ),
      body: chartAsync.when(
        data: (roots) {
          if (_search.isNotEmpty) {
            return _FlatSearchView(search: _search, roots: roots);
          }
          if (roots.isEmpty) {
            return const Center(child: Text('No employees found'));
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            itemCount: roots.length,
            itemBuilder: (_, i) => _OrgNode(node: roots[i], depth: 0),
          );
        },
        loading: () => const ShimmerList(count: 6, itemHeight: 72),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              Text('Failed to load org chart\n$e', textAlign: TextAlign.center),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => ref.invalidate(orgChartProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Flat Search View ─────────────────────────────────────────────────────────

class _FlatSearchView extends StatelessWidget {
  final String search;
  final List<OrgEmployee> roots;

  const _FlatSearchView({required this.search, required this.roots});

  List<OrgEmployee> _flatAll(List<OrgEmployee> nodes) {
    final result = <OrgEmployee>[];
    for (final n in nodes) {
      result.add(n);
      result.addAll(_flatAll(n.children));
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final all = _flatAll(roots).where((e) {
      final name = e.fullName.toLowerCase();
      final desig = (e.designation ?? '').toLowerCase();
      return name.contains(search) || desig.contains(search);
    }).toList();

    if (all.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_off, size: 48,
                color: Theme.of(context).colorScheme.outlineVariant),
            const SizedBox(height: 12),
            Text('No results for "$search"',
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
      itemCount: all.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) => _EmployeeCard(emp: all[i], showDept: true),
    );
  }
}

// ─── Org Node (recursive expandable tree) ────────────────────────────────────

class _OrgNode extends StatefulWidget {
  final OrgEmployee node;
  final int depth;

  const _OrgNode({required this.node, required this.depth});

  @override
  State<_OrgNode> createState() => _OrgNodeState();
}

class _OrgNodeState extends State<_OrgNode> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final hasChildren = widget.node.children.isNotEmpty;
    final indent = widget.depth * 20.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(left: indent),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (widget.depth > 0)
                Padding(
                  padding: const EdgeInsets.only(top: 20, right: 4),
                  child: CustomPaint(
                    size: const Size(16, 1),
                    painter: _ConnectorPainter(),
                  ),
                ),
              Expanded(
                child: _EmployeeCard(
                  emp: widget.node,
                  showDept: widget.depth == 0,
                  trailing: hasChildren
                      ? GestureDetector(
                          onTap: () => setState(() => _expanded = !_expanded),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              shape: BoxShape.circle,
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _expanded
                                      ? Icons.keyboard_arrow_up_rounded
                                      : Icons.keyboard_arrow_down_rounded,
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                                Text(
                                  '${widget.node.children.length}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const SizedBox(width: 2),
                              ],
                            ),
                          ),
                        )
                      : null,
                ),
              ),
            ],
          ),
        ),
        if (hasChildren && _expanded)
          ...widget.node.children.map(
            (child) => _OrgNode(node: child, depth: widget.depth + 1),
          ),
      ],
    );
  }
}

class _ConnectorPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFCBD5E1)
      ..strokeWidth = 1.5;
    canvas.drawLine(Offset.zero, Offset(size.width, 0), paint);
  }

  @override
  bool shouldRepaint(_) => false;
}

// ─── Employee Card ─────────────────────────────────────────────────────────────

class _EmployeeCard extends StatelessWidget {
  final OrgEmployee emp;
  final bool showDept;
  final Widget? trailing;

  const _EmployeeCard({
    required this.emp,
    this.showDept = false,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: scheme.brightness == Brightness.dark
            ? scheme.surfaceContainer
            : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(4),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: AppColors.primaryLight,
            backgroundImage: emp.avatarUrl != null
                ? NetworkImage(emp.avatarUrl!)
                : null,
            child: emp.avatarUrl == null
                ? Text(
                    emp.initials,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
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
                  emp.fullName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (emp.designation != null)
                  Text(
                    emp.designation!,
                    style: TextStyle(
                      fontSize: 11,
                      color: scheme.onSurfaceVariant,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                if (showDept && emp.departmentName != null)
                  Text(
                    emp.departmentName!,
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: 8),
            trailing!,
          ],
        ],
      ),
    );
  }
}
