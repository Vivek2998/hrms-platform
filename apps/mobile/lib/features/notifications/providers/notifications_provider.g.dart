// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notifications_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$notificationsListHash() => r'46f3c14d68e7aecdea475367fa5c00ed431ae0b7';

/// See also [notificationsList].
@ProviderFor(notificationsList)
final notificationsListProvider =
    AutoDisposeFutureProvider<List<AppNotification>>.internal(
  notificationsList,
  name: r'notificationsListProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$notificationsListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef NotificationsListRef
    = AutoDisposeFutureProviderRef<List<AppNotification>>;
String _$unreadCountHash() => r'642dc335d5b07f3119cc6dc9fe3f89bdf1b6106c';

/// See also [unreadCount].
@ProviderFor(unreadCount)
final unreadCountProvider = AutoDisposeFutureProvider<int>.internal(
  unreadCount,
  name: r'unreadCountProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$unreadCountHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef UnreadCountRef = AutoDisposeFutureProviderRef<int>;
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
