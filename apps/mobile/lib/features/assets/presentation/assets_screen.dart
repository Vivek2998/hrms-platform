import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../data/models/asset_model.dart';
import '../providers/asset_provider.dart';
import '../../../../core/theme/app_theme.dart';

class AssetsScreen extends ConsumerWidget {
  const AssetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetsAsync = ref.watch(assetsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My Assets')),
      body: assetsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (assets) {
          if (assets.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.devices_outlined, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 12),
                  Text('No assets assigned to you',
                      style: TextStyle(color: Colors.grey[500], fontSize: 16)),
                  const SizedBox(height: 4),
                  Text('Contact HR if you need equipment',
                      style: TextStyle(color: Colors.grey[400], fontSize: 13)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(assetsProvider),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              itemCount: assets.length,
              itemBuilder: (_, i) => _AssetCard(asset: assets[i]),
            ),
          );
        },
      ),
    );
  }
}

class _AssetCard extends StatelessWidget {
  final Asset asset;
  const _AssetCard({required this.asset});

  @override
  Widget build(BuildContext context) {
    final statusColor = Color(kAssetStatusColors[asset.status] ?? 0xFF6B7280);
    final emoji = kCategoryIcons[asset.category] ?? '📦';
    final assignee = asset.currentAssignment?.employee;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Text(emoji, style: const TextStyle(fontSize: 22)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(asset.name,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 15)),
                      if (asset.brand != null || asset.model != null)
                        Text(
                          [asset.brand, asset.model]
                              .where((s) => s != null)
                              .join(' '),
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey[500]),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(30),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    asset.status.replaceAll('_', ' '),
                    style: TextStyle(
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Wrap(
              spacing: 16,
              runSpacing: 6,
              children: [
                _InfoItem('Category',
                    asset.category.replaceAll('_', ' ')),
                if (asset.serialNumber != null)
                  _InfoItem('Serial No.', asset.serialNumber!),
                if (asset.assignedAt != null)
                  _InfoItem('Assigned',
                      DateFormat('d MMM yyyy').format(asset.assignedAt!)),
                if (asset.warrantyExpiry != null)
                  _InfoItem('Warranty',
                      DateFormat('d MMM yyyy').format(asset.warrantyExpiry!)),
                if (assignee != null)
                  _InfoItem('Assigned To', assignee.fullName),
              ],
            ),
            if (asset.notes != null) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Text(
                  asset.notes!,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final String label;
  final String value;
  const _InfoItem(this.label, this.value);

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[500],
                  letterSpacing: 0.5)),
          const SizedBox(height: 2),
          Text(value,
              style: const TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      );
}
