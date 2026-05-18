// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$attendanceListHash() => r'ba9433786f8f7038149786cf3695df665cb01890';

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

/// See also [attendanceList].
@ProviderFor(attendanceList)
const attendanceListProvider = AttendanceListFamily();

/// See also [attendanceList].
class AttendanceListFamily
    extends Family<AsyncValue<List<CachedAttendanceRecord>>> {
  /// See also [attendanceList].
  const AttendanceListFamily();

  /// See also [attendanceList].
  AttendanceListProvider call({
    int month = 0,
    int year = 0,
  }) {
    return AttendanceListProvider(
      month: month,
      year: year,
    );
  }

  @override
  AttendanceListProvider getProviderOverride(
    covariant AttendanceListProvider provider,
  ) {
    return call(
      month: provider.month,
      year: provider.year,
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
  String? get name => r'attendanceListProvider';
}

/// See also [attendanceList].
class AttendanceListProvider
    extends FutureProvider<List<CachedAttendanceRecord>> {
  /// See also [attendanceList].
  AttendanceListProvider({
    int month = 0,
    int year = 0,
  }) : this._internal(
          (ref) => attendanceList(
            ref as AttendanceListRef,
            month: month,
            year: year,
          ),
          from: attendanceListProvider,
          name: r'attendanceListProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$attendanceListHash,
          dependencies: AttendanceListFamily._dependencies,
          allTransitiveDependencies:
              AttendanceListFamily._allTransitiveDependencies,
          month: month,
          year: year,
        );

  AttendanceListProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.month,
    required this.year,
  }) : super.internal();

  final int month;
  final int year;

  @override
  Override overrideWith(
    FutureOr<List<CachedAttendanceRecord>> Function(AttendanceListRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: AttendanceListProvider._internal(
        (ref) => create(ref as AttendanceListRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        month: month,
        year: year,
      ),
    );
  }

  @override
  FutureProviderElement<List<CachedAttendanceRecord>> createElement() {
    return _AttendanceListProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AttendanceListProvider &&
        other.month == month &&
        other.year == year;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, month.hashCode);
    hash = _SystemHash.combine(hash, year.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin AttendanceListRef on FutureProviderRef<List<CachedAttendanceRecord>> {
  /// The parameter `month` of this provider.
  int get month;

  /// The parameter `year` of this provider.
  int get year;
}

class _AttendanceListProviderElement
    extends FutureProviderElement<List<CachedAttendanceRecord>>
    with AttendanceListRef {
  _AttendanceListProviderElement(super.provider);

  @override
  int get month => (origin as AttendanceListProvider).month;
  @override
  int get year => (origin as AttendanceListProvider).year;
}

String _$punchNotifierHash() => r'2df1a2fdbfe15d5302346732631fa0596505cceb';

/// See also [PunchNotifier].
@ProviderFor(PunchNotifier)
final punchNotifierProvider = AutoDisposeNotifierProvider<PunchNotifier,
    AsyncValue<Map<String, dynamic>?>>.internal(
  PunchNotifier.new,
  name: r'punchNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$punchNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$PunchNotifier
    = AutoDisposeNotifier<AsyncValue<Map<String, dynamic>?>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
