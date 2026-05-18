import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/performance_provider.dart';
import '../data/models/performance_model.dart';
import 'goals_tab.dart';
import 'reviews_tab.dart';
import 'peer_feedback_tab.dart';

class PerformanceScreen extends ConsumerStatefulWidget {
  const PerformanceScreen({super.key});

  @override
  ConsumerState<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends ConsumerState<PerformanceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  PerformanceCycle? _selectedCycle;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cyclesAsync = ref.watch(performanceCyclesProvider);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Performance'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Goals'),
            Tab(text: 'Reviews'),
            Tab(text: 'Peer Feedback'),
          ],
        ),
      ),
      body: cyclesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to load cycles: $e')),
        data: (cycles) {
          if (cycles.isEmpty) {
            return _EmptyState(
              icon: Icons.track_changes_outlined,
              message: 'No performance cycles yet.\nContact your HR to get started.',
            );
          }

          _selectedCycle ??= cycles.firstWhere(
            (c) => c.status == 'ACTIVE',
            orElse: () => cycles.first,
          );

          return Column(
            children: [
              // Cycle picker
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: _CycleDropdown(
                  cycles: cycles,
                  selected: _selectedCycle!,
                  onChanged: (c) => setState(() => _selectedCycle = c),
                  scheme: scheme,
                ),
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    GoalsTab(cycle: _selectedCycle!),
                    ReviewsTab(cycle: _selectedCycle!),
                    PeerFeedbackTab(cycle: _selectedCycle!),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CycleDropdown extends StatelessWidget {
  final List<PerformanceCycle> cycles;
  final PerformanceCycle selected;
  final ValueChanged<PerformanceCycle> onChanged;
  final ColorScheme scheme;

  const _CycleDropdown({
    required this.cycles,
    required this.selected,
    required this.onChanged,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      decoration: BoxDecoration(
        border: Border.all(color: scheme.outline.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(10),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<PerformanceCycle>(
          isExpanded: true,
          value: selected,
          items: cycles
              .map((c) => DropdownMenuItem(
                    value: c,
                    child: Row(
                      children: [
                        Expanded(child: Text(c.name, overflow: TextOverflow.ellipsis)),
                        const SizedBox(width: 8),
                        _StatusBadge(status: c.status),
                      ],
                    ),
                  ))
              .toList(),
          onChanged: (c) {
            if (c != null) onChanged(c);
          },
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      'ACTIVE' => (Colors.green, 'Active'),
      'CLOSED' => (Colors.grey, 'Closed'),
      _ => (Colors.orange, 'Draft'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  const _EmptyState({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 56, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
        ],
      ),
    );
  }
}
