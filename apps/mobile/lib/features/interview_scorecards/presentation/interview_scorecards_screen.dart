import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../data/models/scorecard_model.dart';
import '../providers/scorecard_provider.dart';

class InterviewScorecardsScreen extends ConsumerWidget {
  const InterviewScorecardsScreen({super.key});

  Color _recommendationColor(String? rec) {
    switch (rec?.toUpperCase()) {
      case 'STRONG_YES':
        return const Color(0xFF1B5E20);
      case 'YES':
        return Colors.green;
      case 'MAYBE':
        return Colors.amber;
      case 'NO':
        return Colors.red;
      case 'STRONG_NO':
        return const Color(0xFF7F0000);
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scorecardsAsync = ref.watch(interviewScorecardsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Interview Scorecards'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: scorecardsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (scorecards) {
          if (scorecards.isEmpty) {
            return const Center(
              child: Text(
                'No scorecards found.',
                style: TextStyle(color: Colors.grey),
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: scorecards.length,
            itemBuilder: (context, i) => _ScorecardCard(
              scorecard: scorecards[i],
              recColor: _recommendationColor(scorecards[i].recommendation),
            ),
          );
        },
      ),
    );
  }
}

class _ScorecardCard extends StatelessWidget {
  final InterviewScorecard scorecard;
  final Color recColor;

  const _ScorecardCard({required this.scorecard, required this.recColor});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppColors.white,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: scorecard.scores.isEmpty
            ? null
            : () => _showScores(context),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      scorecard.candidateName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  if (scorecard.recommendation != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: recColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        scorecard.recommendation!.replaceAll('_', ' '),
                        style: TextStyle(
                          color: recColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              _StarRating(rating: scorecard.overallRating),
              const SizedBox(height: 6),
              Text(
                DateFormat('dd MMM yyyy').format(scorecard.createdAt),
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
              if (scorecard.scores.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    'Tap to view ${scorecard.scores.length} competency scores',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showScores(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _ScoresSheet(scorecard: scorecard),
    );
  }
}

class _StarRating extends StatelessWidget {
  final double? rating;
  const _StarRating({this.rating});

  @override
  Widget build(BuildContext context) {
    final r = rating ?? 0;
    return Row(
      children: List.generate(5, (i) {
        return Icon(
          i < r.floor()
              ? Icons.star
              : (i < r && r - i >= 0.5)
                  ? Icons.star_half
                  : Icons.star_border,
          color: Colors.amber,
          size: 18,
        );
      }),
    );
  }
}

class _ScoresSheet extends StatelessWidget {
  final InterviewScorecard scorecard;
  const _ScoresSheet({required this.scorecard});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            scorecard.candidateName,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 4),
          const Text('Competency Scores',
              style: TextStyle(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 12),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: scorecard.scores.length,
              itemBuilder: (context, i) {
                final score = scorecard.scores[i] as Map<String, dynamic>?;
                if (score == null) return const SizedBox.shrink();
                final competency = score['competency'] as String? ?? 'Unknown';
                final rating = (score['rating'] as num?)?.toDouble() ?? 0;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Expanded(child: Text(competency)),
                      _StarRating(rating: rating),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
