import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/survey_model.dart';
import '../data/repositories/survey_repository.dart';

part 'survey_provider.g.dart';

@riverpod
Future<List<Survey>> surveys(SurveysRef ref) =>
    ref.read(surveyRepositoryProvider).getSurveys();

@riverpod
Future<SurveyDetail> surveyDetail(SurveyDetailRef ref, String id) =>
    ref.read(surveyRepositoryProvider).getSurveyDetail(id);

@riverpod
Future<SurveyResults> surveyResults(SurveyResultsRef ref, String id) =>
    ref.read(surveyRepositoryProvider).getSurveyResults(id);

@riverpod
class SurveyNotifier extends _$SurveyNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<bool> submitResponse(String surveyId, List<SurveyAnswer> answers) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(surveyRepositoryProvider).submitResponse(surveyId, answers));
    if (!state.hasError) {
      ref.invalidate(surveysProvider);
      ref.invalidate(surveyDetailProvider(surveyId));
      return true;
    }
    return false;
  }

  Future<void> updateStatus(String surveyId, String status) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(surveyRepositoryProvider).updateStatus(surveyId, status));
    if (!state.hasError) ref.invalidate(surveysProvider);
  }
}
