import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/recruitment_model.dart';

part 'recruitment_repository.g.dart';

@riverpod
RecruitmentRepository recruitmentRepository(RecruitmentRepositoryRef ref) =>
    RecruitmentRepository(dio: ref.read(dioClientProvider));

class RecruitmentRepository {
  final Dio _dio;
  RecruitmentRepository({required Dio dio}) : _dio = dio;

  Future<List<JobPosting>> getJobs({String? status}) async {
    final res = await _dio.get('/recruitment/jobs', queryParameters: {
      if (status != null) 'status': status,
    });
    return (res.data['data'] as List)
        .map((e) => JobPosting.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<JobApplication>> getApplications({String? jobId, String? stage}) async {
    final res = await _dio.get('/recruitment/applications', queryParameters: {
      if (jobId != null) 'jobId': jobId,
      if (stage != null) 'stage': stage,
    });
    return (res.data['data'] as List)
        .map((e) => JobApplication.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> applyForJob(String jobId, {
    required String candidateName,
    required String candidateEmail,
    String? candidatePhone,
    String? resumeUrl,
    String? coverLetter,
  }) async {
    await _dio.post('/recruitment/jobs/$jobId/apply', data: {
      'candidateName': candidateName,
      'candidateEmail': candidateEmail,
      if (candidatePhone != null) 'candidatePhone': candidatePhone,
      if (resumeUrl != null) 'resumeUrl': resumeUrl,
      if (coverLetter != null) 'coverLetter': coverLetter,
    });
  }

  Future<void> updateStage(String applicationId, String stage, {String? notes}) async {
    await _dio.patch('/recruitment/applications/$applicationId/stage', data: {
      'stage': stage,
      if (notes != null) 'notes': notes,
    });
  }
}
