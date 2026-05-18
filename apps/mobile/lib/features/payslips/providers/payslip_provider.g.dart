// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payslip_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$payslipListHash() => r'0434aa9d1e67277357e75118294cd81f4182cc6c';

/// See also [payslipList].
@ProviderFor(payslipList)
final payslipListProvider = FutureProvider<List<CachedPayslip>>.internal(
  payslipList,
  name: r'payslipListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$payslipListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef PayslipListRef = FutureProviderRef<List<CachedPayslip>>;
String _$payslipDetailHash() => r'151ea6cb89ae437e7312210d6f35e074c337e365';

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

/// See also [payslipDetail].
@ProviderFor(payslipDetail)
const payslipDetailProvider = PayslipDetailFamily();

/// See also [payslipDetail].
class PayslipDetailFamily extends Family<AsyncValue<Map<String, dynamic>>> {
  /// See also [payslipDetail].
  const PayslipDetailFamily();

  /// See also [payslipDetail].
  PayslipDetailProvider call(
    String payslipId,
  ) {
    return PayslipDetailProvider(
      payslipId,
    );
  }

  @override
  PayslipDetailProvider getProviderOverride(
    covariant PayslipDetailProvider provider,
  ) {
    return call(
      provider.payslipId,
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
  String? get name => r'payslipDetailProvider';
}

/// See also [payslipDetail].
class PayslipDetailProvider extends FutureProvider<Map<String, dynamic>> {
  /// See also [payslipDetail].
  PayslipDetailProvider(
    String payslipId,
  ) : this._internal(
          (ref) => payslipDetail(
            ref as PayslipDetailRef,
            payslipId,
          ),
          from: payslipDetailProvider,
          name: r'payslipDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$payslipDetailHash,
          dependencies: PayslipDetailFamily._dependencies,
          allTransitiveDependencies:
              PayslipDetailFamily._allTransitiveDependencies,
          payslipId: payslipId,
        );

  PayslipDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.payslipId,
  }) : super.internal();

  final String payslipId;

  @override
  Override overrideWith(
    FutureOr<Map<String, dynamic>> Function(PayslipDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PayslipDetailProvider._internal(
        (ref) => create(ref as PayslipDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        payslipId: payslipId,
      ),
    );
  }

  @override
  FutureProviderElement<Map<String, dynamic>> createElement() {
    return _PayslipDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PayslipDetailProvider && other.payslipId == payslipId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, payslipId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PayslipDetailRef on FutureProviderRef<Map<String, dynamic>> {
  /// The parameter `payslipId` of this provider.
  String get payslipId;
}

class _PayslipDetailProviderElement
    extends FutureProviderElement<Map<String, dynamic>> with PayslipDetailRef {
  _PayslipDetailProviderElement(super.provider);

  @override
  String get payslipId => (origin as PayslipDetailProvider).payslipId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
