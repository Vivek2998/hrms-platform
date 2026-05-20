import 'package:dio/dio.dart';
import '../models/chat_model.dart';

class ChatRepository {
  final Dio _dio;
  ChatRepository({required Dio dio}) : _dio = dio;

  Future<List<ChatSession>> getSessions() async {
    final res = await _dio.get('/chat/sessions');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => ChatSession.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ChatSession> createSession() async {
    final res = await _dio.post('/chat/sessions');
    return ChatSession.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<List<ChatMessage>> getMessages(String sessionId) async {
    final res = await _dio.get('/chat/sessions/$sessionId/messages');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ChatMessage> sendMessage(String sessionId, String content) async {
    final res = await _dio.post('/chat/sessions/$sessionId/messages',
        data: {'content': content});
    return ChatMessage.fromJson(res.data['data'] as Map<String, dynamic>);
  }
}
