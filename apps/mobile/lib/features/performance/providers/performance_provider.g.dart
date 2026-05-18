// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'performance_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$performanceCyclesHash() => r'8e36d57d402836a1bedf50003993f317439ea464';

/// See also [performanceCycles].
@ProviderFor(performanceCycles)
final performanceCyclesProvider =
    AutoDisposeFutureProvider<List<PerformanceCycle>>.internal(
  performanceCycles,
  name: r'performanceCyclesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$performanceCyclesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef PerformanceCyclesRef
    = AutoDisposeFutureProviderRef<List<PerformanceCycle>>;
String _$performanceGoalsHash() => r'5b634c25029c456a16f7b73c4018d0cee64ec6b0';

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

/// See also [performanceGoals].
@ProviderFor(performanceGoals)
const performanceGoalsProvider = PerformanceGoalsFamily();

/// See also [performanceGoals].
class PerformanceGoalsFamily extends Family<AsyncValue<List<PerformanceGoal>>> {
  /// See also [performanceGoals].
  const PerformanceGoalsFamily();

  /// See also [performanceGoals].
  PerformanceGoalsProvider call(
    String cycleId,
  ) {
    return PerformanceGoalsProvider(
      cycleId,
    );
  }

  @override
  PerformanceGoalsProvider getProviderOverride(
    covariant PerformanceGoalsProvider provider,
  ) {
    return call(
      provider.cycleId,
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
  String? get name => r'performanceGoalsProvider';
}

/// See also [performanceGoals].
class PerformanceGoalsProvider
    extends AutoDisposeFutureProvider<List<PerformanceGoal>> {
  /// See also [performanceGoals].
  PerformanceGoalsProvider(
    String cycleId,
  ) : this._internal(
          (ref) => performanceGoals(
            ref as PerformanceGoalsRef,
            cycleId,
          ),
          from: performanceGoalsProvider,
          name: r'performanceGoalsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$performanceGoalsHash,
          dependencies: PerformanceGoalsFamily._dependencies,
          allTransitiveDependencies:
              PerformanceGoalsFamily._allTransitiveDependencies,
          cycleId: cycleId,
        );

  PerformanceGoalsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.cycleId,
  }) : super.internal();

  final String cycleId;

  @override
  Override overrideWith(
    FutureOr<List<PerformanceGoal>> Function(PerformanceGoalsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PerformanceGoalsProvider._internal(
        (ref) => create(ref as PerformanceGoalsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        cycleId: cycleId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<PerformanceGoal>> createElement() {
    return _PerformanceGoalsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PerformanceGoalsProvider && other.cycleId == cycleId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, cycleId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PerformanceGoalsRef
    on AutoDisposeFutureProviderRef<List<PerformanceGoal>> {
  /// The parameter `cycleId` of this provider.
  String get cycleId;
}

class _PerformanceGoalsProviderElement
    extends AutoDisposeFutureProviderElement<List<PerformanceGoal>>
    with PerformanceGoalsRef {
  _PerformanceGoalsProviderElement(super.provider);

  @override
  String get cycleId => (origin as PerformanceGoalsProvider).cycleId;
}

String _$performanceReviewsHash() =>
    r'6cb73c7b4ca5aa525b77d7fb42b54bb5343f133b';

/// See also [performanceReviews].
@ProviderFor(performanceReviews)
const performanceReviewsProvider = PerformanceReviewsFamily();

/// See also [performanceReviews].
class PerformanceReviewsFamily
    extends Family<AsyncValue<List<PerformanceReview>>> {
  /// See also [performanceReviews].
  const PerformanceReviewsFamily();

  /// See also [performanceReviews].
  PerformanceReviewsProvider call(
    String cycleId,
  ) {
    return PerformanceReviewsProvider(
      cycleId,
    );
  }

  @override
  PerformanceReviewsProvider getProviderOverride(
    covariant PerformanceReviewsProvider provider,
  ) {
    return call(
      provider.cycleId,
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
  String? get name => r'performanceReviewsProvider';
}

/// See also [performanceReviews].
class PerformanceReviewsProvider
    extends AutoDisposeFutureProvider<List<PerformanceReview>> {
  /// See also [performanceReviews].
  PerformanceReviewsProvider(
    String cycleId,
  ) : this._internal(
          (ref) => performanceReviews(
            ref as PerformanceReviewsRef,
            cycleId,
          ),
          from: performanceReviewsProvider,
          name: r'performanceReviewsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$performanceReviewsHash,
          dependencies: PerformanceReviewsFamily._dependencies,
          allTransitiveDependencies:
              PerformanceReviewsFamily._allTransitiveDependencies,
          cycleId: cycleId,
        );

  PerformanceReviewsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.cycleId,
  }) : super.internal();

  final String cycleId;

  @override
  Override overrideWith(
    FutureOr<List<PerformanceReview>> Function(PerformanceReviewsRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PerformanceReviewsProvider._internal(
        (ref) => create(ref as PerformanceReviewsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        cycleId: cycleId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<PerformanceReview>> createElement() {
    return _PerformanceReviewsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PerformanceReviewsProvider && other.cycleId == cycleId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, cycleId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PerformanceReviewsRef
    on AutoDisposeFutureProviderRef<List<PerformanceReview>> {
  /// The parameter `cycleId` of this provider.
  String get cycleId;
}

class _PerformanceReviewsProviderElement
    extends AutoDisposeFutureProviderElement<List<PerformanceReview>>
    with PerformanceReviewsRef {
  _PerformanceReviewsProviderElement(super.provider);

  @override
  String get cycleId => (origin as PerformanceReviewsProvider).cycleId;
}

String _$peerFeedbackListHash() => r'67ef3a09f9d3b828fdbfe7568fd718e8aa61d10a';

/// See also [peerFeedbackList].
@ProviderFor(peerFeedbackList)
const peerFeedbackListProvider = PeerFeedbackListFamily();

/// See also [peerFeedbackList].
class PeerFeedbackListFamily extends Family<AsyncValue<List<PeerFeedback>>> {
  /// See also [peerFeedbackList].
  const PeerFeedbackListFamily();

  /// See also [peerFeedbackList].
  PeerFeedbackListProvider call({
    String? cycleId,
  }) {
    return PeerFeedbackListProvider(
      cycleId: cycleId,
    );
  }

  @override
  PeerFeedbackListProvider getProviderOverride(
    covariant PeerFeedbackListProvider provider,
  ) {
    return call(
      cycleId: provider.cycleId,
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
  String? get name => r'peerFeedbackListProvider';
}

/// See also [peerFeedbackList].
class PeerFeedbackListProvider
    extends AutoDisposeFutureProvider<List<PeerFeedback>> {
  /// See also [peerFeedbackList].
  PeerFeedbackListProvider({
    String? cycleId,
  }) : this._internal(
          (ref) => peerFeedbackList(
            ref as PeerFeedbackListRef,
            cycleId: cycleId,
          ),
          from: peerFeedbackListProvider,
          name: r'peerFeedbackListProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$peerFeedbackListHash,
          dependencies: PeerFeedbackListFamily._dependencies,
          allTransitiveDependencies:
              PeerFeedbackListFamily._allTransitiveDependencies,
          cycleId: cycleId,
        );

  PeerFeedbackListProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.cycleId,
  }) : super.internal();

  final String? cycleId;

  @override
  Override overrideWith(
    FutureOr<List<PeerFeedback>> Function(PeerFeedbackListRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: PeerFeedbackListProvider._internal(
        (ref) => create(ref as PeerFeedbackListRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        cycleId: cycleId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<PeerFeedback>> createElement() {
    return _PeerFeedbackListProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is PeerFeedbackListProvider && other.cycleId == cycleId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, cycleId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin PeerFeedbackListRef on AutoDisposeFutureProviderRef<List<PeerFeedback>> {
  /// The parameter `cycleId` of this provider.
  String? get cycleId;
}

class _PeerFeedbackListProviderElement
    extends AutoDisposeFutureProviderElement<List<PeerFeedback>>
    with PeerFeedbackListRef {
  _PeerFeedbackListProviderElement(super.provider);

  @override
  String? get cycleId => (origin as PeerFeedbackListProvider).cycleId;
}

String _$goalNotifierHash() => r'951e16b4e118e94d58de98dba2a52c9c944825b9';

/// See also [GoalNotifier].
@ProviderFor(GoalNotifier)
final goalNotifierProvider =
    AutoDisposeNotifierProvider<GoalNotifier, AsyncValue<void>>.internal(
  GoalNotifier.new,
  name: r'goalNotifierProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$goalNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$GoalNotifier = AutoDisposeNotifier<AsyncValue<void>>;
String _$reviewNotifierHash() => r'97ad800f6a12aaeb82d3888df96fac581b86a553';

/// See also [ReviewNotifier].
@ProviderFor(ReviewNotifier)
final reviewNotifierProvider =
    AutoDisposeNotifierProvider<ReviewNotifier, AsyncValue<void>>.internal(
  ReviewNotifier.new,
  name: r'reviewNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$reviewNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$ReviewNotifier = AutoDisposeNotifier<AsyncValue<void>>;
String _$peerFeedbackNotifierHash() =>
    r'2e1307231b04964d9c95f58ebd38827e137c4f3e';

/// See also [PeerFeedbackNotifier].
@ProviderFor(PeerFeedbackNotifier)
final peerFeedbackNotifierProvider = AutoDisposeNotifierProvider<
    PeerFeedbackNotifier, AsyncValue<void>>.internal(
  PeerFeedbackNotifier.new,
  name: r'peerFeedbackNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$peerFeedbackNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$PeerFeedbackNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
