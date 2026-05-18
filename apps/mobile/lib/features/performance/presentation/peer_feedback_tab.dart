import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/performance_model.dart';
import '../providers/performance_provider.dart';

class PeerFeedbackTab extends ConsumerWidget {
  final PerformanceCycle cycle;
  const PeerFeedbackTab({super.key, required this.cycle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedbackAsync = ref.watch(peerFeedbackListProvider(cycleId: cycle.id));

    return feedbackAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (feedbacks) => RefreshIndicator(
        onRefresh: () =>
            ref.refresh(peerFeedbackListProvider(cycleId: cycle.id).future),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _GiveFeedbackCard(cycle: cycle),
            const SizedBox(height: 20),
            if (feedbacks.isEmpty)
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const SizedBox(height: 20),
                    Icon(Icons.people_outline, size: 48, color: Colors.grey.shade300),
                    const SizedBox(height: 12),
                    Text('No peer feedback received yet',
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                  ],
                ),
              )
            else ...[
              Text('Feedback Received',
                  style: Theme.of(context)
                      .textTheme
                      .titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              ...feedbacks.map((f) => _FeedbackCard(feedback: f)),
            ],
          ],
        ),
      ),
    );
  }
}

class _GiveFeedbackCard extends ConsumerStatefulWidget {
  final PerformanceCycle cycle;
  const _GiveFeedbackCard({required this.cycle});

  @override
  ConsumerState<_GiveFeedbackCard> createState() => _GiveFeedbackCardState();
}

class _GiveFeedbackCardState extends ConsumerState<_GiveFeedbackCard> {
  final _strengthsCtrl = TextEditingController();
  final _improvementsCtrl = TextEditingController();
  int _rating = 3;
  String? _toId;
  bool _submitting = false;

  @override
  void dispose() {
    _strengthsCtrl.dispose();
    _improvementsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Give Peer Feedback',
                style: Theme.of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 14),
            TextField(
              decoration: const InputDecoration(
                labelText: 'Employee ID (paste from HR)',
                border: OutlineInputBorder(),
                helperText: 'Ask HR for the employee UUID',
              ),
              onChanged: (v) => setState(() => _toId = v.trim().isEmpty ? null : v.trim()),
            ),
            const SizedBox(height: 14),
            Text('Rating', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 6),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (i) {
                final filled = i < _rating;
                return GestureDetector(
                  onTap: () => setState(() => _rating = i + 1),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      filled ? Icons.star : Icons.star_border,
                      size: 30,
                      color: filled ? Colors.amber : Colors.grey.shade400,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _strengthsCtrl,
              decoration: const InputDecoration(
                labelText: 'Strengths',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _improvementsCtrl,
              decoration: const InputDecoration(
                labelText: 'Areas to Improve',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: (_toId == null || _submitting) ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Submit Feedback'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await ref.read(peerFeedbackNotifierProvider.notifier).submit(
            cycleId: widget.cycle.id,
            toId: _toId!,
            rating: _rating,
            strengths: _strengthsCtrl.text.trim().isEmpty ? null : _strengthsCtrl.text.trim(),
            improvements: _improvementsCtrl.text.trim().isEmpty
                ? null
                : _improvementsCtrl.text.trim(),
          );
      if (mounted) {
        _strengthsCtrl.clear();
        _improvementsCtrl.clear();
        setState(() {
          _toId = null;
          _rating = 3;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Feedback submitted'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _FeedbackCard extends StatelessWidget {
  final PeerFeedback feedback;
  const _FeedbackCard({required this.feedback});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fromName =
        '${feedback.from?['firstName'] ?? ''} ${feedback.from?['lastName'] ?? ''}'.trim();

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: scheme.secondaryContainer,
                  child: Text(
                    fromName.isNotEmpty ? fromName[0].toUpperCase() : '?',
                    style: TextStyle(
                        color: scheme.onSecondaryContainer,
                        fontWeight: FontWeight.w700,
                        fontSize: 13),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(fromName.isEmpty ? 'Anonymous' : fromName,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
                if (feedback.rating != null)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ...List.generate(
                        5,
                        (i) => Icon(
                          i < feedback.rating!.round() ? Icons.star : Icons.star_border,
                          size: 14,
                          color: i < feedback.rating!.round()
                              ? Colors.amber
                              : Colors.grey.shade300,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(feedback.rating!.toStringAsFixed(1),
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 12)),
                    ],
                  ),
              ],
            ),
            if (feedback.strengths != null && feedback.strengths!.isNotEmpty) ...[
              const SizedBox(height: 10),
              _FeedbackSection(
                icon: Icons.thumb_up_alt_outlined,
                color: Colors.green,
                label: 'Strengths',
                text: feedback.strengths!,
              ),
            ],
            if (feedback.improvements != null && feedback.improvements!.isNotEmpty) ...[
              const SizedBox(height: 8),
              _FeedbackSection(
                icon: Icons.trending_up,
                color: Colors.orange,
                label: 'Areas to Improve',
                text: feedback.improvements!,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FeedbackSection extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String text;
  const _FeedbackSection({
    required this.icon,
    required this.color,
    required this.label,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: TextStyle(
                      fontSize: 11, fontWeight: FontWeight.w600, color: color)),
              const SizedBox(height: 2),
              Text(text,
                  style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
            ],
          ),
        ),
      ],
    );
  }
}
