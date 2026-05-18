import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/isar/isar_service.dart';
import 'core/notifications/local_notification_service.dart';
import 'core/geofence/geofence_manager.dart';
import 'app.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background FCM — keep lightweight, no UI work here
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase — skip gracefully when platform config files are absent.
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('[Firebase] init skipped: $e');
  }

  await IsarService.init();

  // Initialise local notifications so geofence callbacks can show them.
  await LocalNotificationService.instance.init(
    onTapped: () => GeofenceManager.instance.onNotificationTapped?.call(),
  );

  runApp(const ProviderScope(child: HrmsApp()));
}
