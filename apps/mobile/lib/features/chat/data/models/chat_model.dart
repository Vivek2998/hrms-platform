class ChatSession {
  final String id;
  final DateTime updatedAt;
  final int messageCount;
  final String? lastMessage;

  const ChatSession({
    required this.id,
    required this.updatedAt,
    required this.messageCount,
    this.lastMessage,
  });

  factory ChatSession.fromJson(Map<String, dynamic> j) {
    final count = j['_count'] as Map<String, dynamic>?;
    final msgs = j['messages'] as List<dynamic>?;
    return ChatSession(
      id: j['id'] as String,
      updatedAt: DateTime.parse(j['updatedAt'] as String),
      messageCount: count?['messages'] as int? ?? 0,
      lastMessage: msgs != null && msgs.isNotEmpty
          ? (msgs.first as Map<String, dynamic>)['content'] as String?
          : null,
    );
  }
}

class ChatMessage {
  final String id;
  final String role;
  final String content;
  final DateTime createdAt;

  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        id: j['id'] as String,
        role: j['role'] as String,
        content: j['content'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );

  bool get isUser => role == 'user';
}
