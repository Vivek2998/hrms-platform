import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'biometric_service.g.dart';

enum BiometricPreference {
  fingerprintFirst,
  faceFirst,
  biometricAny,
  noBiometric;

  String get apiValue {
    switch (this) {
      case fingerprintFirst: return 'FINGERPRINT_FIRST';
      case faceFirst:        return 'FACE_FIRST';
      case biometricAny:     return 'BIOMETRIC_ANY';
      case noBiometric:      return 'NO_BIOMETRIC';
    }
  }

  static BiometricPreference fromApiValue(String v) {
    switch (v) {
      case 'FACE_FIRST':     return faceFirst;
      case 'BIOMETRIC_ANY':  return biometricAny;
      case 'NO_BIOMETRIC':   return noBiometric;
      default:               return fingerprintFirst;
    }
  }

  String get displayLabel {
    switch (this) {
      case fingerprintFirst: return 'Fingerprint first';
      case faceFirst:        return 'Face ID first';
      case biometricAny:     return 'Any biometric';
      case noBiometric:      return 'Manual punch only';
    }
  }
}

enum PunchMethod {
  fingerprint,
  faceId,
  manual;

  String get apiValue {
    switch (this) {
      case fingerprint: return 'FINGERPRINT';
      case faceId:      return 'FACE_ID';
      case manual:      return 'MANUAL';
    }
  }
}

@riverpod
BiometricService biometricService(BiometricServiceRef ref) =>
    BiometricService._();

class BiometricService {
  BiometricService._();

  final _auth = LocalAuthentication();

  Future<bool> isAvailable() async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isSupported = await _auth.isDeviceSupported();
      return canCheck && isSupported;
    } catch (_) {
      return false;
    }
  }

  Future<List<BiometricType>> getAvailableTypes() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (_) {
      return [];
    }
  }

  Future<bool> hasFingerprint() async {
    final types = await getAvailableTypes();
    return types.contains(BiometricType.fingerprint) ||
        types.contains(BiometricType.strong);
  }

  Future<bool> hasFaceId() async {
    final types = await getAvailableTypes();
    return types.contains(BiometricType.face);
  }

  /// Authenticates using the given preference and returns the PunchMethod
  /// that was used, or null if authentication failed or was cancelled.
  Future<PunchMethod?> authenticateForPunch(BiometricPreference preference) async {
    if (preference == BiometricPreference.noBiometric) return null;

    final available = await isAvailable();
    if (!available) return null;

    final types = await getAvailableTypes();
    final fpAvail = types.contains(BiometricType.fingerprint) ||
        types.contains(BiometricType.strong);
    final faceAvail = types.contains(BiometricType.face);

    if (!fpAvail && !faceAvail) return null;

    // Determine the "expected" method for recording, based on device state and preference
    PunchMethod expectedMethod;
    if (preference == BiometricPreference.faceFirst && faceAvail) {
      expectedMethod = PunchMethod.faceId;
    } else if (fpAvail) {
      expectedMethod = PunchMethod.fingerprint;
    } else {
      expectedMethod = PunchMethod.faceId;
    }

    try {
      final success = await _auth.authenticate(
        localizedReason: 'Authenticate to punch attendance',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
      return success ? expectedMethod : null;
    } on PlatformException {
      return null;
    }
  }

  /// General-purpose authenticate (non-punch use cases).
  Future<bool> authenticate({String reason = 'Authenticate to access HRMS'}) async {
    try {
      return await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } on PlatformException {
      return false;
    }
  }
}
