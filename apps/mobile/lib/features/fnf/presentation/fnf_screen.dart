import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/fnf_provider.dart';
import '../data/models/fnf_model.dart';

class FnFScreen extends ConsumerWidget {
  const FnFScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(fnfListProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          _buildHeader(context),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
            sliver: listAsync.when(
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.error_outline, color: AppColors.error, size: 48),
                      const SizedBox(height: 12),
                      Text('Failed to load settlement', style: TextStyle(color: AppColors.error)),
                      TextButton(
                        onPressed: () => ref.invalidate(fnfListProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (settlements) => settlements.isEmpty
                  ? const SliverFillRemaining(child: _EmptyState())
                  : SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _SettlementCard(settlement: settlements[i]),
                        ),
                        childCount: settlements.length,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 180,
      pinned: true,
      backgroundColor: AppColors.primary,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
        onPressed: () => Navigator.of(context).pop(),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 56, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Text('Full & Final Settlement',
                      style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Your exit settlement details',
                      style: TextStyle(color: Colors.white.withAlpha(200), fontSize: 14)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

Color _statusColor(String s) => switch (s.toUpperCase()) {
      'PAID' => AppColors.success,
      'APPROVED' => const Color(0xFF0891B2),
      'PENDING_APPROVAL' => const Color(0xFFF97316),
      'DRAFT' => Colors.grey,
      _ => AppColors.info,
    };

Color _statusBg(String s) => switch (s.toUpperCase()) {
      'PAID' => AppColors.successLight,
      'APPROVED' => const Color(0xFFCFFAFE),
      'PENDING_APPROVAL' => const Color(0xFFFFF7ED),
      'DRAFT' => const Color(0xFFF8FAFC),
      _ => AppColors.infoLight,
    };

String _statusLabel(String s) => switch (s.toUpperCase()) {
      'PENDING_APPROVAL' => 'Pending Approval',
      _ => s[0] + s.substring(1).toLowerCase(),
    };

// ─── Settlement Card ──────────────────────────────────────────────────────────

class _SettlementCard extends StatelessWidget {
  final FnFSettlement settlement;
  const _SettlementCard({required this.settlement});

  @override
  Widget build(BuildContext context) {
    final status = settlement.status.toUpperCase();
    final color = _statusColor(status);
    final bg = _statusBg(status);
    final fmt = DateFormat('dd MMM yyyy');
    final currFmt = NumberFormat('#,##,##0.00', 'en_IN');

    DateTime? lastDay;
    try { lastDay = DateTime.parse(settlement.lastWorkingDate).toLocal(); } catch (_) {}

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withAlpha(12), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withAlpha(15),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              border: Border(bottom: BorderSide(color: color.withAlpha(30))),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: color.withAlpha(25), shape: BoxShape.circle),
                  child: Icon(Icons.calculate_rounded, color: color, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Exit Settlement',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                      if (lastDay != null)
                        Text('Last working day: ${fmt.format(lastDay)}',
                            style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
                  child: Text(_statusLabel(status),
                      style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),

          // Breakdown
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                if (settlement.basicAmount > 0)
                  _Row(label: 'Basic Salary', amount: settlement.basicAmount,
                      note: '${settlement.basicDays} days', fmt: currFmt),
                if (settlement.leaveEncashment > 0)
                  _Row(label: 'Leave Encashment', amount: settlement.leaveEncashment,
                      note: '${settlement.pendingLeavesDays} days', fmt: currFmt),
                if (settlement.gratuityAmount > 0)
                  _Row(label: 'Gratuity', amount: settlement.gratuityAmount,
                      note: '${settlement.gratuityYears} yrs', fmt: currFmt),
                if (settlement.bonusAmount > 0)
                  _Row(label: 'Bonus', amount: settlement.bonusAmount, fmt: currFmt),
                if (settlement.otherDeductions > 0)
                  _Row(label: 'Deductions', amount: -settlement.otherDeductions,
                      fmt: currFmt, isDeduction: true),
                const Divider(height: 20),
                Row(
                  children: [
                    const Expanded(
                      child: Text('Net Payable',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                    ),
                    Text('₹${currFmt.format(settlement.netPayable)}',
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ],
                ),
                if (settlement.notes != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                        color: AppColors.surface, borderRadius: BorderRadius.circular(8)),
                    child: Text(settlement.notes!,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                  ),
                ],
                if (settlement.approvedBy != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.verified_rounded, size: 13, color: AppColors.success),
                      const SizedBox(width: 4),
                      Text(
                        'Approved by ${settlement.approvedBy!['firstName'] ?? ''} ${settlement.approvedBy!['lastName'] ?? ''}',
                        style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final double amount;
  final String? note;
  final NumberFormat fmt;
  final bool isDeduction;
  const _Row({required this.label, required this.amount, required this.fmt,
      this.note, this.isDeduction = false});

  @override
  Widget build(BuildContext context) {
    final color = isDeduction ? AppColors.error : const Color(0xFF1E293B);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Row(
              children: [
                Text(label, style: TextStyle(fontSize: 13, color: color)),
                if (note != null) ...[
                  const SizedBox(width: 4),
                  Text('($note)', style: TextStyle(fontSize: 11, color: Colors.grey[400])),
                ],
              ],
            ),
          ),
          Text(
            '${isDeduction ? "-" : "+"}₹${fmt.format(amount.abs())}',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color),
          ),
        ],
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
            child: const Icon(Icons.calculate_rounded, color: AppColors.primary, size: 40),
          ),
          const SizedBox(height: 16),
          const Text('No Settlement Found',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
          const SizedBox(height: 6),
          Text('Your full & final settlement details will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[500])),
        ],
      ),
    );
  }
}
