// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notifications_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$notificationsListHash() => r'becea74126795ab26ccf12afef7cfb72b16248a1';

/// See also [notificationsList].
@ProviderFor(notificationsList)
final notificationsListProvider =
    FutureProvider<List<AppNotification>>.internal(
  notificationsList,
  name: r'notificationsListProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$notificationsListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef NotificationsListRef = FutureProviderRef<List<AppNotification>>;
String _$unreadCountHash() => r'fd41f2df4e469d418ea923032204c59ebb63d1a7';

/// See also [unreadCount].
@ProviderFor(unreadCount)
final unreadCountProvider = FutureProvider<int>.internal(
  unreadCount,
  name: r'unreadCountProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$unreadCountHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef UnreadCountRef = FutureProviderRef<int>;
String _$notificationsNotifierHash() =>
    r'3cb74bd9a5cfb61c4392a2cb0bc602e5fdb9ff6f';

/// See also [NotificationsNotifier].
@ProviderFor(NotificationsNotifier)
final notificationsNotifierProvider = AutoDisposeNotifierProvider<
    NotificationsNotifier, AsyncValue<List<AppNotification>>>.internal(
  NotificationsNotifier.new,
  name: r'notificationsNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$notificationsNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$NotificationsNotifier
    = AutoDisposeNotifier<AsyncValue<List<AppNotification>>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
