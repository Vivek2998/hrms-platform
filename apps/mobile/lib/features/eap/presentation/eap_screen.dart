import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../data/models/eap_model.dart';
import '../providers/eap_provider.dart';

const _categories = ['All', 'COUNSELING', 'FINANCIAL', 'LEGAL', 'WELLNESS', 'CRISIS'];

IconData _categoryIcon(String cat) {
  switch (cat.toUpperCase()) {
    case 'COUNSELING':
      return Icons.favorite;
    case 'FINANCIAL':
      return Icons.attach_money;
    case 'LEGAL':
      return Icons.gavel;
    case 'WELLNESS':
      return Icons.spa;
    case 'CRISIS':
      return Icons.warning;
    default:
      return Icons.help_outline;
  }
}

Color _categoryColor(String cat) {
  switch (cat.toUpperCase()) {
    case 'COUNSELING':
      return Colors.pink;
    case 'FINANCIAL':
      return Colors.green;
    case 'LEGAL':
      return Colors.indigo;
    case 'WELLNESS':
      return Colors.teal;
    case 'CRISIS':
      return Colors.red;
    default:
      return Colors.grey;
  }
}

class EapScreen extends ConsumerStatefulWidget {
  const EapScreen({super.key});

  @override
  ConsumerState<EapScreen> createState() => _EapScreenState();
}

class _EapScreenState extends ConsumerState<EapScreen> {
  String _selectedCategory = 'All';

  @override
  Widget build(BuildContext context) {
    final resourcesAsync = ref.watch(eapResourcesProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Mental Health & EAP'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: Column(
        children: [
          Container(
            color: AppColors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final cat = _categories[i];
                  final selected = _selectedCategory == cat;
                  return FilterChip(
                    label: Text(cat),
                    selected: selected,
                    onSelected: (_) =>
                        setState(() => _selectedCategory = cat),
                    selectedColor: AppColors.primaryLight,
                    checkmarkColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: selected ? AppColors.primary : Colors.grey[700],
                      fontSize: 12,
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  );
                },
              ),
            ),
          ),
          Expanded(
            child: resourcesAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (resources) {
                final filtered = _selectedCategory == 'All'
                    ? resources
                    : resources
                        .where((r) => r.category == _selectedCategory)
                        .toList();

                if (filtered.isEmpty) {
                  return const Center(
                    child: Text(
                      'No resources available.',
                      style: TextStyle(color: Colors.grey),
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (context, i) =>
                      _ResourceCard(resource: filtered[i]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ResourceCard extends StatelessWidget {
  final EapResource resource;
  const _ResourceCard({required this.resource});

  @override
  Widget build(BuildContext context) {
    final catColor = _categoryColor(resource.category);

    return Card(
      color: AppColors.white,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: catColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(_categoryIcon(resource.category),
                      color: catColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    resource.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: catColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    resource.category,
                    style: TextStyle(
                      color: catColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (resource.isAnonymous) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.purple.shade50,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Anonymous Support',
                      style: TextStyle(
                        color: Colors.purple,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            if (resource.description != null) ...[
              const SizedBox(height: 8),
              Text(
                resource.description!,
                style: const TextStyle(fontSize: 13, color: Colors.grey),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (resource.providerName != null) ...[
              const SizedBox(height: 8),
              _ContactRow(
                  icon: Icons.business, text: resource.providerName!),
            ],
            if (resource.contactEmail != null)
              _ContactRow(
                  icon: Icons.email, text: resource.contactEmail!),
            if (resource.contactPhone != null)
              _ContactRow(
                  icon: Icons.phone, text: resource.contactPhone!),
          ],
        ),
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _ContactRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.grey),
          const SizedBox(width: 6),
          Expanded(
            child: Text(text,
                style: const TextStyle(fontSize: 12),
                overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}
