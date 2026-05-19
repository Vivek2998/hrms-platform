import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/referral_provider.dart';
import '../data/models/referral_model.dart';

class ReferralsScreen extends ConsumerWidget {
  const ReferralsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(referralListProvider);

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
                      Text('Failed to load referrals', style: TextStyle(color: AppColors.error)),
                      TextButton(
                        onPressed: () => ref.invalidate(referralListProvider),
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (refs) {
                final hiredCount = refs.where((r) => r.status == 'HIRED').length;
                final bonusEarned = refs
                    .where((r) => r.bonusPaid)
                    .fold(0.0, (s, r) => s + (r.bonusAmount ?? 0));
                return SliverList(
                  delegate: SliverChildListDelegate([
                    const SizedBox(height: 16),
                    // Stats
                    Row(
                      children: [
                        _StatCard(label: 'Referrals', value: '${refs.length}',
                            icon: Icons.people_rounded, color: AppColors.primary),
                        const SizedBox(width: 10),
                        _StatCard(label: 'Hired', value: '$hiredCount',
                            icon: Icons.emoji_events_rounded, color: AppColors.success),
                        const SizedBox(width: 10),
                        _StatCard(
                          label: 'Bonus',
                          value: '₹${bonusEarned.toStringAsFixed(0)}',
                          icon: Icons.currency_rupee_rounded,
                          color: const Color(0xFFD97706),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    if (refs.isEmpty)
                      const _EmptyState()
                    else
                      ...refs.map((r) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _ReferralCard(referral: r),
                          )),
                  ]),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateSheet(context),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_rounded),
        label: const Text('Refer Someone'),
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
                  const Text('Referrals',
                      style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Refer great people and earn rewards',
                      style: TextStyle(color: Colors.white.withAlpha(200), fontSize: 14)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CreateReferralSheet(),
    );
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 6, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withAlpha(20), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[500])),
          ],
        ),
      ),
    );
  }
}

// ─── Status helpers ───────────────────────────────────────────────────────────

Color _statusColor(String s) => switch (s.toUpperCase()) {
      'HIRED' => AppColors.success,
      'REJECTED' => AppColors.error,
      'SCREENING' => const Color(0xFFF97316),
      _ => AppColors.info,
    };

Color _statusBg(String s) => switch (s.toUpperCase()) {
      'HIRED' => AppColors.successLight,
      'REJECTED' => AppColors.errorLight,
      'SCREENING' => const Color(0xFFFFF7ED),
      _ => AppColors.infoLight,
    };

// ─── Referral Card ────────────────────────────────────────────────────────────

class _ReferralCard extends ConsumerWidget {
  final EmployeeReferral referral;
  const _ReferralCard({required this.referral});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = referral.status.toUpperCase();
    final color = _statusColor(status);
    final bg = _statusBg(status);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: [
          BoxShadow(color: Colors.black.withAlpha(10), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: color.withAlpha(20),
                  child: Text(referral.candidateName[0].toUpperCase(),
                      style: TextStyle(color: color, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(referral.candidateName,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                      Text('${referral.candidateEmail} · ${referral.position}',
                          style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
                  child: Text(status, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            if (referral.bonusAmount != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.currency_rupee_rounded, size: 14, color: Color(0xFFD97706)),
                    Text(
                      'Bonus: ₹${referral.bonusAmount!.toStringAsFixed(0)} ${referral.bonusPaid ? "✓ Paid" : "(pending)"}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFFD97706), fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Referred ${DateFormat('dd MMM yyyy').format(referral.createdAt.toLocal())}',
                    style: TextStyle(fontSize: 11, color: Colors.grey[400]),
                  ),
                ),
                if (status == 'SUBMITTED')
                  TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.error,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: const Size(0, 28),
                    ),
                    onPressed: () async {
                      final ok = await ref.read(withdrawReferralProvider.notifier).withdraw(referral.id);
                      if (!ok && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Failed to withdraw referral')),
                        );
                      }
                    },
                    child: const Text('Withdraw', style: TextStyle(fontSize: 12)),
                  ),
              ],
            ),
          ],
        ),
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
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(color: AppColors.primaryLight, shape: BoxShape.circle),
              child: const Icon(Icons.people_rounded, color: AppColors.primary, size: 40),
            ),
            const SizedBox(height: 16),
            const Text('No Referrals Yet',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
            const SizedBox(height: 6),
            Text('Know someone great? Refer them and earn a bonus.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey[500])),
          ],
        ),
      ),
    );
  }
}

// ─── Create Sheet ─────────────────────────────────────────────────────────────

class _CreateReferralSheet extends ConsumerStatefulWidget {
  const _CreateReferralSheet();

  @override
  ConsumerState<_CreateReferralSheet> createState() => _CreateReferralSheetState();
}

class _CreateReferralSheetState extends ConsumerState<_CreateReferralSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _positionCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _positionCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final ok = await ref.read(createReferralProvider.notifier).create(
          candidateName: _nameCtrl.text.trim(),
          candidateEmail: _emailCtrl.text.trim(),
          candidatePhone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
          position: _positionCtrl.text.trim(),
          message: _messageCtrl.text.trim().isEmpty ? null : _messageCtrl.text.trim(),
        );
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Referral submitted!'), backgroundColor: AppColors.success),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to submit referral'), backgroundColor: AppColors.error),
      );
    }
  }

  Widget _field({
    required TextEditingController ctrl,
    required String label,
    String? hint,
    bool required = false,
    TextInputType? keyboard,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboard,
      minLines: 1,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: required ? '$label *' : label,
        hintText: hint,
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
      ),
      validator: required ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      margin: const EdgeInsets.fromLTRB(8, 0, 8, 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Refer a Candidate',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              const SizedBox(height: 4),
              Text('Help your team find great talent',
                  style: TextStyle(fontSize: 13, color: Colors.grey[500])),
              const SizedBox(height: 24),

              _field(ctrl: _nameCtrl, label: 'Full Name', required: true),
              const SizedBox(height: 12),
              _field(ctrl: _emailCtrl, label: 'Email', required: true, keyboard: TextInputType.emailAddress),
              const SizedBox(height: 12),
              _field(ctrl: _phoneCtrl, label: 'Phone', hint: '+91 98765 43210', keyboard: TextInputType.phone),
              const SizedBox(height: 12),
              _field(ctrl: _positionCtrl, label: 'Position', hint: 'e.g. Software Engineer', required: true),
              const SizedBox(height: 12),
              _field(ctrl: _messageCtrl, label: 'Why recommend them?', maxLines: 3),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 22, height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                        )
                      : const Text('Submit Referral',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
