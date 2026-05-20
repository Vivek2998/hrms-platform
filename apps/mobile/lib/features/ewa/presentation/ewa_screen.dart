import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/ewa_provider.dart';
import '../data/models/ewa_model.dart';

const _statusColors = {
  'PENDING': Color(0xFFF59E0B),
  'APPROVED': Color(0xFF3B82F6),
  'DISBURSED': Color(0xFF10B981),
  'REJECTED': Color(0xFFEF4444),
  'REPAID': Color(0xFF9CA3AF),
};

class EWAScreen extends ConsumerStatefulWidget {
  const EWAScreen({super.key});
  @override
  ConsumerState<EWAScreen> createState() => _EWAScreenState();
}

class _EWAScreenState extends ConsumerState<EWAScreen> {
  final _amountCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  @override
  void dispose() { _amountCtrl.dispose(); _notesCtrl.dispose(); super.dispose(); }

  void _showRequestDialog() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Request Salary Advance'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (₹)', prefixText: '₹ '),
            ),
            const SizedBox(height: 12),
            TextField(controller: _notesCtrl, decoration: const InputDecoration(labelText: 'Notes (optional)'), maxLines: 2),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final amount = double.tryParse(_amountCtrl.text);
              if (amount == null || amount <= 0) return;
              Navigator.pop(context);
              final ok = await ref.read(ewaNotifierProvider.notifier).createRequest(amount, _notesCtrl.text.isEmpty ? null : _notesCtrl.text);
              if (ok && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request submitted!')));
                _amountCtrl.clear(); _notesCtrl.clear();
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(ewaRequestsProvider);
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Earned Wage Access'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton.icon(
              onPressed: _showRequestDialog,
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Request'),
            ),
          ),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: TextButton(onPressed: () => ref.invalidate(ewaRequestsProvider), child: const Text('Retry'))),
        data: (requests) => requests.isEmpty
            ? const Center(child: Text('No requests yet.', style: TextStyle(color: Colors.grey)))
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: requests.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) => _RequestTile(req: requests[i]),
              ),
      ),
    );
  }
}

class _RequestTile extends StatelessWidget {
  final EwaRequest req;
  const _RequestTile({required this.req});

  @override
  Widget build(BuildContext context) {
    final color = _statusColors[req.status] ?? const Color(0xFF9CA3AF);
    final fmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        leading: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(10)),
          child: const Icon(Icons.currency_rupee_rounded, color: AppColors.primary, size: 22),
        ),
        title: Text(fmt.format(req.amount), style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(DateFormat('dd MMM yyyy').format(req.requestedAt)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withAlpha(25), borderRadius: BorderRadius.circular(20),
            border: Border.all(color: color.withAlpha(80)),
          ),
          child: Text(req.status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
        ),
      ),
    );
  }
}
