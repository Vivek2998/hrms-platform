import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/announcement_model.dart';
import '../../../../core/dio/dio_client.dart';

part 'announcements_repository.g.dart';

@riverpod
AnnouncementsRepository announcementsRepository(AnnouncementsRepositoryRef ref) =>
    AnnouncementsRepository(dio: ref.read(dioClientProvider));

class AnnouncementsRepository {
  final Dio _dio;
  const AnnouncementsRepository({required Dio dio}) : _dio = dio;

  Future<List<Announcement>> getAnnouncements({int limit = 10}) async {
    final res = await _dio.get(
      '/announcements',
      queryParameters: {'limit': '$limit', 'page': '1'},
    );
    return (res.data['data'] as List)
        .map((e) => Announcement.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
