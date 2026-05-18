import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import '../../../core/services/biometric_service.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/dio/dio_client.dart';

class BiometricPreferenceScreen extends ConsumerStatefulWidget {
  const BiometricPreferenceScreen({super.key});

  @override
  ConsumerState<BiometricPreferenceScreen> createState() =>
      _BiometricPreferenceScreenState();
}

class _BiometricPreferenceScreenState
    extends ConsumerState<BiometricPreferenceScreen> {
  BiometricPreference _selected = BiometricPreference.fingerprintFirst;
  bool _hasFingerprint = false;
  bool _hasFaceId = false;
  bool _deviceSupported = false;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final service = ref.read(biometricServiceProvider);
    final storage = ref.read(secureStorageProvider);
    final supported = await service.isAvailable();
    final types = await service.getAvailableTypes();
    final pref = await storage.getBiometricPreference();
    if (mounted) {
      setState(() {
        _deviceSupported = supported;
        _hasFingerprint = types.contains(BiometricType.fingerprint) ||
            types.contains(BiometricType.strong);
        _hasFaceId = types.contains(BiometricType.face);
        _selected = pref;
        _loading = false;
      });
    }
  }

  Future<void> _save(BiometricPreference pref) async {
    setState(() => _saving = true);
    try {
      final storage = ref.read(secureStorageProvider);
      await storage.setBiometricPreference(pref);
      // Sync with server
      final dio = ref.read(dioClientProvider);
      await dio.patch('/employees/me/biometric-preference',
          data: {'preference': pref.apiValue});
      if (mounted) {
        setState(() => _selected = pref);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Biometric preference saved'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (_) {
      // Still save locally even if API fails
      final storage = ref.read(secureStorageProvider);
      await storage.setBiometricPreference(pref);
      if (mounted) {
        setState(() => _selected = pref);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Saved locally (will sync when online)'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Biometric Attendance')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // ── Device capability banner ──────────────────────────
                _CapabilityCard(
                  hasFingerprint: _hasFingerprint,
                  hasFaceId: _hasFaceId,
                  deviceSupported: _deviceSupported,
                ),
                const SizedBox(height: 24),

                Text(
                  'Punch Authentication Method',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                Text(
                  'Choose how you want to authenticate when punching attendance. '
                  'If your preferred method fails, you can always use Manual Punch.',
                  style: TextStyle(
                      fontSize: 13, color: scheme.onSurfaceVariant),
                ),
                const SizedBox(height: 16),

                // ── Options ───────────────────────────────────────────
                _OptionTile(
                  value: BiometricPreference.fingerprintFirst,
                  selected: _selected,
                  title: 'Fingerprint first (recommended)',
                  subtitle: _hasFingerprint
                      ? 'Use fingerprint → falls back to Face ID if unavailable'
                      : 'No fingerprint sensor enrolled on this device',
                  icon: Icons.fingerprint,
                  iconColor: _hasFingerprint
                      ? Colors.indigo
                      : scheme.onSurfaceVariant,
                  enabled: _hasFingerprint,
                  onTap: _hasFingerprint ? () => _save(BiometricPreference.fingerprintFirst) : null,
                ),
                _OptionTile(
                  value: BiometricPreference.faceFirst,
                  selected: _selected,
                  title: 'Face ID first',
                  subtitle: _hasFaceId
                      ? 'Use Face ID → falls back to fingerprint if unavailable'
                      : 'No face biometric enrolled on this device',
                  icon: Icons.face_retouching_natural,
                  iconColor:
                      _hasFaceId ? Colors.cyan.shade700 : scheme.onSurfaceVariant,
                  enabled: _hasFaceId,
                  onTap: _hasFaceId ? () => _save(BiometricPreference.faceFirst) : null,
                ),
                _OptionTile(
                  value: BiometricPreference.biometricAny,
                  selected: _selected,
                  title: 'Any biometric',
                  subtitle: 'System decides the best available method',
                  icon: Icons.security,
                  iconColor: Colors.teal,
                  enabled: _deviceSupported && (_hasFingerprint || _hasFaceId),
                  onTap: (_deviceSupported && (_hasFingerprint || _hasFaceId))
                      ? () => _save(BiometricPreference.biometricAny)
                      : null,
                ),
                _OptionTile(
                  value: BiometricPreference.noBiometric,
                  selected: _selected,
                  title: 'Manual punch only',
                  subtitle: 'Skip biometric — punch is recorded with GPS only',
                  icon: Icons.touch_app_outlined,
                  iconColor: scheme.onSurfaceVariant,
                  enabled: true,
                  onTap: () => _save(BiometricPreference.noBiometric),
                ),

                if (_saving) ...[
                  const SizedBox(height: 16),
                  const Center(child: CircularProgressIndicator()),
                ],

                const SizedBox(height: 32),
                // ── Info note ─────────────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: scheme.primaryContainer.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: scheme.primary.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline,
                          size: 18, color: scheme.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Your HR/Admin can also update this preference from the web portal. '
                          'Biometric data stays on your device — only the punch record and method are sent to the server.',
                          style: TextStyle(
                              fontSize: 12, color: scheme.onSurfaceVariant),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _CapabilityCard extends StatelessWidget {
  final bool hasFingerprint;
  final bool hasFaceId;
  final bool deviceSupported;

  const _CapabilityCard({
    required this.hasFingerprint,
    required this.hasFaceId,
    required this.deviceSupported,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Device Capabilities',
                style: Theme.of(context)
                    .textTheme
                    .labelLarge
                    ?.copyWith(color: scheme.onSurfaceVariant)),
            const SizedBox(height: 12),
            _Cap(
              icon: Icons.fingerprint,
              label: 'Fingerprint sensor',
              available: hasFingerprint,
            ),
            const SizedBox(height: 8),
            _Cap(
              icon: Icons.face_retouching_natural,
              label: 'Face ID / Face Unlock',
              available: hasFaceId,
            ),
            if (!deviceSupported) ...[
              const SizedBox(height: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: scheme.errorContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'This device does not support biometric authentication.',
                  style: TextStyle(
                      fontSize: 12, color: scheme.onErrorContainer),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Cap extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool available;
  const _Cap({required this.icon, required this.label, required this.available});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon,
            size: 20,
            color: available ? Colors.green : Colors.grey.shade400),
        const SizedBox(width: 10),
        Text(label, style: const TextStyle(fontSize: 14)),
        const Spacer(),
        Icon(
          available ? Icons.check_circle : Icons.cancel_outlined,
          size: 18,
          color: available ? Colors.green : Colors.grey.shade400,
        ),
      ],
    );
  }
}

class _OptionTile extends StatelessWidget {
  final BiometricPreference value;
  final BiometricPreference selected;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final bool enabled;
  final VoidCallback? onTap;

  const _OptionTile({
    required this.value,
    required this.selected,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.enabled,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isSelected = value == selected;

    return Opacity(
      opacity: enabled ? 1.0 : 0.5,
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isSelected
                ? scheme.primaryContainer.withValues(alpha: 0.5)
                : scheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? scheme.primary
                  : scheme.outline.withValues(alpha: 0.4),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: enabled
                                ? scheme.onSurface
                                : scheme.onSurfaceVariant)),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: TextStyle(
                            fontSize: 12,
                            color: scheme.onSurfaceVariant)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Radio<BiometricPreference>(
                value: value,
                groupValue: selected,
                onChanged: enabled ? (_) => onTap?.call() : null,
                activeColor: scheme.primary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
