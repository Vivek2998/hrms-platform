class TravelEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String employeeCode;

  const TravelEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.employeeCode,
  });

  factory TravelEmployee.fromJson(Map<String, dynamic> j) => TravelEmployee(
        id: j['id'],
        firstName: j['firstName'],
        lastName: j['lastName'],
        employeeCode: j['employeeCode'],
      );

  String get fullName => '$firstName $lastName';
}

class TravelRequest {
  final String id;
  final String employeeId;
  final String purpose;
  final String fromCity;
  final String toCity;
  final String departureDate;
  final String? returnDate;
  final String travelMode;
  final double? estimatedBudget;
  final bool hotelRequired;
  final bool advanceRequired;
  final double? advanceAmount;
  final String status;
  final String? approvedAt;
  final String? rejectedReason;
  final String? notes;
  final String createdAt;
  final TravelEmployee employee;

  const TravelRequest({
    required this.id,
    required this.employeeId,
    required this.purpose,
    required this.fromCity,
    required this.toCity,
    required this.departureDate,
    this.returnDate,
    required this.travelMode,
    this.estimatedBudget,
    required this.hotelRequired,
    required this.advanceRequired,
    this.advanceAmount,
    required this.status,
    this.approvedAt,
    this.rejectedReason,
    this.notes,
    required this.createdAt,
    required this.employee,
  });

  factory TravelRequest.fromJson(Map<String, dynamic> j) => TravelRequest(
        id: j['id'],
        employeeId: j['employeeId'],
        purpose: j['purpose'],
        fromCity: j['fromCity'],
        toCity: j['toCity'],
        departureDate: j['departureDate'],
        returnDate: j['returnDate'],
        travelMode: j['travelMode'] ?? 'FLIGHT',
        estimatedBudget: j['estimatedBudget'] != null ? double.tryParse(j['estimatedBudget'].toString()) : null,
        hotelRequired: j['hotelRequired'] ?? false,
        advanceRequired: j['advanceRequired'] ?? false,
        advanceAmount: j['advanceAmount'] != null ? double.tryParse(j['advanceAmount'].toString()) : null,
        status: j['status'] ?? 'PENDING',
        approvedAt: j['approvedAt'],
        rejectedReason: j['rejectedReason'],
        notes: j['notes'],
        createdAt: j['createdAt'],
        employee: TravelEmployee.fromJson(j['employee']),
      );

  bool get isPending => status == 'PENDING';
  bool get isApproved => status == 'APPROVED';
  bool get isRejected => status == 'REJECTED';
  bool get isCancelled => status == 'CANCELLED';
}
