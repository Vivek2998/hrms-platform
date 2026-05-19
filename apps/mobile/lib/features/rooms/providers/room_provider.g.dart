// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'room_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$meetingRoomsHash() => r'84267bb42df0efd13c7f67e6cbbd0437e5fe2f56';

/// See also [meetingRooms].
@ProviderFor(meetingRooms)
final meetingRoomsProvider =
    AutoDisposeFutureProvider<List<MeetingRoom>>.internal(
  meetingRooms,
  name: r'meetingRoomsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$meetingRoomsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef MeetingRoomsRef = AutoDisposeFutureProviderRef<List<MeetingRoom>>;
String _$roomBookingsHash() => r'9c9a1fc79f9dc236445a0d22a23c4497d9a8e042';

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

/// See also [roomBookings].
@ProviderFor(roomBookings)
const roomBookingsProvider = RoomBookingsFamily();

/// See also [roomBookings].
class RoomBookingsFamily extends Family<AsyncValue<List<RoomBooking>>> {
  /// See also [roomBookings].
  const RoomBookingsFamily();

  /// See also [roomBookings].
  RoomBookingsProvider call({
    String? date,
  }) {
    return RoomBookingsProvider(
      date: date,
    );
  }

  @override
  RoomBookingsProvider getProviderOverride(
    covariant RoomBookingsProvider provider,
  ) {
    return call(
      date: provider.date,
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
  String? get name => r'roomBookingsProvider';
}

/// See also [roomBookings].
class RoomBookingsProvider
    extends AutoDisposeFutureProvider<List<RoomBooking>> {
  /// See also [roomBookings].
  RoomBookingsProvider({
    String? date,
  }) : this._internal(
          (ref) => roomBookings(
            ref as RoomBookingsRef,
            date: date,
          ),
          from: roomBookingsProvider,
          name: r'roomBookingsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$roomBookingsHash,
          dependencies: RoomBookingsFamily._dependencies,
          allTransitiveDependencies:
              RoomBookingsFamily._allTransitiveDependencies,
          date: date,
        );

  RoomBookingsProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.date,
  }) : super.internal();

  final String? date;

  @override
  Override overrideWith(
    FutureOr<List<RoomBooking>> Function(RoomBookingsRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: RoomBookingsProvider._internal(
        (ref) => create(ref as RoomBookingsRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        date: date,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<RoomBooking>> createElement() {
    return _RoomBookingsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is RoomBookingsProvider && other.date == date;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, date.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin RoomBookingsRef on AutoDisposeFutureProviderRef<List<RoomBooking>> {
  /// The parameter `date` of this provider.
  String? get date;
}

class _RoomBookingsProviderElement
    extends AutoDisposeFutureProviderElement<List<RoomBooking>>
    with RoomBookingsRef {
  _RoomBookingsProviderElement(super.provider);

  @override
  String? get date => (origin as RoomBookingsProvider).date;
}

String _$roomNotifierHash() => r'b7ce15c26c7517f04458ad1550d4110a0e163a82';

/// See also [RoomNotifier].
@ProviderFor(RoomNotifier)
final roomNotifierProvider =
    AutoDisposeNotifierProvider<RoomNotifier, AsyncValue<void>>.internal(
  RoomNotifier.new,
  name: r'roomNotifierProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$roomNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$RoomNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
