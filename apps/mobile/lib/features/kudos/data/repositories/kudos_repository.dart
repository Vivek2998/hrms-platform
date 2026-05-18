import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/kudos_model.dart';

part 'kudos_repository.g.dart';

@riverpod
KudosRepository kudosRepository(KudosRepositoryRef ref) =>
    KudosRepository(dio: ref.read(dioClientProvider));

class KudosRepository {
  final Dio _dio;
  KudosRepository({required Dio dio}) : _dio = dio;

  Future<List<Kudos>> getFeed({String? toEmployeeId, String? fromEmployeeId}) async {
    final res = await _dio.get('/kudos', queryParameters: {
      if (toEmployeeId != null) 'toEmployeeId': toEmployeeId,
      if (fromEmployeeId != null) 'fromEmployeeId': fromEmployeeId,
    });
    final data = res.data['data'] as List;
    return data.map((e) => Kudos.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Kudos>> getMyKudos() async {
    final res = await _dio.get('/kudos/my');
    final data = res.data['data'] as List;
    return data.map((e) => Kudos.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Kudos> giveKudos({
    required String toEmployeeId,
    required String category,
    required String message,
    bool isPublic = true,
  }) async {
    final res = await _dio.post('/kudos', data: {
      'toEmployeeId': toEmployeeId,
      'category': category,
      'message': message,
      'isPublic': isPublic,
    });
    return Kudos.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<Kudos> react(String id, String emoji) async {
    final res = await _dio.patch('/kudos/$id/react', data: {'emoji': emoji});
    return Kudos.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) async {
    await _dio.delete('/kudos/$id');
  }
}
