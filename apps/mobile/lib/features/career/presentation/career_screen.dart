import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/career_provider.dart';
import '../data/models/career_model.dart';

class CareerScreen extends ConsumerStatefulWidget {
  const CareerScreen({super.key});

  @override
  ConsumerState<CareerScreen> createState() => _CareerScreenState();
}

class _CareerScreenState extends ConsumerState<CareerScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Career Paths'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: TabBar(
          controller: _tab,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          tabs: const [Tab(text: 'Career Map'), Tab(text: 'Designations')],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: const [_CareerMapTab(), _DesignationsTab()],
      ),
    );
  }
}

class _CareerMapTab extends ConsumerWidget {
  const _CareerMapTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(careerPathsProvider);
    return async.when(
      loading: () =>
          const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: TextButton(
            onPressed: () => ref.invalidate(careerPathsProvider),
            child: const Text('Retry')),
      ),
      data: (paths) => paths.isEmpty
          ? const Center(
              child: Text('No career paths defined.',
                  style: TextStyle(color: Colors.grey)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: paths.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: 10),
              itemBuilder: (_, i) => _PathCard(path: paths[i]),
            ),
    );
  }
}

class _PathCard extends StatelessWidget {
  final CareerPath path;
  const _PathCard({required this.path});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(path.fromDesignation?.name ?? '—',
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 13)),
                  Text('L${path.fromDesignation?.level}',
                      style: const TextStyle(
                          fontSize: 11, color: Colors.grey)),
                ],
              ),
            ),
            Column(
              children: [
                const Icon(Icons.arrow_forward,
                    size: 18, color: Colors.grey),
                if (path.typicalYears != null)
                  Text('~${path.typicalYears}y',
                      style: const TextStyle(
                          fontSize: 9, color: Colors.grey)),
              ],
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(path.toDesignation?.name ?? '—',
                      textAlign: TextAlign.end,
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 13)),
                  Text('L${path.toDesignation?.level}',
                      style: const TextStyle(
                          fontSize: 11, color: Colors.grey)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DesignationsTab extends ConsumerWidget {
  const _DesignationsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(designationsProvider);
    return async.when(
      loading: () =>
          const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: TextButton(
            onPressed: () => ref.invalidate(designationsProvider),
            child: const Text('Retry')),
      ),
      data: (designations) => designations.isEmpty
          ? const Center(
              child: Text('No designations defined.',
                  style: TextStyle(color: Colors.grey)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: designations.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: 8),
              itemBuilder: (_, i) =>
                  _DesignationTile(d: designations[i]),
            ),
    );
  }
}

class _DesignationTile extends StatelessWidget {
  final Designation d;
  const _DesignationTile({required this.d});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ListTile(
        leading: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text('L${d.level}',
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary)),
          ),
        ),
        title: Text(d.name,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: d.department != null
            ? Text(d.department!,
                style: const TextStyle(fontSize: 12))
            : null,
        trailing: d.skills.isNotEmpty
            ? Text('${d.skills.length} skills',
                style: const TextStyle(
                    fontSize: 11, color: Colors.grey))
            : null,
      ),
    );
  }
}
