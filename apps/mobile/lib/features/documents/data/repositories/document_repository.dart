import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/document_model.dart';
import '../../../../core/dio/dio_client.dart';
import '../../../../core/storage/secure_storage.dart';

part 'document_repository.g.dart';

@riverpod
DocumentRepository documentRepository(DocumentRepositoryRef ref) =>
    DocumentRepository(
      dio: ref.read(dioClientProvider),
      storage: ref.read(secureStorageProvider),
    );

class DocumentRepository {
  final Dio _dio;
  final SecureStorageService _storage;

  const DocumentRepository({required Dio dio, required SecureStorageService storage})
      : _dio = dio,
        _storage = storage;

  Future<List<AppDocument>> getMyDocuments() async {
    final empId = await _storage.getEmployeeId();
    if (empId == null) return [];

    final res = await _dio.get(
      '/documents',
      queryParameters: {'employeeId': empId},
    );
    return (res.data['data'] as List)
        .map((e) => AppDocument.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
