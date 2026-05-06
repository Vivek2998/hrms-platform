import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authNotifierProvider);
    final uploadState = ref.watch(avatarUploadNotifierProvider);
    final scheme = Theme.of(context).colorScheme;

    ref.listen(avatarUploadNotifierProvider, (_, next) {
      if (next.hasError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error?.toString() ?? 'Upload failed'),
            backgroundColor: scheme.error,
          ),
        );
      } else if (next.hasValue && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile photo updated'),
            backgroundColor: Colors.green,
          ),
        );
      }
    });

    return authAsync.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => Scaffold(body: Center(child: Text('Error: $e'))),
      data: (auth) {
        final user = auth.user;
        if (user == null) return const Scaffold(body: SizedBox.shrink());

        final initials =
            '${user.firstName[0]}${user.lastName[0]}'.toUpperCase();

        return Scaffold(
          appBar: AppBar(title: const Text('Profile')),
          body: SingleChildScrollView(
            child: Column(
              children: [
                // ── Avatar banner ───────────────────────────────────────
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  color: scheme.surfaceContainerHighest,
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          CircleAvatar(
                            radius: 48,
                            backgroundColor: scheme.primaryContainer,
                            backgroundImage: user.avatarUrl != null
                                ? CachedNetworkImageProvider(user.avatarUrl!)
                                : null,
                            child: user.avatarUrl == null
                                ? Text(
                                    initials,
                                    style: TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w600,
                                      color: scheme.onPrimaryContainer,
                                    ),
                                  )
                                : null,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: GestureDetector(
                              onTap: uploadState.isLoading
                                  ? null
                                  : () => _pickAndUpload(context, ref),
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: scheme.primary,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: scheme.surface,
                                    width: 2,
                                  ),
                                ),
                                child: uploadState.isLoading
                                    ? SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: scheme.onPrimary,
                                        ),
                                      )
                                    : Icon(
                                        Icons.camera_alt,
                                        size: 14,
                                        color: scheme.onPrimary,
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '${user.firstName} ${user.lastName}',
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user.workEmail,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: scheme.onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),

                // ── Info rows ───────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Card(
                    child: Column(
                      children: [
                        _InfoTile(
                          icon: Icons.badge_outlined,
                          label: 'Employee Code',
                          value: user.employeeCode,
                        ),
                        _InfoTile(
                          icon: Icons.work_outline,
                          label: 'Role',
                          value: user.role
                              .replaceAll('_', ' ')
                              .split(' ')
                              .map((w) =>
                                  w[0].toUpperCase() +
                                  w.substring(1).toLowerCase())
                              .join(' '),
                        ),
                        _InfoTile(
                          icon: Icons.email_outlined,
                          label: 'Work Email',
                          value: user.workEmail,
                          isLast: true,
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Actions ─────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.lock_outline),
                        title: const Text('Change Password'),
                        trailing: const Icon(Icons.chevron_right),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        tileColor:
                            Theme.of(context).colorScheme.surfaceContainerLow,
                        onTap: () => context.push('/change-password'),
                      ),
                      const SizedBox(height: 12),
                      ListTile(
                        leading: Icon(Icons.logout,
                            color: scheme.error),
                        title: Text('Logout',
                            style: TextStyle(color: scheme.error)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        tileColor:
                            scheme.errorContainer.withValues(alpha: 0.3),
                        onTap: () => _confirmLogout(context, ref),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> _pickAndUpload(BuildContext context, WidgetRef ref) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 800,
    );
    if (picked == null) return;
    await ref
        .read(avatarUploadNotifierProvider.notifier)
        .upload(picked.path);
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ref.read(authNotifierProvider.notifier).logout();
            },
            child: Text(
              'Logout',
              style: TextStyle(
                  color: Theme.of(context).colorScheme.error),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isLast;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 20, color: scheme.onSurfaceVariant),
              const SizedBox(width: 12),
              Expanded(
                child: Text(label,
                    style: TextStyle(
                        color: scheme.onSurfaceVariant, fontSize: 13)),
              ),
              Text(value,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500, fontSize: 13)),
            ],
          ),
        ),
        if (!isLast)
          Divider(height: 1, indent: 48, color: scheme.outlineVariant),
      ],
    );
  }
}
