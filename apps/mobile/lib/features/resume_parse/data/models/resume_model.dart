class ParsedResume {
  final String id, fileName, fileUrl, status;
  final Map<String, dynamic>? parsedData;
  final DateTime createdAt;

  ParsedResume({
    required this.id,
    required this.fileName,
    required this.fileUrl,
    required this.status,
    this.parsedData,
    required this.createdAt,
  });

  factory ParsedResume.fromJson(Map<String, dynamic> j) => ParsedResume(
        id: j['id'],
        fileName: j['fileName'],
        fileUrl: j['fileUrl'],
        status: j['status'],
        parsedData: j['parsedData'] as Map<String, dynamic>?,
        createdAt: DateTime.parse(j['createdAt']),
      );

  String get candidateName => parsedData?['name'] as String? ?? 'Unknown';
  List<dynamic> get skills => parsedData?['skills'] as List? ?? [];
}
