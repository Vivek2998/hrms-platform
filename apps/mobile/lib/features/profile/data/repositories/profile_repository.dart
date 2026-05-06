import 'package:dio/dio.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../../../../core/isar/isar_service.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../auth/data/models/auth_model.dart';

part 'profile_repository.g.dart';

@riverpod
ProfileRepository profileRepository(ProfileRepositoryRef ref) => ProfileRepository(
      dio: ref.read(dioClientProvider),
      storage: ref.read(secureStorageProvider),
      isar: IsarService.instance,
    );

class ProfileRepository {
  final Dio _dio;
  final SecureStorageService _storage;
  final Isar _isar;

  ProfileRepository({
    required Dio dio,
    required SecureStorageService storage,
    required Isar isar,
  })  : _dio = dio,
        _storage = storage,
        _isar = isar;

  /// Upload an image file to Cloudinary via the API and return the URL.
  Future<String> uploadAvatar(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: 'avatar.jpg'),
    });
    final res = await _dio.post<Map<String, dynamic>>(
      '/upload?folder=avatars',
      data: formData,
    );
    return (res.data!['data'] as Map<String, dynamic>)['url'] as String;
  }

  /// Update the employee's avatarUrl on the server and in the local Isar cache.
  Future<void> updateAvatarUrl(String employeeId, String url) async {
    await _dio.patch('/employees/$employeeId', data: {'avatarUrl': url});

    final cached = await _isar.cachedUsers
        .filter()
        .employeeIdEqualTo(employeeId)
        .findFirst();
    if (cached != null) {
      cached.avatarUrl = url;
      await _isar.writeTxn(() => _isar.cachedUsers.put(cached));
    }
  }

  Future<String?> getCurrentEmployeeId() => _storage.getEmployeeId();
}
