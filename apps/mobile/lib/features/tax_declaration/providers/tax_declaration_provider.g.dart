// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tax_declaration_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$myTaxDeclarationHash() => r'80ee1b947daca22bc0b208c20a1d68bcec623b11';

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

/// See also [myTaxDeclaration].
@ProviderFor(myTaxDeclaration)
const myTaxDeclarationProvider = MyTaxDeclarationFamily();

/// See also [myTaxDeclaration].
class MyTaxDeclarationFamily extends Family<AsyncValue<TaxDeclaration?>> {
  /// See also [myTaxDeclaration].
  const MyTaxDeclarationFamily();

  /// See also [myTaxDeclaration].
  MyTaxDeclarationProvider call({
    String? financialYear,
  }) {
    return MyTaxDeclarationProvider(
      financialYear: financialYear,
    );
  }

  @override
  MyTaxDeclarationProvider getProviderOverride(
    covariant MyTaxDeclarationProvider provider,
  ) {
    return call(
      financialYear: provider.financialYear,
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
  String? get name => r'myTaxDeclarationProvider';
}

/// See also [myTaxDeclaration].
class MyTaxDeclarationProvider
    extends AutoDisposeFutureProvider<TaxDeclaration?> {
  /// See also [myTaxDeclaration].
  MyTaxDeclarationProvider({
    String? financialYear,
  }) : this._internal(
          (ref) => myTaxDeclaration(
            ref as MyTaxDeclarationRef,
            financialYear: financialYear,
          ),
          from: myTaxDeclarationProvider,
          name: r'myTaxDeclarationProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$myTaxDeclarationHash,
          dependencies: MyTaxDeclarationFamily._dependencies,
          allTransitiveDependencies:
              MyTaxDeclarationFamily._allTransitiveDependencies,
          financialYear: financialYear,
        );

  MyTaxDeclarationProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.financialYear,
  }) : super.internal();

  final String? financialYear;

  @override
  Override overrideWith(
    FutureOr<TaxDeclaration?> Function(MyTaxDeclarationRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MyTaxDeclarationProvider._internal(
        (ref) => create(ref as MyTaxDeclarationRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        financialYear: financialYear,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<TaxDeclaration?> createElement() {
    return _MyTaxDeclarationProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MyTaxDeclarationProvider &&
        other.financialYear == financialYear;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, financialYear.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MyTaxDeclarationRef on AutoDisposeFutureProviderRef<TaxDeclaration?> {
  /// The parameter `financialYear` of this provider.
  String? get financialYear;
}

class _MyTaxDeclarationProviderElement
    extends AutoDisposeFutureProviderElement<TaxDeclaration?>
    with MyTaxDeclarationRef {
  _MyTaxDeclarationProviderElement(super.provider);

  @override
  String? get financialYear =>
      (origin as MyTaxDeclarationProvider).financialYear;
}

String _$allTaxDeclarationsHash() =>
    r'728f8d0515b0c871dd16f64f00eaca0c6c69eb03';

/// See also [allTaxDeclarations].
@ProviderFor(allTaxDeclarations)
const allTaxDeclarationsProvider = AllTaxDeclarationsFamily();

/// See also [allTaxDeclarations].
class AllTaxDeclarationsFamily
    extends Family<AsyncValue<List<TaxDeclaration>>> {
  /// See also [allTaxDeclarations].
  const AllTaxDeclarationsFamily();

  /// See also [allTaxDeclarations].
  AllTaxDeclarationsProvider call({
    String? financialYear,
  }) {
    return AllTaxDeclarationsProvider(
      financialYear: financialYear,
    );
  }

  @override
  AllTaxDeclarationsProvider getProviderOverride(
    covariant AllTaxDeclarationsProvider provider,
  ) {
    return call(
      financialYear: provider.financialYear,
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
  String? get name => r'allTaxDeclarationsProvider';
}

/// See also [allTaxDeclarations].
class AllTaxDeclarationsProvider
    extends AutoDisposeFutureProvider<List<TaxDeclaration>> {
  /// See also [allTaxDeclarations].
  AllTaxDeclarationsProvider({
    String? financialYear,
  }) : this._internal(
          (ref) => allTaxDeclarations(
            ref as AllTaxDeclarationsRef,
            financialYear: financialYear,
          ),
          from: allTaxDeclarationsProvider,
          name: r'allTaxDeclarationsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$allTaxDeclarationsHash,
          dependencies: AllTaxDeclarationsFamily._dependencies,
          allTransitiveDependencies:
              AllTaxDeclarationsFamily._allTransitiveDependencies,
          financialYear: financialYear,
        );

  AllTaxDeclarationsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.financialYear,
  }) : super.internal();

  final String? financialYear;

  @override
  Override overrideWith(
    FutureOr<List<TaxDeclaration>> Function(AllTaxDeclarationsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AllTaxDeclarationsProvider._internal(
        (ref) => create(ref as AllTaxDeclarationsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        financialYear: financialYear,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<TaxDeclaration>> createElement() {
    return _AllTaxDeclarationsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AllTaxDeclarationsProvider &&
        other.financialYear == financialYear;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, financialYear.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin AllTaxDeclarationsRef
    on AutoDisposeFutureProviderRef<List<TaxDeclaration>> {
  /// The parameter `financialYear` of this provider.
  String? get financialYear;
}

class _AllTaxDeclarationsProviderElement
    extends AutoDisposeFutureProviderElement<List<TaxDeclaration>>
    with AllTaxDeclarationsRef {
  _AllTaxDeclarationsProviderElement(super.provider);

  @override
  String? get financialYear =>
      (origin as AllTaxDeclarationsProvider).financialYear;
}

String _$taxDeclarationNotifierHash() =>
    r'e1f42b236b61b1800427bc266940eeb5c1056b0d';

/// See also [TaxDeclarationNotifier].
@ProviderFor(TaxDeclarationNotifier)
final taxDeclarationNotifierProvider = AutoDisposeNotifierProvider<
    TaxDeclarationNotifier, AsyncValue<TaxDeclaration?>>.internal(
  TaxDeclarationNotifier.new,
  name: r'taxDeclarationNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$taxDeclarationNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$TaxDeclarationNotifier
    = AutoDisposeNotifier<AsyncValue<TaxDeclaration?>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
