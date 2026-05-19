import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

const _kFcmChannelId = 'hrms_push';
const _kFcmChannelName = 'HRMS Notifications';

/// Manages FCM push notification setup, token registration, and foreground display.
class FcmService {
  FcmService._();

  static final _localPlugin = FlutterLocalNotificationsPlugin();
  static int _notifId = 2000;

  /// Call once at app startup (after Firebase.initializeApp).
  static Future<void> init() async {
    // Set up local notification channel for FCM messages shown in foreground
    await _localPlugin.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );

    const channel = AndroidNotificationChannel(
      _kFcmChannelId,
      _kFcmChannelName,
      description: 'HRMS push notifications',
      importance: Importance.high,
    );
    await _localPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // Show local notification when app is in foreground
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // Request permission (Android 13+ / iOS)
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Call after a successful login to register the FCM token with the backend.
  static Future<void> registerToken(Dio dio) async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;
      await dio.patch('/notifications/fcm-token', data: {'token': token});
      debugPrint('[FCM] token registered');

      // Re-register whenever the token refreshes
      FirebaseMessaging.instance.onTokenRefresh.listen((newToken) async {
        try {
          await dio.patch('/notifications/fcm-token', data: {'token': newToken});
        } catch (_) {}
      });
    } catch (e) {
      debugPrint('[FCM] token registration failed: $e');
    }
  }

  /// Call on logout to remove the token from the backend.
  static Future<void> removeToken(Dio dio) async {
    try {
      await dio.delete('/notifications/fcm-token');
      await FirebaseMessaging.instance.deleteToken();
    } catch (_) {}
  }

  static void _onForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localPlugin.show(
      _notifId++,
      notification.title ?? 'HRMS',
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _kFcmChannelId,
          _kFcmChannelName,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentSound: true,
          presentBadge: true,
        ),
      ),
    );
  }
}
