import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/asset_model.dart';

part 'asset_repository.g.dart';

@riverpod
AssetRepository assetRepository(AssetRepositoryRef ref) =>
    AssetRepository(dio: ref.read(dioClientProvider));

class AssetRepository {
  final Dio _dio;
  AssetRepository({required Dio dio}) : _dio = dio;

  Future<List<Asset>> getAssets() async {
    final res = await _dio.get('/assets');
    return (res.data['data'] as List)
        .map((e) => Asset.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> assignAsset(String id, String employeeId) async {
    await _dio.post('/assets/$id/assign', data: {'employeeId': employeeId});
  }

  Future<void> returnAsset(String id) async {
    await _dio.post('/assets/$id/return', data: {});
  }
}
