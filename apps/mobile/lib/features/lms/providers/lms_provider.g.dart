// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lms_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$lmsCoursesHash() => r'1d4e806396f7bc71411b6a45e729d91121b9ae46';

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

/// See also [lmsCourses].
@ProviderFor(lmsCourses)
const lmsCoursesProvider = LmsCoursesFamily();

/// See also [lmsCourses].
class LmsCoursesFamily extends Family<AsyncValue<List<LearningCourse>>> {
  /// See also [lmsCourses].
  const LmsCoursesFamily();

  /// See also [lmsCourses].
  LmsCoursesProvider call({
    String? search,
  }) {
    return LmsCoursesProvider(
      search: search,
    );
  }

  @override
  LmsCoursesProvider getProviderOverride(
    covariant LmsCoursesProvider provider,
  ) {
    return call(
      search: provider.search,
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
  String? get name => r'lmsCoursesProvider';
}

/// See also [lmsCourses].
class LmsCoursesProvider
    extends AutoDisposeFutureProvider<List<LearningCourse>> {
  /// See also [lmsCourses].
  LmsCoursesProvider({
    String? search,
  }) : this._internal(
          (ref) => lmsCourses(
            ref as LmsCoursesRef,
            search: search,
          ),
          from: lmsCoursesProvider,
          name: r'lmsCoursesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$lmsCoursesHash,
          dependencies: LmsCoursesFamily._dependencies,
          allTransitiveDependencies:
              LmsCoursesFamily._allTransitiveDependencies,
          search: search,
        );

  LmsCoursesProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.search,
  }) : super.internal();

  final String? search;

  @override
  Override overrideWith(
    FutureOr<List<LearningCourse>> Function(LmsCoursesRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: LmsCoursesProvider._internal(
        (ref) => create(ref as LmsCoursesRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        search: search,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<LearningCourse>> createElement() {
    return _LmsCoursesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is LmsCoursesProvider && other.search == search;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, search.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin LmsCoursesRef on AutoDisposeFutureProviderRef<List<LearningCourse>> {
  /// The parameter `search` of this provider.
  String? get search;
}

class _LmsCoursesProviderElement
    extends AutoDisposeFutureProviderElement<List<LearningCourse>>
    with LmsCoursesRef {
  _LmsCoursesProviderElement(super.provider);

  @override
  String? get search => (origin as LmsCoursesProvider).search;
}

String _$myLmsCoursesHash() => r'c5a1cb0fa6cf4a6b4aeef9d2bcaea2c83cbe4ce9';

/// See also [myLmsCourses].
@ProviderFor(myLmsCourses)
final myLmsCoursesProvider =
    AutoDisposeFutureProvider<List<CourseEnrollment>>.internal(
  myLmsCourses,
  name: r'myLmsCoursesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$myLmsCoursesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef MyLmsCoursesRef = AutoDisposeFutureProviderRef<List<CourseEnrollment>>;
String _$lmsNotifierHash() => r'84ebd0652241e744fcfa9e521287a2f4b09d945b';

/// See also [LmsNotifier].
@ProviderFor(LmsNotifier)
final lmsNotifierProvider =
    AutoDisposeNotifierProvider<LmsNotifier, AsyncValue<void>>.internal(
  LmsNotifier.new,
  name: r'lmsNotifierProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$lmsNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$LmsNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
