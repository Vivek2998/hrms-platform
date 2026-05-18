import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/models/esignature_model.dart';
import '../providers/esignature_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';

class ESignatureScreen extends ConsumerStatefulWidget {
  const ESignatureScreen({super.key});

  @override
  ConsumerState<ESignatureScreen> createState() => _ESignatureScreenState();
}

class _ESignatureScreenState extends ConsumerState<ESignatureScreen>
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
        title: const Text('E-Signatures'),
        centerTitle: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: scheme.onSurface,
        bottom: TabBar(
          controller: _tabs,
          labelColor: const Color(0xFF7C3AED),
          unselectedLabelColor: scheme.onSurfaceVariant,
          indicatorColor: const Color(0xFF7C3AED),
          tabs: const [
            Tab(text: 'Needs My Sign'),
            Tab(text: 'My Requests'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showRequestDialog(context),
        backgroundColor: const Color(0xFF7C3AED),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.send_rounded),
        label: const Text('Request Signature'),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _PendingList(currentUserId: me?.employeeId ?? ''),
          _SentList(currentUserId: me?.employeeId ?? ''),
        ],
      ),
    );
  }

  void _showRequestDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _RequestSignatureSheet(
        onCreated: () => ref.invalidate(mySignatureRequestsProvider),
      ),
    );
  }
}

// ── Pending List ──────────────────────────────────────────────────────────────

class _PendingList extends ConsumerWidget {
  final String currentUserId;
  const _PendingList({required this.currentUserId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(pendingSignaturesProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(onRetry: () => ref.invalidate(pendingSignaturesProvider)),
      data: (items) {
        if (items.isEmpty) {
          return const _Empty(message: 'No documents waiting for your signature');
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(pendingSignaturesProvider),
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _SignatureCard(
              request: items[i],
              isPending: true,
            ),
          ),
        );
      },
    );
  }
}

// ── Sent List ─────────────────────────────────────────────────────────────────

class _SentList extends ConsumerWidget {
  final String currentUserId;
  const _SentList({required this.currentUserId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(mySignatureRequestsProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => _ErrorRetry(onRetry: () => ref.invalidate(mySignatureRequestsProvider)),
      data: (items) {
        if (items.isEmpty) {
          return const _Empty(message: 'No signature requests sent yet');
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(mySignatureRequestsProvider),
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => _SignatureCard(
              request: items[i],
              isPending: false,
            ),
          ),
        );
      },
    );
  }
}

// ── Signature Card ────────────────────────────────────────────────────────────

class _SignatureCard extends ConsumerWidget {
  final ESignatureRequest request;
  final bool isPending;
  const _SignatureCard({required this.request, required this.isPending});

  static const _statusMeta = {
    'PENDING': (label: 'Pending', color: Color(0xFFF59E0B)),
    'SIGNED': (label: 'Signed', color: Color(0xFF10B981)),
    'DECLINED': (label: 'Declined', color: Color(0xFFEF4444)),
    'EXPIRED': (label: 'Expired', color: Color(0xFF6B7280)),
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final meta = _statusMeta[request.status] ??
        (label: request.status, color: const Color(0xFF6B7280));
    final age = _timeAgo(request.createdAt);

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
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: meta.color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: meta.color.withValues(alpha: 0.3)),
                  ),
                  child: Text(meta.label,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: meta.color)),
                ),
                const Spacer(),
                Text(age, style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.description_outlined, size: 16, color: Color(0xFF7C3AED)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    request.documentName,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              isPending
                  ? 'From: ${request.requester.fullName}'
                  : 'To sign: ${request.signer.fullName}',
              style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
            ),
            if (request.message != null) ...[
              const SizedBox(height: 4),
              Text(
                request.message!,
                style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: scheme.onSurfaceVariant),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                // View document
                GestureDetector(
                  onTap: () async {
                    final uri = Uri.tryParse(request.documentUrl);
                    if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
                  },
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.open_in_new_rounded, size: 14, color: Color(0xFF7C3AED)),
                      SizedBox(width: 4),
                      Text('View Doc', style: TextStyle(fontSize: 12, color: Color(0xFF7C3AED), fontWeight: FontWeight.w600)),
                    ],
                  ),
                ),
                const Spacer(),
                if (isPending && request.isPending) ...[
                  _SmallBtn(
                    label: 'Decline',
                    color: Colors.red,
                    onTap: () => _decline(context, ref),
                  ),
                  const SizedBox(width: 8),
                  _SmallBtn(
                    label: 'Sign',
                    color: const Color(0xFF7C3AED),
                    filled: true,
                    onTap: () => _sign(context, ref),
                  ),
                ],
                if (!isPending && request.isPending)
                  GestureDetector(
                    onTap: () => _delete(context, ref),
                    child: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.red),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sign(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Sign Document'),
        content: Text('Confirm your signature on "${request.documentName}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF7C3AED)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm & Sign'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    // Use a placeholder signature URL (in production, open a signature canvas)
    await ref.read(eSignatureNotifierProvider.notifier).sign(
          request.id,
          'signed:${DateTime.now().toIso8601String()}',
        );
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document signed successfully')));
    }
  }

  Future<void> _decline(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Decline Signature'),
        content: const Text('Are you sure you want to decline this signature request?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Decline'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    await ref.read(eSignatureNotifierProvider.notifier).decline(request.id);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Signature request declined')));
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel Request'),
        content: const Text('Cancel this signature request?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Cancel Request'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    await ref.read(eSignatureNotifierProvider.notifier).delete(request.id);
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('dd MMM').format(dt);
  }
}

class _SmallBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool filled;
  const _SmallBtn({required this.label, required this.color, required this.onTap, this.filled = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: filled ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color),
        ),
        child: Text(label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: filled ? Colors.white : color)),
      ),
    );
  }
}

// ── Request Sheet ─────────────────────────────────────────────────────────────

class _RequestSignatureSheet extends ConsumerStatefulWidget {
  final VoidCallback onCreated;
  const _RequestSignatureSheet({required this.onCreated});

  @override
  ConsumerState<_RequestSignatureSheet> createState() => _RequestSignatureSheetState();
}

class _RequestSignatureSheetState extends ConsumerState<_RequestSignatureSheet> {
  final _toCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _urlCtrl = TextEditingController();
  final _msgCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _toCtrl.dispose();
    _nameCtrl.dispose();
    _urlCtrl.dispose();
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
            const Text('Request E-Signature',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),
            TextField(
              controller: _toCtrl,
              decoration: const InputDecoration(
                labelText: 'Signer Employee ID',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.person_outline_rounded),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Document Name',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.description_outlined),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _urlCtrl,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                labelText: 'Document URL',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.link_rounded),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _msgCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Message (optional)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.message_outlined),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _submitting ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Send Request', style: TextStyle(fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final to = _toCtrl.text.trim();
    final name = _nameCtrl.text.trim();
    final url = _urlCtrl.text.trim();
    if (to.isEmpty || name.isEmpty || url.isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Please fill in all required fields')));
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(eSignatureNotifierProvider.notifier).create(
            requestedTo: to,
            documentName: name,
            documentUrl: url,
            message: _msgCtrl.text.trim().isNotEmpty ? _msgCtrl.text.trim() : null,
          );
      if (mounted) {
        widget.onCreated();
        Navigator.pop(context);
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Signature request sent')));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _ErrorRetry extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorRetry({required this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: Colors.red),
            const SizedBox(height: 12),
            const Text('Failed to load'),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      );
}

class _Empty extends StatelessWidget {
  final String message;
  const _Empty({required this.message});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.draw_rounded, size: 48, color: AppColors.primary.withValues(alpha: 0.4)),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
          ],
        ),
      );
}
