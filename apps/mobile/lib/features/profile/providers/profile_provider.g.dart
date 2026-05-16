// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$myProfileHash() => r'ae7b04a44536b6b9dd949b33cf493267bb044b46';

/// See also [myProfile].
@ProviderFor(myProfile)
final myProfileProvider = AutoDisposeFutureProvider<EmployeeProfile>.internal(
  myProfile,
  name: r'myProfileProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$myProfileHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef MyProfileRef = AutoDisposeFutureProviderRef<EmployeeProfile>;
String _$avatarUploadNotifierHash() =>
    r'21a7fa66caa3ee295710ef127f457bf8e8f34ed6';

/// See also [AvatarUploadNotifier].
@ProviderFor(AvatarUploadNotifier)
final avatarUploadNotifierProvider = AutoDisposeNotifierProvider<
    AvatarUploadNotifier, AsyncValue<void>>.internal(
  AvatarUploadNotifier.new,
  name: r'avatarUploadNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$avatarUploadNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$AvatarUploadNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
