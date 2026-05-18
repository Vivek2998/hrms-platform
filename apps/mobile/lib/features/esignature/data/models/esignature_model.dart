class ESignEmployee {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;
  final String? avatarUrl;
  final String employeeCode;

  const ESignEmployee({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.designation,
    this.avatarUrl,
    required this.employeeCode,
  });

  factory ESignEmployee.fromJson(Map<String, dynamic> j) => ESignEmployee(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        designation: j['designation'] as String?,
        avatarUrl: j['avatarUrl'] as String?,
        employeeCode: j['employeeCode'] as String,
      );

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName[0]}${lastName[0]}';
}

class ESignatureRequest {
  final String id;
  final String organizationId;
  final String documentName;
  final String documentUrl;
  final String requestedBy;
  final String requestedTo;
  final String status;
  final String? message;
  final DateTime? signedAt;
  final DateTime? declinedAt;
  final String? declineReason;
  final String? signatureImageUrl;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final ESignEmployee requester;
  final ESignEmployee signer;

  const ESignatureRequest({
    required this.id,
    required this.organizationId,
    required this.documentName,
    required this.documentUrl,
    required this.requestedBy,
    required this.requestedTo,
    required this.status,
    this.message,
    this.signedAt,
    this.declinedAt,
    this.declineReason,
    this.signatureImageUrl,
    this.expiresAt,
    required this.createdAt,
    required this.requester,
    required this.signer,
  });

  factory ESignatureRequest.fromJson(Map<String, dynamic> j) => ESignatureRequest(
        id: j['id'] as String,
        organizationId: j['organizationId'] as String,
        documentName: j['documentName'] as String,
        documentUrl: j['documentUrl'] as String,
        requestedBy: j['requestedBy'] as String,
        requestedTo: j['requestedTo'] as String,
        status: j['status'] as String,
        message: j['message'] as String?,
        signedAt: j['signedAt'] != null ? DateTime.parse(j['signedAt'] as String) : null,
        declinedAt: j['declinedAt'] != null ? DateTime.parse(j['declinedAt'] as String) : null,
        declineReason: j['declineReason'] as String?,
        signatureImageUrl: j['signatureImageUrl'] as String?,
        expiresAt: j['expiresAt'] != null ? DateTime.parse(j['expiresAt'] as String) : null,
        createdAt: DateTime.parse(j['createdAt'] as String),
        requester: ESignEmployee.fromJson(j['requester'] as Map<String, dynamic>),
        signer: ESignEmployee.fromJson(j['signer'] as Map<String, dynamic>),
      );

  bool get isPending => status == 'PENDING';
  bool get isSigned => status == 'SIGNED';
  bool get isDeclined => status == 'DECLINED';
}
