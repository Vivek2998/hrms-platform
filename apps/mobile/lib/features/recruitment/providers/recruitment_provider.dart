import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/recruitment_model.dart';
import '../data/repositories/recruitment_repository.dart';

part 'recruitment_provider.g.dart';

@riverpod
Future<List<JobPosting>> jobPostings(JobPostingsRef ref, {String? status}) =>
    ref.read(recruitmentRepositoryProvider).getJobs(status: status);

@riverpod
Future<List<JobApplication>> jobApplications(
        JobApplicationsRef ref, {String? jobId, String? stage}) =>
    ref.read(recruitmentRepositoryProvider)
        .getApplications(jobId: jobId, stage: stage);

@riverpod
class RecruitmentNotifier extends _$RecruitmentNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<bool> apply(String jobId, {
    required String candidateName,
    required String candidateEmail,
    String? candidatePhone,
    String? resumeUrl,
    String? coverLetter,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() =>
        ref.read(recruitmentRepositoryProvider).applyForJob(
          jobId,
          candidateName: candidateName,
          candidateEmail: candidateEmail,
          candidatePhone: candidatePhone,
          resumeUrl: resumeUrl,
          coverLetter: coverLetter,
        ));
    if (!state.hasError) {
      ref.invalidate(jobPostingsProvider);
      return true;
    }
    return false;
  }

  Future<void> updateStage(String applicationId, String stage,
      {String? notes}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() =>
        ref.read(recruitmentRepositoryProvider)
            .updateStage(applicationId, stage, notes: notes));
    if (!state.hasError) ref.invalidate(jobApplicationsProvider);
  }
}
