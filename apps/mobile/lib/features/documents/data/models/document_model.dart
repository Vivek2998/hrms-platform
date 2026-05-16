class AppDocument {
  final String id;
  final String name;
  final String type;
  final String url;
  final int? size;
  final String? mimeType;
  final DateTime createdAt;

  const AppDocument({
    required this.id,
    required this.name,
    required this.type,
    required this.url,
    this.size,
    this.mimeType,
    required this.createdAt,
  });

  String get typeLabel => switch (type) {
        'OFFER_LETTER' => 'Offer Letter',
        'APPOINTMENT_LETTER' => 'Appointment Letter',
        'ID_PROOF' => 'ID Proof',
        'ADDRESS_PROOF' => 'Address Proof',
        'EDUCATIONAL' => 'Educational',
        'PAYSLIP' => 'Payslip',
        'FORM_16' => 'Form 16',
        'EXPERIENCE_LETTER' => 'Experience Letter',
        'RELIEVING_LETTER' => 'Relieving Letter',
        _ => 'Document',
      };

  String get sizeLabel {
    if (size == null) return '';
    if (size! < 1024) return '${size}B';
    if (size! < 1024 * 1024) return '${(size! / 1024).toStringAsFixed(1)}KB';
    return '${(size! / 1024 / 1024).toStringAsFixed(1)}MB';
  }

  bool get isPdf =>
      mimeType == 'application/pdf' || url.toLowerCase().endsWith('.pdf');

  factory AppDocument.fromJson(Map<String, dynamic> json) => AppDocument(
        id: json['id'] as String,
        name: json['name'] as String,
        type: json['type'] as String,
        url: json['url'] as String,
        size: json['size'] as int?,
        mimeType: json['mimeType'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
