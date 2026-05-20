import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/chat_model.dart';
import '../data/repositories/chat_repository.dart';
import '../../../core/dio/dio_client.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(dio: ref.read(dioClientProvider));
});

final chatSessionsProvider =
    FutureProvider.autoDispose<List<ChatSession>>((ref) {
  return ref.read(chatRepositoryProvider).getSessions();
});

final activeChatSessionProvider =
    StateProvider.autoDispose<String?>((ref) => null);

final chatMessagesProvider =
    FutureProvider.autoDispose<List<ChatMessage>>((ref) {
  final sessionId = ref.watch(activeChatSessionProvider);
  if (sessionId == null) return Future.value([]);
  return ref.read(chatRepositoryProvider).getMessages(sessionId);
});

class ChatNotifier extends StateNotifier<AsyncValue<void>> {
  final ChatRepository _repo;
  final Ref _ref;

  ChatNotifier(this._repo, this._ref) : super(const AsyncData(null));

  Future<String?> createSession() async {
    state = const AsyncLoading();
    try {
      final session = await _repo.createSession();
      state = const AsyncData(null);
      _ref.invalidate(chatSessionsProvider);
      return session.id;
    } catch (e, st) {
      state = AsyncError(e, st);
      return null;
    }
  }

  Future<bool> sendMessage(String sessionId, String content) async {
    state = const AsyncLoading();
    try {
      await _repo.sendMessage(sessionId, content);
      state = const AsyncData(null);
      _ref.invalidate(chatMessagesProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final chatNotifierProvider =
    StateNotifierProvider.autoDispose<ChatNotifier, AsyncValue<void>>(
        (ref) => ChatNotifier(ref.read(chatRepositoryProvider), ref));
