import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/performance_model.dart';
import '../data/repositories/performance_repository.dart';

part 'performance_provider.g.dart';

@riverpod
Future<List<PerformanceCycle>> performanceCycles(PerformanceCyclesRef ref) =>
    ref.read(performanceRepositoryProvider).getCycles();

@riverpod
Future<List<PerformanceGoal>> performanceGoals(
  PerformanceGoalsRef ref,
  String cycleId,
) =>
    ref.read(performanceRepositoryProvider).getGoals(cycleId);

@riverpod
Future<List<PerformanceReview>> performanceReviews(
  PerformanceReviewsRef ref,
  String cycleId,
) =>
    ref.read(performanceRepositoryProvider).getReviews(cycleId);

@riverpod
Future<List<PeerFeedback>> peerFeedbackList(
  PeerFeedbackListRef ref, {
  String? cycleId,
}) =>
    ref.read(performanceRepositoryProvider).getPeerFeedback(cycleId: cycleId);

@riverpod
class GoalNotifier extends _$GoalNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> createGoal({
    required String cycleId,
    required String title,
    String? description,
    String? targetValue,
    String? dueDate,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref
        .read(performanceRepositoryProvider)
        .createGoal(
          cycleId: cycleId,
          title: title,
          description: description,
          targetValue: targetValue,
          dueDate: dueDate,
        ));
    ref.invalidate(performanceGoalsProvider);
  }

  Future<void> updateGoal(
    String goalId, {
    String? title,
    String? status,
    int? progress,
    String? dueDate,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref
        .read(performanceRepositoryProvider)
        .updateGoal(goalId, status: status, progress: progress, title: title, dueDate: dueDate));
    ref.invalidate(performanceGoalsProvider);
  }

  Future<void> deleteGoal(String goalId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(performanceRepositoryProvider).deleteGoal(goalId));
    ref.invalidate(performanceGoalsProvider);
  }
}

@riverpod
class ReviewNotifier extends _$ReviewNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> submitSelfReview(
    String reviewId, {
    required int selfRating,
    String? selfComments,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref
        .read(performanceRepositoryProvider)
        .submitSelfReview(reviewId, selfRating: selfRating, selfComments: selfComments));
    ref.invalidate(performanceReviewsProvider);
  }

  Future<void> submitManagerReview(
    String reviewId, {
    required int managerRating,
    String? managerComments,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref
        .read(performanceRepositoryProvider)
        .submitManagerReview(reviewId, managerRating: managerRating, managerComments: managerComments));
    ref.invalidate(performanceReviewsProvider);
  }
}

@riverpod
class PeerFeedbackNotifier extends _$PeerFeedbackNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> submit({
    required String cycleId,
    required String toId,
    int? rating,
    String? strengths,
    String? improvements,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref
        .read(performanceRepositoryProvider)
        .submitPeerFeedback(
          cycleId: cycleId,
          toId: toId,
          rating: rating,
          strengths: strengths,
          improvements: improvements,
        ));
    ref.invalidate(peerFeedbackListProvider);
  }
}
