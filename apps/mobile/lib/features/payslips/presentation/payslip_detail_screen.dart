import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import '../providers/payslip_provider.dart';

class PayslipDetailScreen extends ConsumerWidget {
  final String payslipId;
  const PayslipDetailScreen({super.key, required this.payslipId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(payslipDetailProvider(payslipId));
    final fmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

    return Scaffold(
      appBar: AppBar(title: const Text('Payslip Detail')),
      body: detailAsync.when(
        data: (data) {
          final earnings = data['earnings'] as List? ?? [];
          final deductions = data['deductions'] as List? ?? [];
          final pdfUrl = data['pdfUrl'] as String?;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _SummaryCard(data: data, fmt: fmt),
              const SizedBox(height: 16),
              if (earnings.isNotEmpty) ...[
                _SectionHeader('Earnings'),
                ...earnings.map((e) => _LineItem(
                      label: e['name'] as String,
                      amount: (e['amount'] as num).toDouble(),
                      fmt: fmt,
                      isPositive: true,
                    )),
                const SizedBox(height: 16),
              ],
              if (deductions.isNotEmpty) ...[
                _SectionHeader('Deductions'),
                ...deductions.map((e) => _LineItem(
                      label: e['name'] as String,
                      amount: (e['amount'] as num).toDouble(),
                      fmt: fmt,
                      isPositive: false,
                    )),
                const SizedBox(height: 16),
              ],
              _NetPayCard(
                netPay: (data['netPay'] as num).toDouble(),
                fmt: fmt,
              ),
              if (pdfUrl != null) ...[
                const SizedBox(height: 20),
                _PdfActions(
                  pdfUrl: pdfUrl,
                  month: data['month'] as int,
                  year: data['year'] as int,
                ),
              ],
              const SizedBox(height: 32),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

// ─── PDF Actions ──────────────────────────────────────────────────────────────

class _PdfActions extends StatefulWidget {
  final String pdfUrl;
  final int month;
  final int year;
  const _PdfActions(
      {required this.pdfUrl, required this.month, required this.year});

  @override
  State<_PdfActions> createState() => _PdfActionsState();
}

class _PdfActionsState extends State<_PdfActions> {
  bool _busy = false;

  static const _months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  String get _fileName =>
      'Payslip_${_months[widget.month]}_${widget.year}.pdf';

  Future<String> _localPath() async {
    final dir = await getTemporaryDirectory();
    return '${dir.path}/$_fileName';
  }

  Future<String> _ensureDownloaded() async {
    final path = await _localPath();
    if (!File(path).existsSync()) {
      await Dio().download(widget.pdfUrl, path);
    }
    return path;
  }

  Future<void> _open() async {
    setState(() => _busy = true);
    try {
      final path = await _ensureDownloaded();
      await OpenFilex.open(path);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _share() async {
    setState(() => _busy = true);
    try {
      final path = await _ensureDownloaded();
      await Share.shareXFiles(
        [XFile(path, mimeType: 'application/pdf')],
        subject: 'Payslip – ${_months[widget.month]} ${widget.year}',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not share: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _busy ? null : _open,
            icon: _busy
                ? SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: scheme.primary),
                  )
                : const Icon(Icons.open_in_new_outlined, size: 18),
            label: const Text('Open PDF'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _busy ? null : _share,
            icon: const Icon(Icons.share_outlined, size: 18),
            label: const Text('Share'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 13),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

class _SummaryCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final NumberFormat fmt;
  const _SummaryCard({required this.data, required this.fmt});

  static const _months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  @override
  Widget build(BuildContext context) {
    final month = data['month'] as int;
    final year = data['year'] as int;
    final gross = (data['grossEarnings'] as num).toDouble();
    final deductions = (data['totalDeductions'] as num).toDouble();
    return Card(
      color: Theme.of(context).colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${_months[month]} $year',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.onPrimaryContainer),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _SummaryItem('Gross Earnings', fmt.format(gross), context),
                _SummaryItem('Total Deductions', fmt.format(deductions), context),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

Widget _SummaryItem(String label, String value, BuildContext ctx) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: TextStyle(
                fontSize: 11,
                color: Theme.of(ctx).colorScheme.onPrimaryContainer)),
        Text(value,
            style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Theme.of(ctx).colorScheme.onPrimaryContainer)),
      ],
    );

Widget _SectionHeader(String title) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
    );

class _LineItem extends StatelessWidget {
  final String label;
  final double amount;
  final NumberFormat fmt;
  final bool isPositive;
  const _LineItem({
    required this.label,
    required this.amount,
    required this.fmt,
    required this.isPositive,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            fmt.format(amount),
            style: TextStyle(
                fontWeight: FontWeight.w500,
                color: isPositive
                    ? Colors.green.shade700
                    : Colors.red.shade700),
          ),
        ],
      ),
    );
  }
}

class _NetPayCard extends StatelessWidget {
  final double netPay;
  final NumberFormat fmt;
  const _NetPayCard({required this.netPay, required this.fmt});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.green.shade50,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Net Pay',
                style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.green)),
            Text(
              fmt.format(netPay),
              style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.green),
            ),
          ],
        ),
      ),
    );
  }
}
