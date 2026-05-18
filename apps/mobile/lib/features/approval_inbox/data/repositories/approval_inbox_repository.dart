import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../../../core/dio/dio_client.dart';
import '../models/approval_inbox_model.dart';

part 'approval_inbox_repository.g.dart';

@riverpod
ApprovalInboxRepository approvalInboxRepository(ApprovalInboxRepositoryRef ref) =>
    ApprovalInboxRepository(dio: ref.read(dioClientProvider));

class ApprovalInboxRepository {
  final Dio _dio;
  ApprovalInboxRepository({required Dio dio}) : _dio = dio;

  Future<List<ApprovalInboxItem>> getItems({String? type}) async {
    final res = await _dio.get('/approval-inbox', queryParameters: {
      if (type != null) 'type': type,
    });
    final data = res.data['data'] as List;
    return data.map((e) => ApprovalInboxItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<int> getCount() async {
    final res = await _dio.get('/approval-inbox/count');
    return (res.data['data']['count'] as num).toInt();
  }

  Future<void> approveLeave(String id) async {
    await _dio.patch('/leaves/$id/approve', data: {'action': 'APPROVED'});
  }

  Future<void> rejectLeave(String id) async {
    await _dio.patch('/leaves/$id/approve', data: {'action': 'REJECTED'});
  }

  Future<void> approveExpense(String id) async {
    await _dio.patch('/expenses/$id/review', data: {'action': 'APPROVE'});
  }

  Future<void> rejectExpense(String id) async {
    await _dio.patch('/expenses/$id/review', data: {'action': 'REJECT'});
  }

  Future<void> approveRegularisation(String id) async {
    await _dio.patch('/regularisations/$id/review', data: {'action': 'APPROVED'});
  }

  Future<void> rejectRegularisation(String id) async {
    await _dio.patch('/regularisations/$id/review', data: {'action': 'REJECTED'});
  }

  Future<void> approveCompOff(String id) async {
    await _dio.patch('/comp-offs/$id/review', data: {'action': 'APPROVED'});
  }

  Future<void> rejectCompOff(String id) async {
    await _dio.patch('/comp-offs/$id/review', data: {'action': 'REJECTED'});
  }
}
