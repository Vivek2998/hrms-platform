// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'holiday_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$holidaysHash() => r'571b01f8fccb8e8d57fbaaa138823bcf29d933b3';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// See also [holidays].
@ProviderFor(holidays)
const holidaysProvider = HolidaysFamily();

/// See also [holidays].
class HolidaysFamily extends Family<AsyncValue<List<Holiday>>> {
  /// See also [holidays].
  const HolidaysFamily();

  /// See also [holidays].
  HolidaysProvider call(
    int year,
  ) {
    return HolidaysProvider(
      year,
    );
  }

  @override
  HolidaysProvider getProviderOverride(
    covariant HolidaysProvider provider,
  ) {
    return call(
      provider.year,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'holidaysProvider';
}

/// See also [holidays].
class HolidaysProvider extends AutoDisposeFutureProvider<List<Holiday>> {
  /// See also [holidays].
  HolidaysProvider(
    int year,
  ) : this._internal(
          (ref) => holidays(
            ref as HolidaysRef,
            year,
          ),
          from: holidaysProvider,
          name: r'holidaysProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$holidaysHash,
          dependencies: HolidaysFamily._dependencies,
          allTransitiveDependencies: HolidaysFamily._allTransitiveDependencies,
          year: year,
        );

  HolidaysProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.year,
  }) : super.internal();

  final int year;

  @override
  Override overrideWith(
    FutureOr<List<Holiday>> Function(HolidaysRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: HolidaysProvider._internal(
        (ref) => create(ref as HolidaysRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        year: year,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Holiday>> createElement() {
    return _HolidaysProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is HolidaysProvider && other.year == year;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, year.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin HolidaysRef on AutoDisposeFutureProviderRef<List<Holiday>> {
  /// The parameter `year` of this provider.
  int get year;
}

class _HolidaysProviderElement
    extends AutoDisposeFutureProviderElement<List<Holiday>> with HolidaysRef {
  _HolidaysProviderElement(super.provider);

  @override
  int get year => (origin as HolidaysProvider).year;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
