// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'leave_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$leaveTypesHash() => r'1be946e16f6404f6ee227dd1fd35037988c1218d';

/// See also [leaveTypes].
@ProviderFor(leaveTypes)
final leaveTypesProvider = FutureProvider<List<ApiLeaveType>>.internal(
  leaveTypes,
  name: r'leaveTypesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$leaveTypesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LeaveTypesRef = FutureProviderRef<List<ApiLeaveType>>;
String _$leaveListHash() => r'bc7bdb1c94b36c98230fefcc1f293aa11e27e50f';

/// See also [leaveList].
@ProviderFor(leaveList)
final leaveListProvider = FutureProvider<List<CachedLeaveRequest>>.internal(
  leaveList,
  name: r'leaveListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$leaveListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LeaveListRef = FutureProviderRef<List<CachedLeaveRequest>>;
String _$leaveBalancesHash() => r'864fe23feab3d5b849ef628f5edc85626f5601c2';

/// See also [leaveBalances].
@ProviderFor(leaveBalances)
final leaveBalancesProvider = FutureProvider<List<LeaveBalance>>.internal(
  leaveBalances,
  name: r'leaveBalancesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$leaveBalancesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LeaveBalancesRef = FutureProviderRef<List<LeaveBalance>>;
String _$pendingLeavesHash() => r'7d14e78d4ed3e3222eaee0f8ed57155e69262202';

/// See also [pendingLeaves].
@ProviderFor(pendingLeaves)
final pendingLeavesProvider =
    FutureProvider<List<PendingLeaveRequest>>.internal(
  pendingLeaves,
  name: r'pendingLeavesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$pendingLeavesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef PendingLeavesRef = FutureProviderRef<List<PendingLeaveRequest>>;
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
