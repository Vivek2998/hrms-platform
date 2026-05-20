import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/headcount_provider.dart';
import '../data/models/headcount_model.dart';

class HeadcountScreen extends ConsumerStatefulWidget {
  const HeadcountScreen({super.key});

  @override
  ConsumerState<HeadcountScreen> createState() => _HeadcountScreenState();
}

class _HeadcountScreenState extends ConsumerState<HeadcountScreen>
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
        title: const Text('Headcount Planning'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        bottom: TabBar(
          controller: _tab,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Plans'),
            Tab(text: 'Open Positions'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: const [
          _PlansTab(),
          _PositionsTab(),
        ],
      ),
    );
  }
}

class _PlansTab extends ConsumerWidget {
  const _PlansTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(headcountPlansProvider);
    return async.when(
      loading: () =>
          const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: TextButton(
            onPressed: () => ref.invalidate(headcountPlansProvider),
            child: const Text('Retry')),
      ),
      data: (plans) => plans.isEmpty
          ? const Center(
              child: Text('No plans yet.',
                  style: TextStyle(color: Colors.grey)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: plans.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _PlanCard(plan: plans[i]),
            ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final HeadcountPlan plan;
  const _PlanCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0', 'en_IN');
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        title: Text('${plan.quarter} ${plan.year}',
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          'Headcount: ${plan.plannedHeadcount}'
          '${plan.budget != null ? ' · Budget: ₹${fmt.format(plan.budget!)}' : ''}'
          '${plan.notes != null ? '\n${plan.notes}' : ''}',
        ),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Center(
            child: Text(plan.quarter,
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary)),
          ),
        ),
      ),
    );
  }
}

class _PositionsTab extends ConsumerWidget {
  const _PositionsTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(openPositionsProvider);
    return async.when(
      loading: () =>
          const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: TextButton(
            onPressed: () => ref.invalidate(openPositionsProvider),
            child: const Text('Retry')),
      ),
      data: (positions) => positions.isEmpty
          ? const Center(
              child: Text('No open positions.',
                  style: TextStyle(color: Colors.grey)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: positions.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: 10),
              itemBuilder: (_, i) =>
                  _PositionCard(position: positions[i]),
            ),
    );
  }
}

const _posStatusColors = {
  'OPEN': Color(0xFF3B82F6),
  'IN_PROGRESS': Color(0xFFF59E0B),
  'FILLED': Color(0xFF10B981),
  'ON_HOLD': Color(0xFF9CA3AF),
};

class _PositionCard extends StatelessWidget {
  final OpenPosition position;
  const _PositionCard({required this.position});

  @override
  Widget build(BuildContext context) {
    final color = _posStatusColors[position.status] ??
        const Color(0xFF9CA3AF);
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        title: Text(position.title,
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text([
          if (position.location != null) position.location!,
          if (position.type != null)
            position.type!.replaceAll('_', ' '),
        ].join(' · ')),
        trailing: Container(
          padding: const EdgeInsets.symmetric(
              horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color.withAlpha(80)),
          ),
          child: Text(position.status,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: color)),
        ),
        leading: const CircleAvatar(
          backgroundColor: AppColors.primaryLight,
          child: Icon(Icons.work_outline,
              color: AppColors.primary, size: 20),
        ),
      ),
    );
  }
}
