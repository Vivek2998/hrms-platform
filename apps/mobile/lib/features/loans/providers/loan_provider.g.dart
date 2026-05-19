// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'loan_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$loanRequestsHash() => r'bb3acdb2995a465799165a099dab723955f7fff1';

/// See also [loanRequests].
@ProviderFor(loanRequests)
final loanRequestsProvider =
    AutoDisposeFutureProvider<List<LoanRequest>>.internal(
  loanRequests,
  name: r'loanRequestsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$loanRequestsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LoanRequestsRef = AutoDisposeFutureProviderRef<List<LoanRequest>>;
String _$loanNotifierHash() => r'52c0a42822fc6444d18f3de9ec7ead88ddbf4ca7';

/// See also [LoanNotifier].
@ProviderFor(LoanNotifier)
final loanNotifierProvider =
    AutoDisposeNotifierProvider<LoanNotifier, AsyncValue<void>>.internal(
  LoanNotifier.new,
  name: r'loanNotifierProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$loanNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$LoanNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
