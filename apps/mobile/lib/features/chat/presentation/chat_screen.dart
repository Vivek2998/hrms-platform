import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/chat_provider.dart';
import '../data/models/chat_model.dart';

Widget _botIcon({required double size, required String stroke}) =>
    SvgPicture.string(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="$stroke" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
      width: size,
      height: size,
    );

class ChatScreen extends ConsumerWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionId = ref.watch(activeChatSessionProvider);
    final sessionsAsync = ref.watch(chatSessionsProvider);
    final notifier = ref.read(chatNotifierProvider.notifier);

    if (sessionId != null) {
      return _ChatWindow(sessionId: sessionId);
    }

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Assistant'),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () async {
                  final id = await notifier.createSession();
                  if (id != null) {
                    ref.read(activeChatSessionProvider.notifier).state = id;
                  }
                },
                icon: const Icon(Icons.add_comment_outlined),
                label: const Text('New Conversation'),
              ),
            ),
          ),
          Expanded(
            child: sessionsAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (_, __) => const Center(
                  child: Text('Failed to load sessions')),
              data: (sessions) => sessions.isEmpty
                  ? _EmptySessionState(
                      onCreate: () async {
                        final id = await notifier.createSession();
                        if (id != null) {
                          ref
                              .read(activeChatSessionProvider.notifier)
                              .state = id;
                        }
                      },
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      itemCount: sessions.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: 8),
                      itemBuilder: (_, i) => _SessionTile(
                        session: sessions[i],
                        onTap: () {
                          ref
                              .read(activeChatSessionProvider.notifier)
                              .state = sessions[i].id;
                        },
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SessionTile extends StatelessWidget {
  final ChatSession session;
  final VoidCallback onTap;
  const _SessionTile({required this.session, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        onTap: onTap,
        leading: CircleAvatar(
          backgroundColor: AppColors.primaryLight,
          child: _botIcon(size: 20, stroke: '#4F46E5'),
        ),
        title: Text(
          session.lastMessage ?? 'New conversation',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 13),
        ),
        subtitle: Text(
          '${DateFormat('dd MMM, HH:mm').format(session.updatedAt)} · ${session.messageCount} messages',
          style: const TextStyle(fontSize: 11),
        ),
        trailing: const Icon(Icons.chevron_right,
            color: Colors.grey, size: 18),
      ),
    );
  }
}

class _ChatWindow extends ConsumerStatefulWidget {
  final String sessionId;
  const _ChatWindow({required this.sessionId});

  @override
  ConsumerState<_ChatWindow> createState() => _ChatWindowState();
}

class _ChatWindowState extends ConsumerState<_ChatWindow> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  bool _sending = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(chatMessagesProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: Row(
          children: [
            _botIcon(size: 20, stroke: '#4F46E5'),
            const SizedBox(width: 8),
            const Text('HR Assistant'),
          ],
        ),
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            ref.read(activeChatSessionProvider.notifier).state = null;
          },
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (_, __) =>
                  const Center(child: Text('Failed to load messages')),
              data: (messages) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (_scroll.hasClients) {
                    _scroll.animateTo(
                      _scroll.position.maxScrollExtent,
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeOut,
                    );
                  }
                });
                if (messages.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _botIcon(size: 48, stroke: '#9E9E9E'),
                        const SizedBox(height: 12),
                        const Text('Ask me anything about HR!',
                            style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  );
                }
                return ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (_, i) =>
                      _MessageBubble(message: messages[i]),
                );
              },
            ),
          ),
          if (_sending)
            Padding(
              padding: const EdgeInsets.only(left: 16, bottom: 4),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 12,
                    backgroundColor: AppColors.primaryLight,
                    child: _botIcon(size: 14, stroke: '#4F46E5'),
                  ),
                  SizedBox(width: 8),
                  Text('Thinking...',
                      style: TextStyle(
                          fontSize: 12, color: Colors.grey)),
                ],
              ),
            ),
          _InputBar(
            ctrl: _ctrl,
            onSend: _send,
            enabled: !_sending,
          ),
        ],
      ),
    );
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _sending) return;
    _ctrl.clear();
    setState(() => _sending = true);
    await ref
        .read(chatNotifierProvider.notifier)
        .sendMessage(widget.sessionId, text);
    if (mounted) setState(() => _sending = false);
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;
    return Align(
      alignment:
          isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.78),
        padding: const EdgeInsets.symmetric(
            horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isUser ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isUser
                ? const Radius.circular(16)
                : const Radius.circular(4),
            bottomRight: isUser
                ? const Radius.circular(4)
                : const Radius.circular(16),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(10),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Text(
          message.content,
          style: TextStyle(
            fontSize: 14,
            color: isUser ? Colors.white : Colors.black87,
            height: 1.4,
          ),
        ),
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  final TextEditingController ctrl;
  final VoidCallback onSend;
  final bool enabled;
  const _InputBar(
      {required this.ctrl,
      required this.onSend,
      required this.enabled});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
          left: 12,
          right: 12,
          top: 8,
          bottom: MediaQuery.of(context).viewInsets.bottom + 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: ctrl,
              enabled: enabled,
              decoration: InputDecoration(
                hintText:
                    'Ask about leave, payslips, policies...',
                hintStyle: const TextStyle(
                    fontSize: 13, color: Colors.grey),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: AppColors.surface,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
              ),
              onSubmitted: (_) => onSend(),
              maxLines: null,
              textInputAction: TextInputAction.send,
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: enabled ? onSend : null,
            icon: Icon(Icons.send_rounded,
                color: enabled ? AppColors.primary : Colors.grey),
          ),
        ],
      ),
    );
  }
}

class _EmptySessionState extends StatelessWidget {
  final VoidCallback onCreate;
  const _EmptySessionState({required this.onCreate});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _botIcon(size: 64, stroke: '#9E9E9E'),
          const SizedBox(height: 16),
          const Text('No conversations yet',
              style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w600)),
          const Text(
              'Start a conversation with your HR Assistant.',
              style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: onCreate,
            icon: const Icon(Icons.add),
            label: const Text('Start Conversation'),
          ),
        ],
      ),
    );
  }
}
