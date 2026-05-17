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
String _$pendingLeavesHash() => r'2b9a7250620c0323072c3435dcb88b8a2e3a074b';

/// See also [pendingLeaves].
@ProviderFor(pendingLeaves)
final pendingLeavesProvider =
    AutoDisposeFutureProvider<List<PendingLeaveRequest>>.internal(
  pendingLeaves,
  name: r'pendingLeavesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$pendingLeavesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef PendingLeavesRef
    = AutoDisposeFutureProviderRef<List<PendingLeaveRequest>>;
String _$leaveApprovalNotifierHash() =>
    r'523d7d10c6c8e38460e83ba19d3511c42d5cfd47';

/// See also [LeaveApprovalNotifier].
@ProviderFor(LeaveApprovalNotifier)
final leaveApprovalNotifierProvider = AutoDisposeNotifierProvider<
    LeaveApprovalNotifier, AsyncValue<void>>.internal(
  LeaveApprovalNotifier.new,
  name: r'leaveApprovalNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$leaveApprovalNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$LeaveApprovalNotifier = AutoDisposeNotifier<AsyncValue<void>>;
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
String _$cancelLeaveNotifierHash() =>
    r'51fedf037682b660fafbb87b2c2ee36aa83dda54';

/// See also [CancelLeaveNotifier].
@ProviderFor(CancelLeaveNotifier)
final cancelLeaveNotifierProvider =
    AutoDisposeNotifierProvider<CancelLeaveNotifier, AsyncValue<void>>.internal(
  CancelLeaveNotifier.new,
  name: r'cancelLeaveNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$cancelLeaveNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$CancelLeaveNotifier = AutoDisposeNotifier<AsyncValue<void>>;
String _$applyLeaveBehalfNotifierHash() =>
    r'473c8ed80be32646765fe58bef3fe2510ffdc45a';

/// See also [ApplyLeaveBehalfNotifier].
@ProviderFor(ApplyLeaveBehalfNotifier)
final applyLeaveBehalfNotifierProvider = AutoDisposeNotifierProvider<
    ApplyLeaveBehalfNotifier, AsyncValue<void>>.internal(
  ApplyLeaveBehalfNotifier.new,
  name: r'applyLeaveBehalfNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$applyLeaveBehalfNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ApplyLeaveBehalfNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
