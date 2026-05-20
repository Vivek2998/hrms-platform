import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/scorecard_model.dart';
import '../data/repositories/scorecard_repository.dart';

final scorecardRepositoryProvider = Provider<ScorecardRepository>(
  (ref) => ScorecardRepository(dio: ref.read(dioClientProvider)),
);

final interviewScorecardsProvider =
    FutureProvider.autoDispose<List<InterviewScorecard>>((ref) {
  return ref.read(scorecardRepositoryProvider).getScorecards();
});
