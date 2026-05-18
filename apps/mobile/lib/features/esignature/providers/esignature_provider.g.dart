// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'esignature_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$pendingSignaturesHash() => r'7420bf77bd76e03568b8f0b1f067e093d7b505a0';

/// See also [pendingSignatures].
@ProviderFor(pendingSignatures)
final pendingSignaturesProvider =
    AutoDisposeFutureProvider<List<ESignatureRequest>>.internal(
  pendingSignatures,
  name: r'pendingSignaturesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$pendingSignaturesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef PendingSignaturesRef
    = AutoDisposeFutureProviderRef<List<ESignatureRequest>>;
String _$mySignatureRequestsHash() =>
    r'fe76f04d551635f20c354b075200eb627bdb42f4';

/// See also [mySignatureRequests].
@ProviderFor(mySignatureRequests)
final mySignatureRequestsProvider =
    AutoDisposeFutureProvider<List<ESignatureRequest>>.internal(
  mySignatureRequests,
  name: r'mySignatureRequestsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$mySignatureRequestsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef MySignatureRequestsRef
    = AutoDisposeFutureProviderRef<List<ESignatureRequest>>;
String _$eSignatureNotifierHash() =>
    r'85571ffe67b4a024a7b8ec1e42e956b775ba71f4';

/// See also [ESignatureNotifier].
@ProviderFor(ESignatureNotifier)
final eSignatureNotifierProvider =
    AutoDisposeNotifierProvider<ESignatureNotifier, AsyncValue<void>>.internal(
  ESignatureNotifier.new,
  name: r'eSignatureNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$eSignatureNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ESignatureNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
