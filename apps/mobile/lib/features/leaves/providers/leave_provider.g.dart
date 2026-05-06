// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'leave_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$leaveTypesHash() => r'137f526430f6fc35d961ef1c482f71a0c56f5974';

/// See also [leaveTypes].
@ProviderFor(leaveTypes)
final leaveTypesProvider =
    AutoDisposeFutureProvider<List<ApiLeaveType>>.internal(
  leaveTypes,
  name: r'leaveTypesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$leaveTypesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LeaveTypesRef = AutoDisposeFutureProviderRef<List<ApiLeaveType>>;
String _$leaveListHash() => r'b108ef480e6deff7448eba073288ab3c51e4aa72';

/// See also [leaveList].
@ProviderFor(leaveList)
final leaveListProvider =
    AutoDisposeFutureProvider<List<CachedLeaveRequest>>.internal(
  leaveList,
  name: r'leaveListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$leaveListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LeaveListRef = AutoDisposeFutureProviderRef<List<CachedLeaveRequest>>;
String _$leaveBalancesHash() => r'90a7db37c0c3448525344cae57d20a37c4d3455b';

/// See also [leaveBalances].
@ProviderFor(leaveBalances)
final leaveBalancesProvider =
    AutoDisposeFutureProvider<List<LeaveBalance>>.internal(
  leaveBalances,
  name: r'leaveBalancesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$leaveBalancesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LeaveBalancesRef = AutoDisposeFutureProviderRef<List<LeaveBalance>>;
String _$applyLeaveNotifierHash() =>
    r'a9c62237fa78304092fe2cdebf026991ecfb6b62';

/// See also [ApplyLeaveNotifier].
@ProviderFor(ApplyLeaveNotifier)
final applyLeaveNotifierProvider =
    AutoDisposeNotifierProvider<ApplyLeaveNotifier, AsyncValue<void>>.internal(
  ApplyLeaveNotifier.new,
  name: r'applyLeaveNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$applyLeaveNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ApplyLeaveNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
