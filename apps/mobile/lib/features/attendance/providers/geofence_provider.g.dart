// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'geofence_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$geofenceConfigHash() => r'315fb13f09793d0f0a840458301c1979f775d35e';

/// Fetches the current employee's assigned office location config from API.
///
/// Copied from [geofenceConfig].
@ProviderFor(geofenceConfig)
final geofenceConfigProvider =
    AutoDisposeFutureProvider<OfficeLocationConfig?>.internal(
  geofenceConfig,
  name: r'geofenceConfigProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$geofenceConfigHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef GeofenceConfigRef = AutoDisposeFutureProviderRef<OfficeLocationConfig?>;
String _$smartPunchNotifierHash() =>
    r'a85da0a71fba143f61e308338a708ceffd2bedb6';

/// Whether Smart Punch-In is enabled — reads from secure storage.
///
/// Copied from [SmartPunchNotifier].
@ProviderFor(SmartPunchNotifier)
final smartPunchNotifierProvider =
    AutoDisposeAsyncNotifierProvider<SmartPunchNotifier, bool>.internal(
  SmartPunchNotifier.new,
  name: r'smartPunchNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$smartPunchNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$SmartPunchNotifier = AutoDisposeAsyncNotifier<bool>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
