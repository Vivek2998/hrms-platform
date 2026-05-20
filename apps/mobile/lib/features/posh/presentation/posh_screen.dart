import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/posh_provider.dart';
import '../data/models/posh_model.dart';

class POSHScreen extends ConsumerWidget {
  const POSHScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final casesAsync = ref.watch(poshCasesProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('POSH Cases'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: casesAsync.when(
        loading: () =>
            const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: TextButton(
              onPressed: () => ref.invalidate(poshCasesProvider),
              child: const Text('Retry')),
        ),
        data: (cases) => cases.isEmpty
            ? const _EmptyState()
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: cases.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => _POSHCard(caseItem: cases[i]),
              ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateSheet(context, ref),
        backgroundColor: AppColors.error,
        icon: const Icon(Icons.shield_outlined),
        label: const Text('File Case'),
      ),
    );
  }

  void _showCreateSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _CreateCaseSheet(ref: ref),
    );
  }
}

const _statusColors = {
  'OPEN': Color(0xFFF59E0B),
  'UNDER_INVESTIGATION': Color(0xFF3B82F6),
  'RESOLVED': Color(0xFF10B981),
  'CLOSED': Color(0xFF9CA3AF),
};

const _statusLabels = {
  'OPEN': 'Open',
  'UNDER_INVESTIGATION': 'Under Investigation',
  'RESOLVED': 'Resolved',
  'CLOSED': 'Closed',
};

class _POSHCard extends ConsumerStatefulWidget {
  final POSHCase caseItem;
  const _POSHCard({required this.caseItem});

  @override
  ConsumerState<_POSHCard> createState() => _POSHCardState();
}

class _POSHCardState extends ConsumerState<_POSHCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final c = widget.caseItem;
    final color = _statusColors[c.status] ?? const Color(0xFF9CA3AF);
    final label = _statusLabels[c.status] ?? c.status;

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c.caseNumber,
                          style: const TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 11,
                              color: Colors.grey)),
                      const SizedBox(height: 2),
                      Text(
                        c.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: color.withAlpha(25),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: color.withAlpha(80)),
                  ),
                  child: Text(label,
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: color)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Text(
                  DateFormat('dd MMM yyyy').format(c.createdAt),
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
                if (c.isAnonymous) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('Anonymous',
                        style:
                            TextStyle(fontSize: 10, color: Colors.grey)),
                  ),
                ],
                const Spacer(),
                GestureDetector(
                  onTap: () => setState(() => _expanded = !_expanded),
                  child: Icon(
                    _expanded
                        ? Icons.expand_less
                        : Icons.expand_more,
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
            if (_expanded && c.updates.isNotEmpty) ...[
              const Divider(height: 16),
              ...c.updates.map((u) => Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DateFormat('dd MMM').format(u.createdAt),
                          style: const TextStyle(
                              fontSize: 11, color: Colors.grey),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(u.note,
                              style: const TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}

class _CreateCaseSheet extends StatefulWidget {
  final WidgetRef ref;
  const _CreateCaseSheet({required this.ref});

  @override
  State<_CreateCaseSheet> createState() => _CreateCaseSheetState();
}

class _CreateCaseSheetState extends State<_CreateCaseSheet> {
  final _descCtrl = TextEditingController();
  bool _isAnonymous = false;
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                  child: Text('File POSH Case',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w700))),
              IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close)),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descCtrl,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Description of Incident',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Checkbox(
                value: _isAnonymous,
                onChanged: (v) =>
                    setState(() => _isAnonymous = v ?? false),
              ),
              const Text('File anonymously'),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _loading ? null : _submit,
              style: FilledButton.styleFrom(
                  backgroundColor: AppColors.error),
              child: _loading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Text('File Case'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (_descCtrl.text.trim().isEmpty) return;
    setState(() => _loading = true);
    final ok = await widget.ref
        .read(poshNotifierProvider.notifier)
        .create(
            description: _descCtrl.text.trim(),
            isAnonymous: _isAnonymous);
    if (ok && mounted) Navigator.pop(context);
    else if (mounted) setState(() => _loading = false);
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.shield_outlined, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text('No cases on record',
              style:
                  TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
