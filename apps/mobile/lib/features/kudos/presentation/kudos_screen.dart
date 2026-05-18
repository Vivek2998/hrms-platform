import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../data/models/kudos_model.dart';
import '../providers/kudos_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';

class KudosScreen extends ConsumerStatefulWidget {
  const KudosScreen({super.key});

  @override
  ConsumerState<KudosScreen> createState() => _KudosScreenState();
}

class _KudosScreenState extends ConsumerState<KudosScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final auth = ref.watch(authNotifierProvider);
    final me = auth.valueOrNull?.user;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Recognition Wall'),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: scheme.onSurface,
        bottom: TabBar(
          controller: _tabs,
          labelColor: AppColors.primary,
          unselectedLabelColor: scheme.onSurfaceVariant,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'All Kudos'),
            Tab(text: 'My Kudos'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showGiveDialog(context),
        backgroundColor: const Color(0xFFE11D48),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.favorite_rounded),
        label: const Text('Give Kudos'),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _KudosFeed(currentUserId: me?.employeeId ?? ''),
          _MyKudosList(currentUserId: me?.employeeId ?? ''),
        ],
      ),
    );
  }

  void _showGiveDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _GiveKudosSheet(
        onSent: () => ref.invalidate(kudosFeedProvider),
      ),
    );
  }
}

// ── Feed Tab ──────────────────────────────────────────────────────────────────

class _KudosFeed extends ConsumerWidget {
  final String currentUserId;
  const _KudosFeed({required this.currentUserId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(kudosFeedProvider);
    return feedAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: Colors.red),
            const SizedBox(height: 12),
            const Text('Failed to load feed'),
            TextButton(
                onPressed: () => ref.invalidate(kudosFeedProvider),
                child: const Text('Retry')),
          ],
        ),
      ),
      data: (items) {
        if (items.isEmpty) {
          return const _EmptyKudos(
            message: 'Be the first to recognise someone!',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(kudosFeedProvider),
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _KudosCard(
              kudos: items[i],
              currentUserId: currentUserId,
            ),
          ),
        );
      },
    );
  }
}

// ── My Kudos Tab ──────────────────────────────────────────────────────────────

class _MyKudosList extends ConsumerWidget {
  final String currentUserId;
  const _MyKudosList({required this.currentUserId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(myKudosProvider);
    return listAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: Colors.red),
            const SizedBox(height: 12),
            const Text('Failed to load your kudos'),
            TextButton(
                onPressed: () => ref.invalidate(myKudosProvider),
                child: const Text('Retry')),
          ],
        ),
      ),
      data: (items) {
        if (items.isEmpty) {
          return const _EmptyKudos(
            message: 'You haven\'t received any kudos yet.',
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(myKudosProvider),
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _KudosCard(
              kudos: items[i],
              currentUserId: currentUserId,
            ),
          ),
        );
      },
    );
  }
}

// ── Kudos Card ────────────────────────────────────────────────────────────────

class _KudosCard extends ConsumerWidget {
  final Kudos kudos;
  final String currentUserId;
  const _KudosCard({required this.kudos, required this.currentUserId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final isOwner = kudos.fromEmployeeId == currentUserId;
    final emoji = kudosCategoryEmoji(kudos.category);
    final label = kudosCategoryLabel(kudos.category);
    final age = _timeAgo(kudos.createdAt);

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── From ─────────────────────────────────────────
            Row(
              children: [
                _Avatar(name: kudos.fromEmployee.initials, colors: [const Color(0xFFE11D48), const Color(0xFF9333EA)]),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(kudos.fromEmployee.fullName,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      Text(kudos.fromEmployee.designation ?? kudos.fromEmployee.employeeCode,
                          style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                Text(age, style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant)),
                if (isOwner) ...[
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _delete(context, ref),
                    child: const Icon(Icons.delete_outline_rounded, size: 16, color: Colors.red),
                  ),
                ],
              ],
            ),

            // ── To & Category ─────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Text('→ ', style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 12)),
                  _Avatar(name: kudos.toEmployee.initials, colors: [const Color(0xFF6366F1), const Color(0xFF06B6D4)], size: 22),
                  const SizedBox(width: 6),
                  Text(kudos.toEmployee.fullName,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('$emoji $label',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFFB91C1C))),
                  ),
                ],
              ),
            ),

            // ── Message ───────────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '"${kudos.message}"',
                style: TextStyle(
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  color: scheme.onSurface,
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 10),

            // ── Reactions ─────────────────────────────────────
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: kQuickReactions.map((emoji) {
                final reactors = kudos.reactions[emoji] ?? [];
                final reacted = reactors.contains(currentUserId);
                return GestureDetector(
                  onTap: () => ref.read(kudosNotifierProvider.notifier).react(kudos.id, emoji),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: reacted ? const Color(0xFFFEE2E2) : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: reacted ? const Color(0xFFE11D48) : scheme.outlineVariant,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(emoji, style: const TextStyle(fontSize: 14)),
                        if (reactors.isNotEmpty) ...[
                          const SizedBox(width: 4),
                          Text('${reactors.length}',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: reacted ? const Color(0xFFE11D48) : scheme.onSurfaceVariant)),
                        ],
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Kudos'),
        content: const Text('Remove this kudos post?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(kudosNotifierProvider.notifier).delete(kudos.id);
    }
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('dd MMM').format(dt);
  }
}

// ── Avatar ────────────────────────────────────────────────────────────────────

class _Avatar extends StatelessWidget {
  final String name;
  final List<Color> colors;
  final double size;
  const _Avatar({required this.name, required this.colors, this.size = 32});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        name,
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: size * 0.35),
      ),
    );
  }
}

// ── Give Kudos Sheet ──────────────────────────────────────────────────────────

class _GiveKudosSheet extends ConsumerStatefulWidget {
  final VoidCallback onSent;
  const _GiveKudosSheet({required this.onSent});

  @override
  ConsumerState<_GiveKudosSheet> createState() => _GiveKudosSheetState();
}

class _GiveKudosSheetState extends ConsumerState<_GiveKudosSheet> {
  final _toCtrl = TextEditingController();
  final _msgCtrl = TextEditingController();
  String _category = 'TEAMWORK';
  bool _sending = false;

  @override
  void dispose() {
    _toCtrl.dispose();
    _msgCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: scheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Give Kudos ❤️',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),

            // Employee ID
            TextField(
              controller: _toCtrl,
              decoration: const InputDecoration(
                labelText: 'Employee ID (UUID)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person_outline_rounded),
              ),
            ),
            const SizedBox(height: 16),

            // Category grid
            const Text('Category', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: kKudosCategories.map((c) {
                final selected = _category == c.value;
                return GestureDetector(
                  onTap: () => setState(() => _category = c.value),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: selected ? const Color(0xFFFEE2E2) : Colors.transparent,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? const Color(0xFFE11D48) : scheme.outlineVariant,
                        width: selected ? 1.5 : 1,
                      ),
                    ),
                    child: Text(
                      '${c.emoji} ${c.label}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: selected ? const Color(0xFFE11D48) : scheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Message
            TextField(
              controller: _msgCtrl,
              maxLines: 3,
              maxLength: 500,
              decoration: const InputDecoration(
                labelText: 'Recognition message',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.message_outlined),
              ),
            ),
            const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _sending ? null : _send,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFE11D48),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: _sending
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Send Kudos ❤️', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _send() async {
    final toId = _toCtrl.text.trim();
    final msg = _msgCtrl.text.trim();
    if (toId.isEmpty || msg.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please fill in all fields')));
      return;
    }
    setState(() => _sending = true);
    try {
      await ref.read(kudosNotifierProvider.notifier).give(
            toEmployeeId: toId,
            category: _category,
            message: msg,
          );
      if (mounted) {
        widget.onSent();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Kudos sent!')));
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}

// ── Empty State ───────────────────────────────────────────────────────────────

class _EmptyKudos extends StatelessWidget {
  final String message;
  const _EmptyKudos({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🎉', style: TextStyle(fontSize: 64)),
          const SizedBox(height: 16),
          Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
