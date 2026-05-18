import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/models/document_model.dart';
import '../providers/document_provider.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../core/theme/app_theme.dart';

class DocumentsScreen extends ConsumerWidget {
  const DocumentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final docsAsync = ref.watch(myDocumentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Documents'),
      ),
      body: docsAsync.when(
        data: (docs) {
          if (docs.isEmpty) {
            return const _EmptyState();
          }
          // Group by type
          final grouped = <String, List<AppDocument>>{};
          for (final d in docs) {
            grouped.putIfAbsent(d.type, () => []).add(d);
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            children: grouped.entries.map((entry) {
              return _DocGroup(type: entry.key, docs: entry.value);
            }).toList(),
          );
        },
        loading: () => ListView(
          padding: const EdgeInsets.all(16),
          children: List.generate(5, (_) => const ShimmerCard(height: 72)),
        ),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text('Failed to load documents\n$err',
                  textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(myDocumentsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DocGroup extends StatelessWidget {
  final String type;
  final List<AppDocument> docs;

  const _DocGroup({required this.type, required this.docs});

  @override
  Widget build(BuildContext context) {
    final label = docs.first.typeLabel;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 10, top: 12),
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 15,
              color: AppColors.primary,
            ),
          ),
        ),
        ...docs.map((d) => _DocumentTile(doc: d)),
      ],
    );
  }
}

class _DocumentTile extends StatelessWidget {
  final AppDocument doc;
  const _DocumentTile({required this.doc});

  Future<void> _open(BuildContext context) async {
    final uri = Uri.parse(doc.url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open document')),
      );
    }
  }

  IconData get _icon => switch (doc.type) {
        'OFFER_LETTER' || 'APPOINTMENT_LETTER' => Icons.description_rounded,
        'ID_PROOF' || 'ADDRESS_PROOF' => Icons.badge_rounded,
        'PAYSLIP' => Icons.receipt_long_rounded,
        'FORM_16' => Icons.account_balance_rounded,
        'EXPERIENCE_LETTER' || 'RELIEVING_LETTER' => Icons.workspace_premium_rounded,
        'EDUCATIONAL' => Icons.school_rounded,
        _ => Icons.folder_rounded,
      };

  Color get _iconColor => doc.isPdf ? AppColors.error : AppColors.primary;

  @override
  Widget build(BuildContext context) {
    final date = DateFormat('d MMM y').format(doc.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: doc.isPdf ? AppColors.errorLight : AppColors.primaryLight,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(_icon, color: _iconColor, size: 24),
        ),
        title: Text(
          doc.name,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Row(
          children: [
            Text(
              date,
              style: TextStyle(
                fontSize: 11,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            if (doc.sizeLabel.isNotEmpty) ...[
              const SizedBox(width: 8),
              Container(
                width: 4,
                height: 4,
                decoration: const BoxDecoration(
                  color: Color(0xFFCBD5E1),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                doc.sizeLabel,
                style: TextStyle(
                  fontSize: 11,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.open_in_new_rounded,
              size: 20, color: AppColors.primary),
          onPressed: () => _open(context),
        ),
        onTap: () => _open(context),
      ),
    );
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
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.folder_open_rounded,
                size: 40, color: AppColors.primary),
          ),
          const SizedBox(height: 20),
          const Text(
            'No Documents Yet',
            style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            'Your HR team will upload documents here\n(offer letters, ID proofs, form 16, etc.)',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
