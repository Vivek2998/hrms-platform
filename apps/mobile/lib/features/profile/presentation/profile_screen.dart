import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/profile_provider.dart';
import '../../attendance/providers/geofence_provider.dart';
import '../../../core/geofence/geofence_manager.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authNotifierProvider);
    final profileAsync = ref.watch(myProfileProvider);
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
        ref.invalidate(myProfileProvider);
      }
    });

    return authAsync.when(
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) =>
          Scaffold(body: Center(child: Text('Error: $e'))),
      data: (auth) {
        final user = auth.user;
        if (user == null) return const Scaffold(body: SizedBox.shrink());
        final initials =
            '${user.firstName[0]}${user.lastName[0]}'.toUpperCase();

        return Scaffold(
          appBar: AppBar(
            title: const Text('My Profile'),
          ),
          body: SingleChildScrollView(
            child: Column(
              children: [
                // ── Avatar banner ─────────────────────────────────────
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
                                      color: scheme.surface, width: 2),
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
                                    : Icon(Icons.camera_alt,
                                        size: 14, color: scheme.onPrimary),
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
                      profileAsync.maybeWhen(
                        data: (p) => p.designation != null
                            ? Text(
                                p.designation!,
                                style: TextStyle(
                                    fontSize: 13,
                                    color: scheme.onSurfaceVariant),
                              )
                            : const SizedBox.shrink(),
                        orElse: () => const SizedBox.shrink(),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        user.workEmail,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: scheme.onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),

                // ── Work info ──────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SectionHeader('Work Information'),
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
                        profileAsync.maybeWhen(
                          data: (p) => Column(
                            children: [
                              if (p.departmentName != null)
                                _InfoTile(
                                  icon: Icons.business_outlined,
                                  label: 'Department',
                                  value: p.departmentName!,
                                ),
                              if (p.officeLocationName != null)
                                _InfoTile(
                                  icon: Icons.location_on_outlined,
                                  label: 'Office Location',
                                  value: p.officeLocationName!,
                                ),
                              if (p.dateOfJoining != null)
                                _InfoTile(
                                  icon: Icons.calendar_today_outlined,
                                  label: 'Date of Joining',
                                  value: DateFormat('d MMM y')
                                      .format(p.dateOfJoining!),
                                ),
                            ],
                          ),
                          orElse: () => const SizedBox.shrink(),
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

                // ── Personal info ──────────────────────────────────────
                profileAsync.maybeWhen(
                  data: (p) {
                    final hasPersonal = p.phone != null ||
                        p.dateOfBirth != null ||
                        p.bloodGroup != null;
                    if (!hasPersonal) return const SizedBox.shrink();
                    return Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                      child: Card(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _SectionHeader('Personal Information'),
                            if (p.phone != null)
                              _InfoTile(
                                icon: Icons.phone_outlined,
                                label: 'Phone',
                                value: p.phone!,
                              ),
                            if (p.dateOfBirth != null)
                              _InfoTile(
                                icon: Icons.cake_outlined,
                                label: 'Date of Birth',
                                value: DateFormat('d MMM y')
                                    .format(p.dateOfBirth!),
                              ),
                            if (p.bloodGroup != null)
                              _InfoTile(
                                icon: Icons.favorite_border,
                                label: 'Blood Group',
                                value: p.bloodGroup!,
                                isLast: true,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                  orElse: () => const SizedBox.shrink(),
                ),

                // ── Bank info ──────────────────────────────────────────
                profileAsync.maybeWhen(
                  data: (p) {
                    if (p.bankName == null && p.bankAccountNumber == null) {
                      return const SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                      child: Card(
                        child: Column(
                          children: [
                            _SectionHeader('Bank Details'),
                            if (p.bankName != null)
                              _InfoTile(
                                icon: Icons.account_balance_outlined,
                                label: 'Bank',
                                value: p.bankName!,
                              ),
                            if (p.bankAccountNumber != null)
                              _InfoTile(
                                icon: Icons.credit_card_outlined,
                                label: 'Account Number',
                                value: '••••${p.bankAccountNumber!.length > 4 ? p.bankAccountNumber!.substring(p.bankAccountNumber!.length - 4) : p.bankAccountNumber!}',
                              ),
                            if (p.bankIfsc != null)
                              _InfoTile(
                                icon: Icons.numbers_outlined,
                                label: 'IFSC',
                                value: p.bankIfsc!,
                                isLast: true,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                  orElse: () => const SizedBox.shrink(),
                ),

                // ── Admin tools (managers only) ───────────────────────
                if (['SUPER_ADMIN', 'ORG_ADMIN', 'HR']
                    .contains(user.role))
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: Card(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _SectionHeader('Admin Tools'),
                          ListTile(
                            leading: const Icon(Icons.location_on_outlined),
                            title: const Text('Employee Locations'),
                            subtitle: const Text(
                              'Assign office locations to employees',
                              style: TextStyle(fontSize: 12),
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () =>
                                context.push('/admin/employee-locations'),
                          ),
                        ],
                      ),
                    ),
                  ),

                // ── Smart Punch-In ────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _SmartPunchCard(),
                ),

                // ── Actions ────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: Column(
                    children: [
                      ListTile(
                        dense: true,
                        visualDensity: VisualDensity.compact,
                        leading: const Icon(Icons.lock_outline, size: 20),
                        title: const Text('Change Password',
                            style: TextStyle(fontSize: 14)),
                        trailing: const Icon(Icons.chevron_right, size: 18),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        tileColor: scheme.surfaceContainerLow,
                        onTap: () => context.push('/change-password'),
                      ),
                      const SizedBox(height: 10),
                      ListTile(
                        dense: true,
                        visualDensity: VisualDensity.compact,
                        leading:
                            Icon(Icons.logout, color: scheme.error, size: 20),
                        title: Text('Logout',
                            style: TextStyle(
                                color: scheme.error, fontSize: 14)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        tileColor: scheme.errorContainer.withValues(alpha: 0.3),
                        onTap: () => _confirmLogout(context, ref),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
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
    await ref.read(avatarUploadNotifierProvider.notifier).upload(picked.path);
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
            child: Text('Logout',
                style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
          letterSpacing: 0.8,
        ),
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
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          child: Row(
            children: [
              Icon(icon, size: 18, color: scheme.onSurfaceVariant),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: Text(label,
                    style: TextStyle(
                        color: scheme.onSurfaceVariant, fontSize: 13)),
              ),
              Expanded(
                flex: 3,
                child: Text(
                  value,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500, fontSize: 13),
                  textAlign: TextAlign.end,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        if (!isLast)
          Divider(height: 1, indent: 46, color: scheme.outlineVariant),
      ],
    );
  }
}

class _SmartPunchCard extends ConsumerStatefulWidget {
  const _SmartPunchCard();

  @override
  ConsumerState<_SmartPunchCard> createState() => _SmartPunchCardState();
}

class _SmartPunchCardState extends ConsumerState<_SmartPunchCard> {
  bool _requestingPermission = false;

  @override
  Widget build(BuildContext context) {
    final toggleState = ref.watch(smartPunchNotifierProvider);
    final configState = ref.watch(geofenceConfigProvider);
    final scheme = Theme.of(context).colorScheme;

    final isEnabled = toggleState.valueOrNull ?? false;
    final isLoading = toggleState.isLoading || _requestingPermission;
    final config = configState.valueOrNull;

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader('Smart Punch-In'),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 4),
            child: Row(
              children: [
                Icon(
                  Icons.my_location_rounded,
                  size: 18,
                  color: isEnabled ? scheme.primary : scheme.onSurfaceVariant,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Auto Punch-In',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: scheme.onSurface,
                        ),
                      ),
                      Text(
                        configState.when(
                          loading: () => 'Loading...',
                          error: (_, __) => 'Could not load office info',
                          data: (cfg) => cfg != null
                              ? cfg.name
                              : 'No location assigned',
                        ),
                        style: TextStyle(
                            fontSize: 11, color: scheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                Transform.scale(
                  scale: 0.8,
                  child: Switch(
                    value: isEnabled,
                    onChanged: isLoading ? null : (val) => _handleToggle(val),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            child: Text(
              isEnabled
                  ? 'You\'ll get a punch-in reminder near ${config?.name ?? 'your office'}.'
                  : 'Enable to get a punch-in reminder at your office.',
              style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleToggle(bool value) async {
    if (value) {
      setState(() => _requestingPermission = true);
      final granted =
          await GeofenceManager.instance.requestBackgroundPermission();
      setState(() => _requestingPermission = false);
      if (!granted) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                  'Location permission is required for Smart Punch-In'),
            ),
          );
        }
        return;
      }
    }
    await ref.read(smartPunchNotifierProvider.notifier).setEnabled(value);
  }
}
