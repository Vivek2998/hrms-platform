// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'expense_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$myExpensesHash() => r'1e5696855e3d0bb0eabbe948e6756dd565ed1d15';

/// See also [myExpenses].
@ProviderFor(myExpenses)
final myExpensesProvider =
    AutoDisposeFutureProvider<List<ExpenseClaim>>.internal(
  myExpenses,
  name: r'myExpensesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$myExpensesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef MyExpensesRef = AutoDisposeFutureProviderRef<List<ExpenseClaim>>;
String _$allExpensesHash() => r'da4b32a07ec40ce7cd76f2f05047098e9aaa8893';

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

/// See also [allExpenses].
@ProviderFor(allExpenses)
const allExpensesProvider = AllExpensesFamily();

/// See also [allExpenses].
class AllExpensesFamily extends Family<AsyncValue<List<ExpenseClaim>>> {
  /// See also [allExpenses].
  const AllExpensesFamily();

  /// See also [allExpenses].
  AllExpensesProvider call({
    String? status,
  }) {
    return AllExpensesProvider(
      status: status,
    );
  }

  @override
  AllExpensesProvider getProviderOverride(
    covariant AllExpensesProvider provider,
  ) {
    return call(
      status: provider.status,
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
  String? get name => r'allExpensesProvider';
}

/// See also [allExpenses].
class AllExpensesProvider
    extends AutoDisposeFutureProvider<List<ExpenseClaim>> {
  /// See also [allExpenses].
  AllExpensesProvider({
    String? status,
  }) : this._internal(
          (ref) => allExpenses(
            ref as AllExpensesRef,
            status: status,
          ),
          from: allExpensesProvider,
          name: r'allExpensesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$allExpensesHash,
          dependencies: AllExpensesFamily._dependencies,
          allTransitiveDependencies:
              AllExpensesFamily._allTransitiveDependencies,
          status: status,
        );

  AllExpensesProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.status,
  }) : super.internal();

  final String? status;

  @override
  Override overrideWith(
    FutureOr<List<ExpenseClaim>> Function(AllExpensesRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AllExpensesProvider._internal(
        (ref) => create(ref as AllExpensesRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        status: status,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<ExpenseClaim>> createElement() {
    return _AllExpensesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AllExpensesProvider && other.status == status;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, status.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin AllExpensesRef on AutoDisposeFutureProviderRef<List<ExpenseClaim>> {
  /// The parameter `status` of this provider.
  String? get status;
}

class _AllExpensesProviderElement
    extends AutoDisposeFutureProviderElement<List<ExpenseClaim>>
    with AllExpensesRef {
  _AllExpensesProviderElement(super.provider);

  @override
  String? get status => (origin as AllExpensesProvider).status;
}

String _$expenseNotifierHash() => r'accb11e844612a0be18a588e522b0692fb025d46';

/// See also [ExpenseNotifier].
@ProviderFor(ExpenseNotifier)
final expenseNotifierProvider =
    AutoDisposeNotifierProvider<ExpenseNotifier, AsyncValue<void>>.internal(
  ExpenseNotifier.new,
  name: r'expenseNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$expenseNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ExpenseNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
