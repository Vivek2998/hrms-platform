import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/performance_model.dart';
import '../providers/performance_provider.dart';

class ReviewsTab extends ConsumerWidget {
  final PerformanceCycle cycle;
  const ReviewsTab({super.key, required this.cycle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviewsAsync = ref.watch(performanceReviewsProvider(cycle.id));

    return reviewsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (reviews) => RefreshIndicator(
        onRefresh: () => ref.refresh(performanceReviewsProvider(cycle.id).future),
        child: reviews.isEmpty
            ? _emptyState()
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: reviews.length,
                itemBuilder: (ctx, i) => _ReviewCard(review: reviews[i], cycleId: cycle.id),
              ),
      ),
    );
  }

  Widget _emptyState() => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.rate_review_outlined, size: 56, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            Text('No reviews for this cycle',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
          ],
        ),
      );
}

class _ReviewCard extends ConsumerWidget {
  final PerformanceReview review;
  final String cycleId;
  const _ReviewCard({required this.review, required this.cycleId});

  static const _statusColors = <String, Color>{
    'PENDING': Colors.orange,
    'SELF_SUBMITTED': Colors.blue,
    'MANAGER_REVIEWED': Colors.purple,
    'COMPLETED': Colors.green,
  };

  static const _statusLabels = <String, String>{
    'PENDING': 'Pending',
    'SELF_SUBMITTED': 'Self Submitted',
    'MANAGER_REVIEWED': 'Manager Reviewed',
    'COMPLETED': 'Completed',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final color = _statusColors[review.status] ?? Colors.grey;
    final empName =
        '${review.employee?['firstName'] ?? ''} ${review.employee?['lastName'] ?? ''}'.trim();
    final reviewerName =
        '${review.reviewer?['firstName'] ?? ''} ${review.reviewer?['lastName'] ?? ''}'.trim();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: scheme.primaryContainer,
                  child: Text(
                    empName.isNotEmpty ? empName[0].toUpperCase() : '?',
                    style: TextStyle(
                        color: scheme.onPrimaryContainer, fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(empName.isEmpty ? 'Employee' : empName,
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      if (reviewerName.isNotEmpty)
                        Text('Reviewer: $reviewerName',
                            style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                _StatusChip(
                    label: _statusLabels[review.status] ?? review.status, color: color),
              ],
            ),

            if (review.selfRating != null) ...[
              const Divider(height: 20),
              _RatingRow(
                label: 'Self Assessment',
                rating: review.selfRating!,
                comments: review.selfComments,
                scheme: scheme,
              ),
            ],

            if (review.managerRating != null) ...[
              const SizedBox(height: 8),
              _RatingRow(
                label: 'Manager Assessment',
                rating: review.managerRating!,
                comments: review.managerComments,
                scheme: scheme,
              ),
            ],

            if (review.finalRating != null) ...[
              const SizedBox(height: 8),
              _RatingRow(
                label: 'Final Rating',
                rating: review.finalRating!,
                comments: null,
                scheme: scheme,
                highlight: true,
              ),
            ],

            // Self-review action
            if (review.status == 'PENDING') ...[
              const Divider(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => _showSelfReviewDialog(context, ref),
                  icon: const Icon(Icons.edit_note, size: 18),
                  label: const Text('Submit Self Review'),
                ),
              ),
            ],

            // Manager review action
            if (review.status == 'SELF_SUBMITTED' && review.reviewerId != null) ...[
              const Divider(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => _showManagerReviewDialog(context, ref),
                  icon: const Icon(Icons.supervisor_account, size: 18),
                  label: const Text('Submit Manager Review'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _showSelfReviewDialog(BuildContext context, WidgetRef ref) async {
    int rating = 3;
    final commentsCtrl = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Self Assessment'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your Rating', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              _StarRatingInput(
                value: rating,
                onChanged: (v) => setState(() => rating = v),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: commentsCtrl,
                decoration: const InputDecoration(
                  labelText: 'Comments (optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await ref.read(reviewNotifierProvider.notifier).submitSelfReview(
                      review.id,
                      selfRating: rating,
                      selfComments: commentsCtrl.text.trim().isEmpty
                          ? null
                          : commentsCtrl.text.trim(),
                    );
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showManagerReviewDialog(BuildContext context, WidgetRef ref) async {
    int rating = 3;
    final commentsCtrl = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setState) => AlertDialog(
          title: const Text('Manager Assessment'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Your Rating', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              _StarRatingInput(
                value: rating,
                onChanged: (v) => setState(() => rating = v),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: commentsCtrl,
                decoration: const InputDecoration(
                  labelText: 'Comments (optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            FilledButton(
              onPressed: () async {
                Navigator.pop(ctx);
                await ref.read(reviewNotifierProvider.notifier).submitManagerReview(
                      review.id,
                      managerRating: rating,
                      managerComments: commentsCtrl.text.trim().isEmpty
                          ? null
                          : commentsCtrl.text.trim(),
                    );
              },
              child: const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }
}

class _RatingRow extends StatelessWidget {
  final String label;
  final double rating;
  final String? comments;
  final ColorScheme scheme;
  final bool highlight;

  const _RatingRow({
    required this.label,
    required this.rating,
    required this.comments,
    required this.scheme,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: highlight ? FontWeight.w700 : FontWeight.w500,
                    color: highlight ? scheme.primary : scheme.onSurfaceVariant)),
            const Spacer(),
            _StarDisplay(rating: rating),
            const SizedBox(width: 6),
            Text(rating.toStringAsFixed(1),
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: highlight ? scheme.primary : scheme.onSurface)),
          ],
        ),
        if (comments != null && comments!.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(comments!,
              style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
        ],
      ],
    );
  }
}

class _StarDisplay extends StatelessWidget {
  final double rating;
  const _StarDisplay({required this.rating});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final filled = i < rating.round();
        return Icon(
          filled ? Icons.star : Icons.star_border,
          size: 14,
          color: filled ? Colors.amber : Colors.grey.shade300,
        );
      }),
    );
  }
}

class _StarRatingInput extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;
  const _StarRatingInput({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final filled = i < value;
        return GestureDetector(
          onTap: () => onChanged(i + 1),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Icon(
              filled ? Icons.star : Icons.star_border,
              size: 32,
              color: filled ? Colors.amber : Colors.grey.shade400,
            ),
          ),
        );
      }),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  const _StatusChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
    );
  }
}
