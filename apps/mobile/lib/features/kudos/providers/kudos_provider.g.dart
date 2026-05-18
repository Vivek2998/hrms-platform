// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'kudos_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$kudosFeedHash() => r'e89ad65852af0c55f86c3dce1d94cacb1bae4297';

/// See also [kudosFeed].
@ProviderFor(kudosFeed)
final kudosFeedProvider = AutoDisposeFutureProvider<List<Kudos>>.internal(
  kudosFeed,
  name: r'kudosFeedProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$kudosFeedHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef KudosFeedRef = AutoDisposeFutureProviderRef<List<Kudos>>;
String _$myKudosHash() => r'dfc9cb7b56802a8fa3967be3a18538ed4b6a7a4f';

/// See also [myKudos].
@ProviderFor(myKudos)
final myKudosProvider = AutoDisposeFutureProvider<List<Kudos>>.internal(
  myKudos,
  name: r'myKudosProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$myKudosHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef MyKudosRef = AutoDisposeFutureProviderRef<List<Kudos>>;
String _$kudosNotifierHash() => r'f6f8f98b12501ecc6a1456d61031354d7317d0b4';

/// See also [KudosNotifier].
@ProviderFor(KudosNotifier)
final kudosNotifierProvider =
    AutoDisposeNotifierProvider<KudosNotifier, AsyncValue<void>>.internal(
  KudosNotifier.new,
  name: r'kudosNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$kudosNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$KudosNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
