// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'asset_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$assetsHash() => r'ceaaaedf504afb51aff0dfaed5f0b1e778b21e71';

/// See also [assets].
@ProviderFor(assets)
final assetsProvider = AutoDisposeFutureProvider<List<Asset>>.internal(
  assets,
  name: r'assetsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$assetsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef AssetsRef = AutoDisposeFutureProviderRef<List<Asset>>;
String _$assetNotifierHash() => r'e84191440d18ba925ecacf4be6936e42c594d353';

/// See also [AssetNotifier].
@ProviderFor(AssetNotifier)
final assetNotifierProvider =
    AutoDisposeNotifierProvider<AssetNotifier, AsyncValue<void>>.internal(
  AssetNotifier.new,
  name: r'assetNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$assetNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$AssetNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
