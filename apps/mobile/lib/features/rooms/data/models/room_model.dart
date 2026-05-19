class RoomInfo {
  final String id;
  final String name;
  final String? location;
  final int capacity;

  const RoomInfo({required this.id, required this.name, this.location, required this.capacity});

  factory RoomInfo.fromJson(Map<String, dynamic> j) => RoomInfo(
        id: j['id'] as String,
        name: j['name'] as String,
        location: j['location'] as String?,
        capacity: j['capacity'] as int,
      );
}

class MeetingRoom {
  final String id;
  final String name;
  final String? location;
  final int capacity;
  final List<String> amenities;
  final bool isActive;
  final DateTime createdAt;

  const MeetingRoom({
    required this.id,
    required this.name,
    this.location,
    required this.capacity,
    required this.amenities,
    required this.isActive,
    required this.createdAt,
  });

  factory MeetingRoom.fromJson(Map<String, dynamic> j) => MeetingRoom(
        id: j['id'] as String,
        name: j['name'] as String,
        location: j['location'] as String?,
        capacity: j['capacity'] as int,
        amenities: List<String>.from(j['amenities'] as List? ?? []),
        isActive: j['isActive'] as bool? ?? true,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

class BookingEmployee {
  final String firstName;
  final String lastName;
  final String employeeCode;

  const BookingEmployee({required this.firstName, required this.lastName, required this.employeeCode});

  factory BookingEmployee.fromJson(Map<String, dynamic> j) => BookingEmployee(
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        employeeCode: j['employeeCode'] as String,
      );

  String get fullName => '$firstName $lastName';
}

class RoomBooking {
  final String id;
  final String roomId;
  final String title;
  final DateTime startTime;
  final DateTime endTime;
  final int attendees;
  final String? notes;
  final String status;
  final DateTime createdAt;
  final RoomInfo? room;
  final BookingEmployee? bookedBy;

  const RoomBooking({
    required this.id,
    required this.roomId,
    required this.title,
    required this.startTime,
    required this.endTime,
    required this.attendees,
    this.notes,
    required this.status,
    required this.createdAt,
    this.room,
    this.bookedBy,
  });

  bool get isConfirmed => status == 'CONFIRMED';
  bool get isCancelled => status == 'CANCELLED';

  factory RoomBooking.fromJson(Map<String, dynamic> j) => RoomBooking(
        id: j['id'] as String,
        roomId: j['roomId'] as String,
        title: j['title'] as String,
        startTime: DateTime.parse(j['startTime'] as String).toLocal(),
        endTime: DateTime.parse(j['endTime'] as String).toLocal(),
        attendees: j['attendees'] as int? ?? 1,
        notes: j['notes'] as String?,
        status: j['status'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
        room: j['room'] != null ? RoomInfo.fromJson(j['room'] as Map<String, dynamic>) : null,
        bookedBy: j['bookedBy'] != null ? BookingEmployee.fromJson(j['bookedBy'] as Map<String, dynamic>) : null,
      );
}
