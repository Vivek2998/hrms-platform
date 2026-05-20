import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/pay_equity_provider.dart';

class PayEquityScreen extends ConsumerWidget {
  const PayEquityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final snapshotAsync = ref.watch(payEquityLatestProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Pay Equity Analysis'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: snapshotAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (snapshot) {
          if (snapshot == null) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No report generated yet. Generate from the web dashboard.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            );
          }
          final currencyFmt =
              NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Snapshot: ${DateFormat('dd MMM yyyy').format(snapshot.snapshotDate)}',
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 12),
              // Gender gap metric card
              Card(
                color: AppColors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Text(
                        'Gender Pay Gap',
                        style: TextStyle(
                            fontSize: 14, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${snapshot.genderGapPct.toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: snapshot.genderGapPct > 10
                              ? Colors.red
                              : snapshot.genderGapPct > 5
                                  ? Colors.orange
                                  : Colors.green,
                        ),
                      ),
                      Text(
                        '${snapshot.totalEmployees} employees analysed',
                        style:
                            const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (snapshot.byGender.isNotEmpty) ...[
                const Text(
                  'By Gender',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 8),
                ...snapshot.byGender.entries.map((entry) {
                  final data = entry.value as Map<String, dynamic>? ?? {};
                  final avgCtc =
                      (data['avgCtc'] as num?)?.toDouble() ?? 0;
                  return Card(
                    color: AppColors.white,
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    child: ListTile(
                      leading: Icon(
                        entry.key == 'MALE'
                            ? Icons.male
                            : entry.key == 'FEMALE'
                                ? Icons.female
                                : Icons.people,
                        color: AppColors.primary,
                      ),
                      title: Text(entry.key),
                      trailing: Text(
                        currencyFmt.format(avgCtc),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 16),
              ],
              if (snapshot.byDepartment.isNotEmpty) ...[
                const Text(
                  'By Department',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 8),
                ...snapshot.byDepartment.entries.map((entry) {
                  final data = entry.value as Map<String, dynamic>? ?? {};
                  final avgCtc =
                      (data['avgCtc'] as num?)?.toDouble() ?? 0;
                  return Card(
                    color: AppColors.white,
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    child: ListTile(
                      leading: Icon(Icons.business, color: AppColors.primary),
                      title: Text(
                        entry.key,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: Text(
                        currencyFmt.format(avgCtc),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                }),
              ],
            ],
          );
        },
      ),
    );
  }
}
