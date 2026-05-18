import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/lms_model.dart';
import '../data/repositories/lms_repository.dart';

part 'lms_provider.g.dart';

@riverpod
Future<List<LearningCourse>> lmsCourses(LmsCoursesRef ref, {String? search}) =>
    ref.read(lmsRepositoryProvider).getCourses(search: search);

@riverpod
Future<List<CourseEnrollment>> myLmsCourses(MyLmsCoursesRef ref) =>
    ref.read(lmsRepositoryProvider).getMyCourses();

@riverpod
class LmsNotifier extends _$LmsNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> enroll(String courseId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(lmsRepositoryProvider).enroll(courseId));
    if (!state.hasError) {
      ref.invalidate(lmsCoursesProvider);
      ref.invalidate(myLmsCoursesProvider);
    }
  }

  Future<void> updateProgress(String courseId, int progressPct) async {
    state = await AsyncValue.guard(
        () => ref.read(lmsRepositoryProvider).updateProgress(courseId, progressPct));
    if (!state.hasError) {
      ref.invalidate(lmsCoursesProvider);
      ref.invalidate(myLmsCoursesProvider);
    }
  }
}
