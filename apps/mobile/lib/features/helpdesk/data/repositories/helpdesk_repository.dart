import 'package:dio/dio.dart';
import '../models/helpdesk_model.dart';

class HelpdeskRepository {
  final Dio _dio;
  HelpdeskRepository({required Dio dio}) : _dio = dio;

  Future<List<HelpdeskTicket>> getTickets({String? status}) async {
    final res = await _dio.get(
      '/helpdesk/tickets',
      queryParameters: status != null ? {'status': status} : null,
    );
    final list = res.data['data'] as List<dynamic>;
    return list
        .map((e) =>
            HelpdeskTicket.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<HelpdeskTicketDetail> getTicket(String id) async {
    final res = await _dio.get('/helpdesk/tickets/$id');
    return HelpdeskTicketDetail.fromJson(
        res.data['data'] as Map<String, dynamic>);
  }

  Future<HelpdeskTicket> createTicket({
    required String subject,
    required String description,
    required String category,
    required String priority,
  }) async {
    final res = await _dio.post('/helpdesk/tickets', data: {
      'subject': subject,
      'description': description,
      'category': category,
      'priority': priority,
    });
    return HelpdeskTicket.fromJson(
        res.data['data'] as Map<String, dynamic>);
  }

  Future<void> addComment({
    required String ticketId,
    required String body,
    bool isInternal = false,
  }) async {
    await _dio.post(
      '/helpdesk/tickets/$ticketId/comments',
      data: {'body': body, 'isInternal': isInternal},
    );
  }
}
