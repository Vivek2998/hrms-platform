import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../data/models/survey_model.dart';
import '../providers/survey_provider.dart';
import '../../../../core/theme/app_theme.dart';

class PulseSurveysScreen extends ConsumerWidget {
  const PulseSurveysScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final surveysAsync = ref.watch(surveysProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Pulse Surveys')),
      body: surveysAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (surveys) {
          if (surveys.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.poll_outlined, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 12),
                  Text('No surveys available',
                      style: TextStyle(color: Colors.grey[500], fontSize: 16)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(surveysProvider),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
              itemCount: surveys.length,
              itemBuilder: (_, i) => _SurveyCard(survey: surveys[i]),
            ),
          );
        },
      ),
    );
  }
}

// ── Survey Card ───────────────────────────────────────────────────────────────

class _SurveyCard extends ConsumerWidget {
  final Survey survey;
  const _SurveyCard({required this.survey});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (statusLabel, statusColor) = switch (survey.status) {
      'ACTIVE' => ('Active', AppColors.success),
      'DRAFT' => ('Draft', AppColors.warning),
      _ => ('Closed', Colors.grey),
    };

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
                Expanded(
                  child: Text(survey.title,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 15)),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(30),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(statusLabel,
                      style: TextStyle(
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            if (survey.description != null) ...[
              const SizedBox(height: 6),
              Text(survey.description!,
                  style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                _Chip(Icons.quiz_outlined, '${survey.questionCount} questions'),
                const SizedBox(width: 12),
                _Chip(Icons.people_outline, '${survey.responseCount} responses'),
                if (survey.isAnonymous) ...[
                  const SizedBox(width: 12),
                  _Chip(Icons.visibility_off_outlined, 'Anonymous'),
                ],
              ],
            ),
            if (survey.endsAt != null) ...[
              const SizedBox(height: 6),
              _Chip(Icons.event_outlined,
                  'Ends ${DateFormat('d MMM yyyy').format(survey.endsAt!)}'),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                if (survey.isActive && !survey.hasResponded)
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: () => _openFillSurvey(context, ref, survey.id),
                      icon: const Icon(Icons.edit_note_rounded, size: 18),
                      label: const Text('Take Survey'),
                      style: FilledButton.styleFrom(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  )
                else if (survey.isActive && survey.hasResponded)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: null,
                      icon: const Icon(Icons.check_circle_outline, size: 18),
                      label: const Text('Responded'),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                if (survey.isClosed || survey.responseCount > 0) ...[
                  if (survey.isActive && !survey.hasResponded)
                    const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: survey.isActive && !survey.hasResponded
                          ? null
                          : () => _openResults(context, ref, survey.id,
                              survey.title),
                      icon: const Icon(Icons.bar_chart_rounded, size: 18),
                      label: const Text('Results'),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _openFillSurvey(BuildContext context, WidgetRef ref, String id) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FillSurveySheet(surveyId: id),
    );
  }

  void _openResults(
      BuildContext context, WidgetRef ref, String id, String title) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ResultsSheet(surveyId: id, title: title),
    );
  }
}

// ── Fill Survey Sheet ─────────────────────────────────────────────────────────

class _FillSurveySheet extends ConsumerStatefulWidget {
  final String surveyId;
  const _FillSurveySheet({required this.surveyId});

  @override
  ConsumerState<_FillSurveySheet> createState() => _FillSurveySheetState();
}

class _FillSurveySheetState extends ConsumerState<_FillSurveySheet> {
  final Map<String, int> _ratings = {};
  final Map<String, String> _texts = {};
  final Map<String, String> _choices = {};

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(surveyDetailProvider(widget.surveyId));
    final notifierState = ref.watch(surveyNotifierProvider);

    return DraggableScrollableSheet(
      initialChildSize: 0.92,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  const Text('Fill Survey',
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: detailAsync.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
                data: (detail) => ListView.builder(
                  controller: controller,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                  itemCount: detail.questions.length,
                  itemBuilder: (_, i) =>
                      _QuestionWidget(
                    question: detail.questions[i],
                    index: i,
                    ratingValue: _ratings[detail.questions[i].id],
                    textValue: _texts[detail.questions[i].id],
                    choiceValue: _choices[detail.questions[i].id],
                    onRatingChanged: (v) =>
                        setState(() => _ratings[detail.questions[i].id] = v),
                    onTextChanged: (v) =>
                        setState(() => _texts[detail.questions[i].id] = v),
                    onChoiceChanged: (v) =>
                        setState(() => _choices[detail.questions[i].id] = v),
                  ),
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                  16, 8, 16, MediaQuery.paddingOf(context).bottom + 16),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: notifierState.isLoading
                      ? null
                      : () => _submit(context, ref),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: notifierState.isLoading
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Submit Response',
                          style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit(BuildContext context, WidgetRef ref) async {
    final detailAsync = ref.read(surveyDetailProvider(widget.surveyId));
    final detail = detailAsync.valueOrNull;
    if (detail == null) return;

    final answers = detail.questions.map((q) {
      if (q.isRating5 || q.isRating10) {
        return SurveyAnswer(questionId: q.id, ratingValue: _ratings[q.id]);
      } else if (q.isText) {
        return SurveyAnswer(questionId: q.id, textValue: _texts[q.id]);
      } else {
        return SurveyAnswer(questionId: q.id, textValue: _choices[q.id]);
      }
    }).toList();

    final ok = await ref
        .read(surveyNotifierProvider.notifier)
        .submitResponse(widget.surveyId, answers);

    if (ok && context.mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Response submitted!'),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }
}

// ── Question Widget ───────────────────────────────────────────────────────────

class _QuestionWidget extends StatelessWidget {
  final SurveyQuestion question;
  final int index;
  final int? ratingValue;
  final String? textValue;
  final String? choiceValue;
  final ValueChanged<int> onRatingChanged;
  final ValueChanged<String> onTextChanged;
  final ValueChanged<String> onChoiceChanged;

  const _QuestionWidget({
    required this.question,
    required this.index,
    this.ratingValue,
    this.textValue,
    this.choiceValue,
    required this.onRatingChanged,
    required this.onTextChanged,
    required this.onChoiceChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24, height: 24,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text('${index + 1}',
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(question.text,
                    style: const TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (question.isRating5)
            _RatingRow(max: 5, value: ratingValue, onChanged: onRatingChanged)
          else if (question.isRating10)
            _RatingRow(max: 10, value: ratingValue, onChanged: onRatingChanged)
          else if (question.isText)
            TextField(
              onChanged: onTextChanged,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Your answer…',
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.all(12),
              ),
            )
          else if (question.isMultipleChoice)
            ...question.options.map((opt) {
              final selected = choiceValue == opt;
              return GestureDetector(
                onTap: () => onChoiceChanged(opt),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Container(
                        width: 20, height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: selected ? AppColors.primary : Colors.grey,
                            width: 2,
                          ),
                          color: selected ? AppColors.primary : Colors.transparent,
                        ),
                        child: selected
                            ? const Icon(Icons.check, size: 12, color: Colors.white)
                            : null,
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: Text(opt, style: const TextStyle(fontSize: 13))),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _RatingRow extends StatelessWidget {
  final int max;
  final int? value;
  final ValueChanged<int> onChanged;

  const _RatingRow(
      {required this.max, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      children: List.generate(max, (i) {
        final v = i + 1;
        final selected = value == v;
        return GestureDetector(
          onTap: () => onChanged(v),
          child: Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : AppColors.primaryLight,
              borderRadius: BorderRadius.circular(8),
            ),
            alignment: Alignment.center,
            child: Text('$v',
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : AppColors.primary,
                    fontSize: 13)),
          ),
        );
      }),
    );
  }
}

// ── Results Sheet ─────────────────────────────────────────────────────────────

class _ResultsSheet extends ConsumerWidget {
  final String surveyId;
  final String title;
  const _ResultsSheet({required this.surveyId, required this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resultsAsync = ref.watch(surveyResultsProvider(surveyId));
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(title,
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: resultsAsync.when(
                loading: () =>
                    const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
                data: (results) => ListView(
                  controller: controller,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.people_outline,
                              color: AppColors.primary, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            '${results.totalResponses} total response${results.totalResponses == 1 ? '' : 's'}',
                            style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...results.results.map((r) => _ResultItem(result: r)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultItem extends StatelessWidget {
  final QuestionResult result;
  const _ResultItem({required this.result});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(result.questionText,
              style: const TextStyle(
                  fontWeight: FontWeight.w600, fontSize: 13)),
          const SizedBox(height: 8),
          if (result.avg != null) ...[
            Row(
              children: [
                const Icon(Icons.star_rounded,
                    color: Color(0xFFF59E0B), size: 18),
                const SizedBox(width: 4),
                Text(result.avg!.toStringAsFixed(1),
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, fontSize: 20)),
                Text(' / ${result.type == 'RATING_5' ? 5 : 10}',
                    style: TextStyle(
                        color: Colors.grey[500], fontSize: 13)),
                const Spacer(),
                Text('${result.count} responses',
                    style: TextStyle(
                        color: Colors.grey[500], fontSize: 12)),
              ],
            ),
          ] else ...[
            ...result.responses.take(5).map((r) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ',
                          style: TextStyle(color: Colors.grey)),
                      Expanded(
                          child: Text(r,
                              style: const TextStyle(fontSize: 12))),
                    ],
                  ),
                )),
            if (result.responses.length > 5)
              Text('+${result.responses.length - 5} more',
                  style: TextStyle(
                      color: Colors.grey[500], fontSize: 12)),
          ],
        ],
      ),
    );
  }
}

// ── Chip ──────────────────────────────────────────────────────────────────────

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Chip(this.icon, this.label);

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.grey[500]),
          const SizedBox(width: 3),
          Text(label,
              style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        ],
      );
}
