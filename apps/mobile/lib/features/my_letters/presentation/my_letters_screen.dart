import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/letters_provider.dart';

class MyLettersScreen extends ConsumerWidget {
  const MyLettersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          _buildHeader(context),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _LetterTile(
                  icon: Icons.work_history_rounded,
                  color: AppColors.primary,
                  bgColor: AppColors.primaryLight,
                  title: 'Experience Letter',
                  subtitle: 'Certifies your tenure and designation',
                  providerNotifier: () => ref.refresh(experienceLetterProvider),
                  onTap: () => _download(context, ref, isExperience: true),
                ),
                const SizedBox(height: 12),
                _LetterTile(
                  icon: Icons.currency_rupee_rounded,
                  color: AppColors.success,
                  bgColor: AppColors.successLight,
                  title: 'Salary Certificate',
                  subtitle: 'Confirms your current salary details',
                  providerNotifier: () => ref.refresh(salaryCertProvider),
                  onTap: () => _download(context, ref, isExperience: false),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.info_outline_rounded,
                            color: AppColors.primary, size: 18),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Need a custom letter?',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            SizedBox(height: 4),
                            Text(
                              'For visa support, bank, or employment verification letters, raise an HR request via the Helpdesk.',
                              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ]),
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
                  const Text('My Letters',
                      style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('Download employment letters instantly',
                      style: TextStyle(color: Colors.white.withAlpha(200), fontSize: 14)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _download(BuildContext context, WidgetRef ref, {required bool isExperience}) async {
    try {
      final data = isExperience
          ? await ref.read(lettersRepositoryProvider).getExperienceLetterData()
          : await ref.read(lettersRepositoryProvider).getSalaryCertificateData();

      if (!context.mounted) return;
      _showLetterPreview(context, data, isExperience: isExperience);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to generate letter. Please try again.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showLetterPreview(BuildContext context, Map<String, dynamic> data,
      {required bool isExperience}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _LetterPreviewSheet(data: data, isExperience: isExperience),
    );
  }
}

// ─── Letter Tile ──────────────────────────────────────────────────────────────

class _LetterTile extends StatefulWidget {
  final IconData icon;
  final Color color, bgColor;
  final String title, subtitle;
  final VoidCallback onTap, providerNotifier;

  const _LetterTile({
    required this.icon,
    required this.color,
    required this.bgColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    required this.providerNotifier,
  });

  @override
  State<_LetterTile> createState() => _LetterTileState();
}

class _LetterTileState extends State<_LetterTile> {
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: widget.bgColor, borderRadius: BorderRadius.circular(14)),
              child: Icon(widget.icon, color: widget.color, size: 28),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.title,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                  const SizedBox(height: 3),
                  Text(widget.subtitle, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                ],
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              height: 38,
              child: ElevatedButton.icon(
                onPressed: _loading
                    ? null
                    : () async {
                        setState(() => _loading = true);
                        await Future.microtask(widget.onTap);
                        if (mounted) setState(() => _loading = false);
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: widget.color,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
                icon: _loading
                    ? const SizedBox(
                        width: 14, height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.download_rounded, size: 16),
                label: const Text('Get', style: TextStyle(fontSize: 13)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Letter Preview Sheet ─────────────────────────────────────────────────────

class _LetterPreviewSheet extends StatelessWidget {
  final Map<String, dynamic> data;
  final bool isExperience;
  const _LetterPreviewSheet({required this.data, required this.isExperience});

  @override
  Widget build(BuildContext context) {
    final emp = data['employee'] as Map<String, dynamic>? ?? {};
    final org = data['organization'] as Map<String, dynamic>? ?? {};
    final sal = data['salary'] as Map<String, dynamic>?;
    final issuedDate = data['issuedDate'] as String? ?? DateFormat('dd MMMM yyyy').format(DateTime.now());
    final currFmt = NumberFormat('#,##,##0', 'en_IN');

    return Container(
      margin: const EdgeInsets.fromLTRB(8, 0, 8, 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.all(Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              children: [
                Icon(isExperience ? Icons.work_history_rounded : Icons.currency_rupee_rounded,
                    color: AppColors.primary, size: 22),
                const SizedBox(width: 8),
                Text(isExperience ? 'Experience Letter' : 'Salary Certificate',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text('Date: $issuedDate', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          ),
          const Divider(height: 24),

          // Content
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _LabelValue(label: 'Employee', value: '${emp['name'] ?? ''} (${emp['code'] ?? ''})'),
                  _LabelValue(label: 'Designation', value: emp['designation'] ?? ''),
                  if ((emp['department'] ?? '').toString().isNotEmpty)
                    _LabelValue(label: 'Department', value: emp['department']),
                  if (isExperience && (emp['dateOfJoining'] ?? '').toString().isNotEmpty)
                    _LabelValue(
                      label: 'Date of Joining',
                      value: _fmtDate(emp['dateOfJoining'] as String),
                    ),
                  if (!isExperience && sal != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        children: [
                          _SalRow(label: 'Annual CTC', value: '₹${currFmt.format(sal['ctc'] ?? 0)}'),
                          _SalRow(label: 'Monthly Gross', value: '₹${currFmt.format(sal['gross'] ?? 0)}'),
                          _SalRow(label: 'Basic', value: '₹${currFmt.format(sal['basic'] ?? 0)}'),
                          _SalRow(
                              label: 'Net Pay (Monthly)',
                              value: '₹${currFmt.format(sal['netPay'] ?? 0)}',
                              isBold: true),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  _LabelValue(label: 'Issued by', value: org['name'] ?? ''),
                  Text(org['address'] ?? '', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                ],
              ),
            ),
          ),

          // Footer
          Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.paddingOf(context).bottom + 16),
            child: SizedBox(
              width: double.infinity, height: 50,
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.check_rounded, size: 18),
                label: const Text('Done', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmtDate(String iso) {
    try {
      return DateFormat('dd MMMM yyyy').format(DateTime.parse(iso));
    } catch (_) {
      return iso;
    }
  }
}

class _LabelValue extends StatelessWidget {
  final String label, value;
  const _LabelValue({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          ),
          Expanded(
            child: Text(value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
          ),
        ],
      ),
    );
  }
}

class _SalRow extends StatelessWidget {
  final String label, value;
  final bool isBold;
  const _SalRow({required this.label, required this.value, this.isBold = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: const Color(0xFFE2E8F0), width: isBold ? 0 : 1)),
        color: isBold ? AppColors.primaryLight : Colors.transparent,
        borderRadius: isBold ? const BorderRadius.vertical(bottom: Radius.circular(10)) : null,
      ),
      child: Row(
        children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: 13, fontWeight: isBold ? FontWeight.bold : FontWeight.normal))),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: isBold ? AppColors.primary : const Color(0xFF1E293B))),
        ],
      ),
    );
  }
}
