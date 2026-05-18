// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'approval_inbox_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$approvalInboxItemsHash() =>
    r'fff99d55af2934e1c45de55dd156202b583ac6d2';

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

/// See also [approvalInboxItems].
@ProviderFor(approvalInboxItems)
const approvalInboxItemsProvider = ApprovalInboxItemsFamily();

/// See also [approvalInboxItems].
class ApprovalInboxItemsFamily
    extends Family<AsyncValue<List<ApprovalInboxItem>>> {
  /// See also [approvalInboxItems].
  const ApprovalInboxItemsFamily();

  /// See also [approvalInboxItems].
  ApprovalInboxItemsProvider call({
    String? type,
  }) {
    return ApprovalInboxItemsProvider(
      type: type,
    );
  }

  @override
  ApprovalInboxItemsProvider getProviderOverride(
    covariant ApprovalInboxItemsProvider provider,
  ) {
    return call(
      type: provider.type,
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
  String? get name => r'approvalInboxItemsProvider';
}

/// See also [approvalInboxItems].
class ApprovalInboxItemsProvider
    extends AutoDisposeFutureProvider<List<ApprovalInboxItem>> {
  /// See also [approvalInboxItems].
  ApprovalInboxItemsProvider({
    String? type,
  }) : this._internal(
          (ref) => approvalInboxItems(
            ref as ApprovalInboxItemsRef,
            type: type,
          ),
          from: approvalInboxItemsProvider,
          name: r'approvalInboxItemsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$approvalInboxItemsHash,
          dependencies: ApprovalInboxItemsFamily._dependencies,
          allTransitiveDependencies:
              ApprovalInboxItemsFamily._allTransitiveDependencies,
          type: type,
        );

  ApprovalInboxItemsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.type,
  }) : super.internal();

  final String? type;

  @override
  Override overrideWith(
    FutureOr<List<ApprovalInboxItem>> Function(ApprovalInboxItemsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ApprovalInboxItemsProvider._internal(
        (ref) => create(ref as ApprovalInboxItemsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        type: type,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<ApprovalInboxItem>> createElement() {
    return _ApprovalInboxItemsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ApprovalInboxItemsProvider && other.type == type;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, type.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin ApprovalInboxItemsRef
    on AutoDisposeFutureProviderRef<List<ApprovalInboxItem>> {
  /// The parameter `type` of this provider.
  String? get type;
}

class _ApprovalInboxItemsProviderElement
    extends AutoDisposeFutureProviderElement<List<ApprovalInboxItem>>
    with ApprovalInboxItemsRef {
  _ApprovalInboxItemsProviderElement(super.provider);

  @override
  String? get type => (origin as ApprovalInboxItemsProvider).type;
}

String _$approvalInboxCountHash() =>
    r'0bf4a4f85c233cc76c9371355a824afbd55caa72';

/// See also [approvalInboxCount].
@ProviderFor(approvalInboxCount)
final approvalInboxCountProvider = AutoDisposeFutureProvider<int>.internal(
  approvalInboxCount,
  name: r'approvalInboxCountProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$approvalInboxCountHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef ApprovalInboxCountRef = AutoDisposeFutureProviderRef<int>;
String _$approvalInboxNotifierHash() =>
    r'291e50e5b5d03540190a95b26f1e057db80e12b9';

/// See also [ApprovalInboxNotifier].
@ProviderFor(ApprovalInboxNotifier)
final approvalInboxNotifierProvider = AutoDisposeNotifierProvider<
    ApprovalInboxNotifier, AsyncValue<void>>.internal(
  ApprovalInboxNotifier.new,
  name: r'approvalInboxNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$approvalInboxNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ApprovalInboxNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
