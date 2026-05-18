import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/performance_model.dart';
import '../../../../core/dio/dio_client.dart';

part 'performance_repository.g.dart';

@riverpod
PerformanceRepository performanceRepository(PerformanceRepositoryRef ref) =>
    PerformanceRepository(dio: ref.read(dioClientProvider));

class PerformanceRepository {
  final Dio _dio;
  PerformanceRepository({required Dio dio}) : _dio = dio;

  Future<List<PerformanceCycle>> getCycles() async {
    final res = await _dio.get('/performance/cycles');
    return (res.data['data'] as List)
        .map((e) => PerformanceCycle.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PerformanceCycle> createCycle({
    required String name,
    required String frequency,
    required String startDate,
    required String endDate,
  }) async {
    final res = await _dio.post('/performance/cycles', data: {
      'name': name,
      'frequency': frequency,
      'startDate': startDate,
      'endDate': endDate,
    });
    return PerformanceCycle.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> updateCycleStatus(String cycleId, String status) async {
    await _dio.patch('/performance/cycles/$cycleId', data: {'status': status});
  }

  Future<List<PerformanceGoal>> getGoals(String cycleId) async {
    final res = await _dio.get('/performance/cycles/$cycleId/goals');
    return (res.data['data'] as List)
        .map((e) => PerformanceGoal.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<PerformanceGoal> createGoal({
    required String cycleId,
    required String title,
    String? description,
    String? targetValue,
    String? dueDate,
  }) async {
    final res = await _dio.post('/performance/goals', data: {
      'cycleId': cycleId,
      'title': title,
      if (description != null) 'description': description,
      if (targetValue != null) 'targetValue': targetValue,
      if (dueDate != null) 'dueDate': dueDate,
    });
    return PerformanceGoal.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> updateGoal(
    String goalId, {
    String? title,
    String? description,
    String? targetValue,
    String? status,
    int? progress,
    String? dueDate,
  }) async {
    await _dio.patch('/performance/goals/$goalId', data: {
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (targetValue != null) 'targetValue': targetValue,
      if (status != null) 'status': status,
      if (progress != null) 'progress': progress,
      if (dueDate != null) 'dueDate': dueDate,
    });
  }

  Future<void> deleteGoal(String goalId) async {
    await _dio.delete('/performance/goals/$goalId');
  }

  Future<List<PerformanceReview>> getReviews(String cycleId) async {
    final res = await _dio.get('/performance/cycles/$cycleId/reviews');
    return (res.data['data'] as List)
        .map((e) => PerformanceReview.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> submitSelfReview(
    String reviewId, {
    required int selfRating,
    String? selfComments,
  }) async {
    await _dio.patch('/performance/reviews/$reviewId/self', data: {
      'selfRating': selfRating,
      if (selfComments != null) 'selfComments': selfComments,
    });
  }

  Future<void> submitManagerReview(
    String reviewId, {
    required int managerRating,
    String? managerComments,
  }) async {
    await _dio.patch('/performance/reviews/$reviewId/manager', data: {
      'managerRating': managerRating,
      if (managerComments != null) 'managerComments': managerComments,
    });
  }

  Future<List<PeerFeedback>> getPeerFeedback({String? cycleId}) async {
    final res = await _dio.get('/performance/peer-feedback',
        queryParameters: {if (cycleId != null) 'cycleId': cycleId});
    return (res.data['data'] as List)
        .map((e) => PeerFeedback.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> submitPeerFeedback({
    required String cycleId,
    required String toId,
    int? rating,
    String? strengths,
    String? improvements,
  }) async {
    await _dio.post('/performance/peer-feedback', data: {
      'cycleId': cycleId,
      'toId': toId,
      if (rating != null) 'rating': rating,
      if (strengths != null) 'strengths': strengths,
      if (improvements != null) 'improvements': improvements,
    });
  }
}
