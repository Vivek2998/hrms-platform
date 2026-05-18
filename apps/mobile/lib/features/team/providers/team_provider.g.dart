// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'team_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$teamDirectoryHash() => r'fb0641922531bd7aab59cf25b98731b2a53a7191';

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

/// See also [teamDirectory].
@ProviderFor(teamDirectory)
const teamDirectoryProvider = TeamDirectoryFamily();

/// See also [teamDirectory].
class TeamDirectoryFamily extends Family<AsyncValue<List<TeamMember>>> {
  /// See also [teamDirectory].
  const TeamDirectoryFamily();

  /// See also [teamDirectory].
  TeamDirectoryProvider call({
    String? search,
  }) {
    return TeamDirectoryProvider(
      search: search,
    );
  }

  @override
  TeamDirectoryProvider getProviderOverride(
    covariant TeamDirectoryProvider provider,
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
  String? get name => r'teamDirectoryProvider';
}

/// See also [teamDirectory].
class TeamDirectoryProvider extends FutureProvider<List<TeamMember>> {
  /// See also [teamDirectory].
  TeamDirectoryProvider({
    String? search,
  }) : this._internal(
          (ref) => teamDirectory(
            ref as TeamDirectoryRef,
            search: search,
          ),
          from: teamDirectoryProvider,
          name: r'teamDirectoryProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$teamDirectoryHash,
          dependencies: TeamDirectoryFamily._dependencies,
          allTransitiveDependencies:
              TeamDirectoryFamily._allTransitiveDependencies,
          search: search,
        );

  TeamDirectoryProvider._internal(
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
    FutureOr<List<TeamMember>> Function(TeamDirectoryRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: TeamDirectoryProvider._internal(
        (ref) => create(ref as TeamDirectoryRef),
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
  FutureProviderElement<List<TeamMember>> createElement() {
    return _TeamDirectoryProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is TeamDirectoryProvider && other.search == search;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, search.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin TeamDirectoryRef on FutureProviderRef<List<TeamMember>> {
  /// The parameter `search` of this provider.
  String? get search;
}

class _TeamDirectoryProviderElement
    extends FutureProviderElement<List<TeamMember>> with TeamDirectoryRef {
  _TeamDirectoryProviderElement(super.provider);

  @override
  String? get search => (origin as TeamDirectoryProvider).search;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
