import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/notification_model.dart';
import '../data/repositories/notifications_repository.dart';

part 'notifications_provider.g.dart';

@riverpod
Future<List<AppNotification>> notificationsList(NotificationsListRef ref) =>
    ref.read(notificationsRepositoryProvider).getNotifications();

@riverpod
Future<int> unreadCount(UnreadCountRef ref) =>
    ref.read(notificationsRepositoryProvider).getUnreadCount();

@riverpod
class NotificationsNotifier extends _$NotificationsNotifier {
  @override
  AsyncValue<List<AppNotification>> build() => const AsyncValue.loading();

  Future<void> load() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(notificationsRepositoryProvider).getNotifications(),
    );
  }

  Future<void> markRead(String id) async {
    await ref.read(notificationsRepositoryProvider).markRead(id);
    state = state.whenData(
      (list) => list
          .map((n) => n.id == id
              ? n.copyWith(isRead: true, readAt: DateTime.now())
              : n)
          .toList(),
    );
    ref.invalidate(unreadCountProvider);
  }

  Future<void> markAllRead() async {
    await ref.read(notificationsRepositoryProvider).markAllRead();
    state = state.whenData(
      (list) => list
          .map((n) => n.copyWith(isRead: true, readAt: DateTime.now()))
          .toList(),
    );
    ref.invalidate(unreadCountProvider);
  }
}
