import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/resume_model.dart';
import '../data/repositories/resume_repository.dart';

final resumeRepositoryProvider = Provider<ResumeRepository>(
  (ref) => ResumeRepository(dio: ref.read(dioClientProvider)),
);

final parsedResumesProvider =
    FutureProvider.autoDispose<List<ParsedResume>>((ref) {
  return ref.read(resumeRepositoryProvider).getResumes();
});
