import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/profile_model.dart';
import '../data/repositories/profile_repository.dart';

part 'profile_provider.g.dart';

@riverpod
Future<EmployeeProfile> myProfile(MyProfileRef ref) =>
    ref.read(profileRepositoryProvider).getMyProfile();

@riverpod
class AvatarUploadNotifier extends _$AvatarUploadNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> upload(String filePath) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(profileRepositoryProvider);
      final employeeId = await repo.getCurrentEmployeeId();
      if (employeeId == null) throw Exception('Not logged in');
      final url = await repo.uploadAvatar(filePath);
      await repo.updateAvatarUrl(employeeId, url);
    });
  }
}
