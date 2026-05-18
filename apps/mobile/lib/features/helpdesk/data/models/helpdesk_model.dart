class HelpdeskTicket {
  final String id;
  final String subject;
  final String description;
  final String category;
  final String status;
  final String priority;
  final DateTime createdAt;
  final int commentCount;
  final String? employeeFirstName;
  final String? employeeLastName;

  const HelpdeskTicket({
    required this.id,
    required this.subject,
    required this.description,
    required this.category,
    required this.status,
    required this.priority,
    required this.createdAt,
    required this.commentCount,
    this.employeeFirstName,
    this.employeeLastName,
  });

  factory HelpdeskTicket.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'] as Map<String, dynamic>?;
    final count = json['_count'] as Map<String, dynamic>?;
    return HelpdeskTicket(
      id: json['id'] as String,
      subject: json['subject'] as String,
      description: json['description'] as String,
      category: json['category'] as String? ?? 'GENERAL',
      status: json['status'] as String? ?? 'OPEN',
      priority: json['priority'] as String? ?? 'MEDIUM',
      createdAt: DateTime.parse(json['createdAt'] as String),
      commentCount: count?['comments'] as int? ?? 0,
      employeeFirstName: emp?['firstName'] as String?,
      employeeLastName: emp?['lastName'] as String?,
    );
  }
}

class HelpdeskComment {
  final String id;
  final String authorId;
  final String body;
  final bool isInternal;
  final DateTime createdAt;

  const HelpdeskComment({
    required this.id,
    required this.authorId,
    required this.body,
    required this.isInternal,
    required this.createdAt,
  });

  factory HelpdeskComment.fromJson(Map<String, dynamic> json) =>
      HelpdeskComment(
        id: json['id'] as String,
        authorId: json['authorId'] as String,
        body: json['body'] as String,
        isInternal: json['isInternal'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class HelpdeskTicketDetail extends HelpdeskTicket {
  final List<HelpdeskComment> comments;

  const HelpdeskTicketDetail({
    required super.id,
    required super.subject,
    required super.description,
    required super.category,
    required super.status,
    required super.priority,
    required super.createdAt,
    required super.commentCount,
    super.employeeFirstName,
    super.employeeLastName,
    required this.comments,
  });

  factory HelpdeskTicketDetail.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'] as Map<String, dynamic>?;
    final rawComments = json['comments'] as List<dynamic>? ?? [];
    return HelpdeskTicketDetail(
      id: json['id'] as String,
      subject: json['subject'] as String,
      description: json['description'] as String,
      category: json['category'] as String? ?? 'GENERAL',
      status: json['status'] as String? ?? 'OPEN',
      priority: json['priority'] as String? ?? 'MEDIUM',
      createdAt: DateTime.parse(json['createdAt'] as String),
      commentCount: rawComments.length,
      employeeFirstName: emp?['firstName'] as String?,
      employeeLastName: emp?['lastName'] as String?,
      comments: rawComments
          .map((c) =>
              HelpdeskComment.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }
}
