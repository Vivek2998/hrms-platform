import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/lms_model.dart';

part 'lms_repository.g.dart';

@riverpod
LmsRepository lmsRepository(LmsRepositoryRef ref) =>
    LmsRepository(dio: ref.read(dioClientProvider));

class LmsRepository {
  final Dio _dio;
  LmsRepository({required Dio dio}) : _dio = dio;

  Future<List<LearningCourse>> getCourses({String? search}) async {
    final res = await _dio.get('/lms/courses', queryParameters: {
      if (search != null && search.isNotEmpty) 'search': search,
    });
    final data = res.data['data'] as List;
    return data.map((e) => LearningCourse.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<CourseEnrollment>> getMyCourses() async {
    final res = await _dio.get('/lms/my-courses');
    final data = res.data['data'] as List;
    return data.map((e) => CourseEnrollment.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> enroll(String courseId) async {
    await _dio.post('/lms/courses/$courseId/enroll');
  }

  Future<void> updateProgress(String courseId, int progressPct) async {
    await _dio.patch('/lms/courses/$courseId/progress', data: {'progressPct': progressPct});
  }

  Future<LearningCourse> createCourse({
    required String title,
    String? description,
    String category = 'General',
    String level = 'BEGINNER',
    int durationMinutes = 0,
    String? externalUrl,
  }) async {
    final res = await _dio.post('/lms/courses', data: {
      'title': title,
      if (description != null) 'description': description,
      'category': category,
      'level': level,
      'durationMinutes': durationMinutes,
      if (externalUrl != null) 'externalUrl': externalUrl,
    });
    return LearningCourse.fromJson(res.data['data'] as Map<String, dynamic>);
  }
}
