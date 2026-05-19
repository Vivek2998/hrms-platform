// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'travel_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$travelRequestsHash() => r'fd6773bd1a559d99e3f615d6b6e80ca44045faa9';

/// See also [travelRequests].
@ProviderFor(travelRequests)
final travelRequestsProvider =
    AutoDisposeFutureProvider<List<TravelRequest>>.internal(
  travelRequests,
  name: r'travelRequestsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$travelRequestsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef TravelRequestsRef = AutoDisposeFutureProviderRef<List<TravelRequest>>;
String _$travelNotifierHash() => r'f932225b4a9f2189e41b7dc6562031dd40068de7';

/// See also [TravelNotifier].
@ProviderFor(TravelNotifier)
final travelNotifierProvider =
    AutoDisposeNotifierProvider<TravelNotifier, AsyncValue<void>>.internal(
  TravelNotifier.new,
  name: r'travelNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$travelNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$TravelNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
