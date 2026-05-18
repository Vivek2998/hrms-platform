// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shift_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$shiftListHash() => r'5b17e8df72c37e9028321d7a1224c0cdf37e9bde';

/// See also [shiftList].
@ProviderFor(shiftList)
final shiftListProvider = AutoDisposeFutureProvider<List<Shift>>.internal(
  shiftList,
  name: r'shiftListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$shiftListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef ShiftListRef = AutoDisposeFutureProviderRef<List<Shift>>;
String _$shiftAssignmentsHash() => r'f6f8bd119f09a4d1e3635004158fdee65a2e3dc0';

/// See also [shiftAssignments].
@ProviderFor(shiftAssignments)
final shiftAssignmentsProvider =
    AutoDisposeFutureProvider<List<ShiftAssignment>>.internal(
  shiftAssignments,
  name: r'shiftAssignmentsProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$shiftAssignmentsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef ShiftAssignmentsRef
    = AutoDisposeFutureProviderRef<List<ShiftAssignment>>;
String _$myShiftAssignmentHash() => r'cf96dfa8a4332680794e0007abed1053015eb751';

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

/// See also [myShiftAssignment].
@ProviderFor(myShiftAssignment)
const myShiftAssignmentProvider = MyShiftAssignmentFamily();

/// See also [myShiftAssignment].
class MyShiftAssignmentFamily extends Family<AsyncValue<ShiftAssignment?>> {
  /// See also [myShiftAssignment].
  const MyShiftAssignmentFamily();

  /// See also [myShiftAssignment].
  MyShiftAssignmentProvider call(
    String employeeId,
  ) {
    return MyShiftAssignmentProvider(
      employeeId,
    );
  }

  @override
  MyShiftAssignmentProvider getProviderOverride(
    covariant MyShiftAssignmentProvider provider,
  ) {
    return call(
      provider.employeeId,
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
  String? get name => r'myShiftAssignmentProvider';
}

/// See also [myShiftAssignment].
class MyShiftAssignmentProvider
    extends AutoDisposeFutureProvider<ShiftAssignment?> {
  /// See also [myShiftAssignment].
  MyShiftAssignmentProvider(
    String employeeId,
  ) : this._internal(
          (ref) => myShiftAssignment(
            ref as MyShiftAssignmentRef,
            employeeId,
          ),
          from: myShiftAssignmentProvider,
          name: r'myShiftAssignmentProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$myShiftAssignmentHash,
          dependencies: MyShiftAssignmentFamily._dependencies,
          allTransitiveDependencies:
              MyShiftAssignmentFamily._allTransitiveDependencies,
          employeeId: employeeId,
        );

  MyShiftAssignmentProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.employeeId,
  }) : super.internal();

  final String employeeId;

  @override
  Override overrideWith(
    FutureOr<ShiftAssignment?> Function(MyShiftAssignmentRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: MyShiftAssignmentProvider._internal(
        (ref) => create(ref as MyShiftAssignmentRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        employeeId: employeeId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<ShiftAssignment?> createElement() {
    return _MyShiftAssignmentProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is MyShiftAssignmentProvider && other.employeeId == employeeId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, employeeId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin MyShiftAssignmentRef on AutoDisposeFutureProviderRef<ShiftAssignment?> {
  /// The parameter `employeeId` of this provider.
  String get employeeId;
}

class _MyShiftAssignmentProviderElement
    extends AutoDisposeFutureProviderElement<ShiftAssignment?>
    with MyShiftAssignmentRef {
  _MyShiftAssignmentProviderElement(super.provider);

  @override
  String get employeeId => (origin as MyShiftAssignmentProvider).employeeId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
