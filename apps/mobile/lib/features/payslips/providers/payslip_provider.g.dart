// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payslip_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$payslipListHash() => r'f706c9b8ce0384e05bae9000c6dcdf64edbd045a';

/// See also [payslipList].
@ProviderFor(payslipList)
final payslipListProvider =
    AutoDisposeFutureProvider<List<CachedPayslip>>.internal(
  payslipList,
  name: r'payslipListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$payslipListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef PayslipListRef = AutoDisposeFutureProviderRef<List<CachedPayslip>>;
String _$payslipDetailHash() => r'add5c722ab05622ec060cfe53858cf9a9f917451';

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
class PayslipDetailProvider
    extends AutoDisposeFutureProvider<Map<String, dynamic>> {
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
  AutoDisposeFutureProviderElement<Map<String, dynamic>> createElement() {
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

mixin PayslipDetailRef on AutoDisposeFutureProviderRef<Map<String, dynamic>> {
  /// The parameter `payslipId` of this provider.
  String get payslipId;
}

class _PayslipDetailProviderElement
    extends AutoDisposeFutureProviderElement<Map<String, dynamic>>
    with PayslipDetailRef {
  _PayslipDetailProviderElement(super.provider);

  @override
  String get payslipId => (origin as PayslipDetailProvider).payslipId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
