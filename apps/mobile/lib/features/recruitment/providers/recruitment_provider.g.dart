// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recruitment_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$jobPostingsHash() => r'2c77c1a872f02de473c230593dca15d87ecb6eda';

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

/// See also [jobPostings].
@ProviderFor(jobPostings)
const jobPostingsProvider = JobPostingsFamily();

/// See also [jobPostings].
class JobPostingsFamily extends Family<AsyncValue<List<JobPosting>>> {
  /// See also [jobPostings].
  const JobPostingsFamily();

  /// See also [jobPostings].
  JobPostingsProvider call({
    String? status,
  }) {
    return JobPostingsProvider(
      status: status,
    );
  }

  @override
  JobPostingsProvider getProviderOverride(
    covariant JobPostingsProvider provider,
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
  String? get name => r'jobPostingsProvider';
}

/// See also [jobPostings].
class JobPostingsProvider extends AutoDisposeFutureProvider<List<JobPosting>> {
  /// See also [jobPostings].
  JobPostingsProvider({
    String? status,
  }) : this._internal(
          (ref) => jobPostings(
            ref as JobPostingsRef,
            status: status,
          ),
          from: jobPostingsProvider,
          name: r'jobPostingsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$jobPostingsHash,
          dependencies: JobPostingsFamily._dependencies,
          allTransitiveDependencies:
              JobPostingsFamily._allTransitiveDependencies,
          status: status,
        );

  JobPostingsProvider._internal(
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
    FutureOr<List<JobPosting>> Function(JobPostingsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: JobPostingsProvider._internal(
        (ref) => create(ref as JobPostingsRef),
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
  AutoDisposeFutureProviderElement<List<JobPosting>> createElement() {
    return _JobPostingsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is JobPostingsProvider && other.status == status;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, status.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin JobPostingsRef on AutoDisposeFutureProviderRef<List<JobPosting>> {
  /// The parameter `status` of this provider.
  String? get status;
}

class _JobPostingsProviderElement
    extends AutoDisposeFutureProviderElement<List<JobPosting>>
    with JobPostingsRef {
  _JobPostingsProviderElement(super.provider);

  @override
  String? get status => (origin as JobPostingsProvider).status;
}

String _$jobApplicationsHash() => r'6570f976cf4d9dd0e20547a1ad6f6bb9362794b8';

/// See also [jobApplications].
@ProviderFor(jobApplications)
const jobApplicationsProvider = JobApplicationsFamily();

/// See also [jobApplications].
class JobApplicationsFamily extends Family<AsyncValue<List<JobApplication>>> {
  /// See also [jobApplications].
  const JobApplicationsFamily();

  /// See also [jobApplications].
  JobApplicationsProvider call({
    String? jobId,
    String? stage,
  }) {
    return JobApplicationsProvider(
      jobId: jobId,
      stage: stage,
    );
  }

  @override
  JobApplicationsProvider getProviderOverride(
    covariant JobApplicationsProvider provider,
  ) {
    return call(
      jobId: provider.jobId,
      stage: provider.stage,
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
  String? get name => r'jobApplicationsProvider';
}

/// See also [jobApplications].
class JobApplicationsProvider
    extends AutoDisposeFutureProvider<List<JobApplication>> {
  /// See also [jobApplications].
  JobApplicationsProvider({
    String? jobId,
    String? stage,
  }) : this._internal(
          (ref) => jobApplications(
            ref as JobApplicationsRef,
            jobId: jobId,
            stage: stage,
          ),
          from: jobApplicationsProvider,
          name: r'jobApplicationsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$jobApplicationsHash,
          dependencies: JobApplicationsFamily._dependencies,
          allTransitiveDependencies:
              JobApplicationsFamily._allTransitiveDependencies,
          jobId: jobId,
          stage: stage,
        );

  JobApplicationsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.jobId,
    required this.stage,
  }) : super.internal();

  final String? jobId;
  final String? stage;

  @override
  Override overrideWith(
    FutureOr<List<JobApplication>> Function(JobApplicationsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: JobApplicationsProvider._internal(
        (ref) => create(ref as JobApplicationsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        jobId: jobId,
        stage: stage,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<JobApplication>> createElement() {
    return _JobApplicationsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is JobApplicationsProvider &&
        other.jobId == jobId &&
        other.stage == stage;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, jobId.hashCode);
    hash = _SystemHash.combine(hash, stage.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin JobApplicationsRef on AutoDisposeFutureProviderRef<List<JobApplication>> {
  /// The parameter `jobId` of this provider.
  String? get jobId;

  /// The parameter `stage` of this provider.
  String? get stage;
}

class _JobApplicationsProviderElement
    extends AutoDisposeFutureProviderElement<List<JobApplication>>
    with JobApplicationsRef {
  _JobApplicationsProviderElement(super.provider);

  @override
  String? get jobId => (origin as JobApplicationsProvider).jobId;
  @override
  String? get stage => (origin as JobApplicationsProvider).stage;
}

String _$recruitmentNotifierHash() =>
    r'cc3de00412a6b529b8b61d86ef462e60a8b33fb0';

/// See also [RecruitmentNotifier].
@ProviderFor(RecruitmentNotifier)
final recruitmentNotifierProvider =
    AutoDisposeNotifierProvider<RecruitmentNotifier, AsyncValue<void>>.internal(
  RecruitmentNotifier.new,
  name: r'recruitmentNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$recruitmentNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$RecruitmentNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
