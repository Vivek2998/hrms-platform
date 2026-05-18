import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/esignature_model.dart';

part 'esignature_repository.g.dart';

@riverpod
ESignatureRepository eSignatureRepository(ESignatureRepositoryRef ref) =>
    ESignatureRepository(dio: ref.read(dioClientProvider));

class ESignatureRepository {
  final Dio _dio;
  ESignatureRepository({required Dio dio}) : _dio = dio;

  Future<List<ESignatureRequest>> getPending() async {
    final res = await _dio.get('/esignatures/pending');
    final data = res.data['data'] as List;
    return data.map((e) => ESignatureRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<ESignatureRequest>> getMyRequests() async {
    final res = await _dio.get('/esignatures/my-requests');
    final data = res.data['data'] as List;
    return data.map((e) => ESignatureRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ESignatureRequest> create({
    required String requestedTo,
    required String documentName,
    required String documentUrl,
    String? message,
  }) async {
    final res = await _dio.post('/esignatures', data: {
      'requestedTo': requestedTo,
      'documentName': documentName,
      'documentUrl': documentUrl,
      if (message != null) 'message': message,
    });
    return ESignatureRequest.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<ESignatureRequest> sign(String id, String signatureImageUrl) async {
    final res = await _dio.patch('/esignatures/$id/sign', data: {
      'signatureImageUrl': signatureImageUrl,
    });
    return ESignatureRequest.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<ESignatureRequest> decline(String id, {String? reason}) async {
    final res = await _dio.patch('/esignatures/$id/decline', data: {
      if (reason != null) 'reason': reason,
    });
    return ESignatureRequest.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> delete(String id) async {
    await _dio.delete('/esignatures/$id');
  }
}
