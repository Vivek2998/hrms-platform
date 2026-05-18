import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/performance_model.dart';
import '../providers/performance_provider.dart';

class GoalsTab extends ConsumerWidget {
  final PerformanceCycle cycle;
  const GoalsTab({super.key, required this.cycle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalsAsync = ref.watch(performanceGoalsProvider(cycle.id));

    return goalsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (goals) => RefreshIndicator(
        onRefresh: () => ref.refresh(performanceGoalsProvider(cycle.id).future),
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: goals.length + 1,
          itemBuilder: (ctx, i) {
            if (i == goals.length) {
              return _AddGoalButton(cycle: cycle);
            }
            return _GoalCard(goal: goals[i]);
          },
        ),
      ),
    );
  }
}

class _AddGoalButton extends ConsumerWidget {
  final PerformanceCycle cycle;
  const _AddGoalButton({required this.cycle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: OutlinedButton.icon(
        onPressed: () => _showAddDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Add Goal'),
      ),
    );
  }

  Future<void> _showAddDialog(BuildContext context, WidgetRef ref) async {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final targetCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Goal'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'Title *'),
                  validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: descCtrl,
                  decoration: const InputDecoration(labelText: 'Description'),
                  maxLines: 2,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: targetCtrl,
                  decoration: const InputDecoration(labelText: 'Target / KPI'),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (!formKey.currentState!.validate()) return;
              Navigator.pop(ctx);
              await ref.read(goalNotifierProvider.notifier).createGoal(
                    cycleId: cycle.id,
                    title: titleCtrl.text.trim(),
                    description: descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                    targetValue: targetCtrl.text.trim().isEmpty ? null : targetCtrl.text.trim(),
                  );
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

class _GoalCard extends ConsumerWidget {
  final PerformanceGoal goal;

  const _GoalCard({required this.goal});

  static const _statusColors = <String, Color>{
    'NOT_STARTED': Colors.grey,
    'IN_PROGRESS': Colors.blue,
    'ACHIEVED': Colors.green,
    'MISSED': Colors.red,
  };

  static const _statusLabels = <String, String>{
    'NOT_STARTED': 'Not Started',
    'IN_PROGRESS': 'In Progress',
    'ACHIEVED': 'Achieved',
    'MISSED': 'Missed',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final color = _statusColors[goal.status] ?? Colors.grey;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(goal.title,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                ),
                _StatusChip(label: _statusLabels[goal.status] ?? goal.status, color: color),
                const SizedBox(width: 4),
                PopupMenuButton<String>(
                  itemBuilder: (_) => const [
                    PopupMenuItem(value: 'update', child: Text('Update progress')),
                    PopupMenuItem(value: 'delete', child: Text('Delete')),
                  ],
                  onSelected: (v) {
                    if (v == 'update') _showUpdateDialog(context, ref);
                    if (v == 'delete') _confirmDelete(context, ref);
                  },
                ),
              ],
            ),
            if (goal.description != null && goal.description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(goal.description!,
                  style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
            ],
            if (goal.targetValue != null && goal.targetValue!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.flag_outlined, size: 14, color: scheme.primary),
                  const SizedBox(width: 4),
                  Text('Target: ${goal.targetValue}',
                      style: TextStyle(fontSize: 12, color: scheme.primary)),
                ],
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: goal.progress / 100,
                      minHeight: 6,
                      backgroundColor: scheme.surfaceContainerHighest,
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text('${goal.progress}%',
                    style: TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w600, color: color)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showUpdateDialog(BuildContext context, WidgetRef ref) async {
    String selectedStatus = goal.status;
    double progressVal = goal.progress.toDouble();

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: Text(goal.title, style: const TextStyle(fontSize: 15)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Status', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: selectedStatus,
                decoration: const InputDecoration(border: OutlineInputBorder()),
                items: ['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'MISSED']
                    .map((s) => DropdownMenuItem(
                          value: s,
                          child: Text(_statusLabels[s]!),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => selectedStatus = v!),
              ),
              const SizedBox(height: 16),
              Text('Progress: ${progressVal.round()}%',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(
                value: progressVal,
                min: 0,
                max: 100,
                divisions: 20,
                label: '${progressVal.round()}%',
                onChanged: (v) => setState(() => progressVal = v),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await ref.read(goalNotifierProvider.notifier).updateGoal(
                      goal.id,
                      status: selectedStatus,
                      progress: progressVal.round(),
                    );
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Goal?'),
        content: Text('Delete "${goal.title}"? This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(goalNotifierProvider.notifier).deleteGoal(goal.id);
    }
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }
}
