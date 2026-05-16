class Announcement {
  final String id;
  final String title;
  final String content;
  final bool isPinned;
  final DateTime? expiresAt;
  final DateTime createdAt;

  const Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.isPinned,
    this.expiresAt,
    required this.createdAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> j) => Announcement(
        id: j['id'] as String,
        title: j['title'] as String,
        content: j['content'] as String,
        isPinned: j['isPinned'] as bool,
        expiresAt: j['expiresAt'] != null
            ? DateTime.parse(j['expiresAt'] as String)
            : null,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}
