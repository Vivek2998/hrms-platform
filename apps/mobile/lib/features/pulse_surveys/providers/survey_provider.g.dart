// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'survey_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$surveysHash() => r'1d79707fff898904f0ffdd2f01c40a1dfa6fd13c';

/// See also [surveys].
@ProviderFor(surveys)
final surveysProvider = AutoDisposeFutureProvider<List<Survey>>.internal(
  surveys,
  name: r'surveysProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$surveysHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef SurveysRef = AutoDisposeFutureProviderRef<List<Survey>>;
String _$surveyDetailHash() => r'57a031f2b6b674321e2062fbe04fc323e129a328';

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

/// See also [surveyDetail].
@ProviderFor(surveyDetail)
const surveyDetailProvider = SurveyDetailFamily();

/// See also [surveyDetail].
class SurveyDetailFamily extends Family<AsyncValue<SurveyDetail>> {
  /// See also [surveyDetail].
  const SurveyDetailFamily();

  /// See also [surveyDetail].
  SurveyDetailProvider call(
    String id,
  ) {
    return SurveyDetailProvider(
      id,
    );
  }

  @override
  SurveyDetailProvider getProviderOverride(
    covariant SurveyDetailProvider provider,
  ) {
    return call(
      provider.id,
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
  String? get name => r'surveyDetailProvider';
}

/// See also [surveyDetail].
class SurveyDetailProvider extends AutoDisposeFutureProvider<SurveyDetail> {
  /// See also [surveyDetail].
  SurveyDetailProvider(
    String id,
  ) : this._internal(
          (ref) => surveyDetail(
            ref as SurveyDetailRef,
            id,
          ),
          from: surveyDetailProvider,
          name: r'surveyDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$surveyDetailHash,
          dependencies: SurveyDetailFamily._dependencies,
          allTransitiveDependencies:
              SurveyDetailFamily._allTransitiveDependencies,
          id: id,
        );

  SurveyDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
  }) : super.internal();

  final String id;

  @override
  Override overrideWith(
    FutureOr<SurveyDetail> Function(SurveyDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: SurveyDetailProvider._internal(
        (ref) => create(ref as SurveyDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<SurveyDetail> createElement() {
    return _SurveyDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is SurveyDetailProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin SurveyDetailRef on AutoDisposeFutureProviderRef<SurveyDetail> {
  /// The parameter `id` of this provider.
  String get id;
}

class _SurveyDetailProviderElement
    extends AutoDisposeFutureProviderElement<SurveyDetail>
    with SurveyDetailRef {
  _SurveyDetailProviderElement(super.provider);

  @override
  String get id => (origin as SurveyDetailProvider).id;
}

String _$surveyResultsHash() => r'098db28397d85f01df3e5e4bb35cd0952cd062d8';

/// See also [surveyResults].
@ProviderFor(surveyResults)
const surveyResultsProvider = SurveyResultsFamily();

/// See also [surveyResults].
class SurveyResultsFamily extends Family<AsyncValue<SurveyResults>> {
  /// See also [surveyResults].
  const SurveyResultsFamily();

  /// See also [surveyResults].
  SurveyResultsProvider call(
    String id,
  ) {
    return SurveyResultsProvider(
      id,
    );
  }

  @override
  SurveyResultsProvider getProviderOverride(
    covariant SurveyResultsProvider provider,
  ) {
    return call(
      provider.id,
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
  String? get name => r'surveyResultsProvider';
}

/// See also [surveyResults].
class SurveyResultsProvider extends AutoDisposeFutureProvider<SurveyResults> {
  /// See also [surveyResults].
  SurveyResultsProvider(
    String id,
  ) : this._internal(
          (ref) => surveyResults(
            ref as SurveyResultsRef,
            id,
          ),
          from: surveyResultsProvider,
          name: r'surveyResultsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$surveyResultsHash,
          dependencies: SurveyResultsFamily._dependencies,
          allTransitiveDependencies:
              SurveyResultsFamily._allTransitiveDependencies,
          id: id,
        );

  SurveyResultsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
  }) : super.internal();

  final String id;

  @override
  Override overrideWith(
    FutureOr<SurveyResults> Function(SurveyResultsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: SurveyResultsProvider._internal(
        (ref) => create(ref as SurveyResultsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<SurveyResults> createElement() {
    return _SurveyResultsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is SurveyResultsProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin SurveyResultsRef on AutoDisposeFutureProviderRef<SurveyResults> {
  /// The parameter `id` of this provider.
  String get id;
}

class _SurveyResultsProviderElement
    extends AutoDisposeFutureProviderElement<SurveyResults>
    with SurveyResultsRef {
  _SurveyResultsProviderElement(super.provider);

  @override
  String get id => (origin as SurveyResultsProvider).id;
}

String _$surveyNotifierHash() => r'6761a16e083dac88df9131d3c32522b199643f21';

/// See also [SurveyNotifier].
@ProviderFor(SurveyNotifier)
final surveyNotifierProvider =
    AutoDisposeNotifierProvider<SurveyNotifier, AsyncValue<void>>.internal(
  SurveyNotifier.new,
  name: r'surveyNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$surveyNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$SurveyNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
