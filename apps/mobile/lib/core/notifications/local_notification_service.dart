import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Notification IDs
const _kSmartPunchChannelId = 'smart_punch_in';
const _kSmartPunchNotificationId = 1001;

/// Callback invoked when the user taps the smart punch-in notification.
/// The host widget (HomeShell) sets this to navigate to the punch screen.
typedef OnSmartPunchTapped = void Function();

class LocalNotificationService {
  static final instance = LocalNotificationService._();
  LocalNotificationService._();

  final _plugin = FlutterLocalNotificationsPlugin();
  OnSmartPunchTapped? _onTapped;

  Future<void> init({OnSmartPunchTapped? onTapped}) async {
    _onTapped = onTapped;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _plugin.initialize(
      const InitializationSettings(android: androidInit, iOS: iosInit),
      onDidReceiveNotificationResponse: _handleTap,
    );

    // Create Android notification channel
    const channel = AndroidNotificationChannel(
      _kSmartPunchChannelId,
      'Smart Punch-In',
      description: 'Notifies you when you arrive at your assigned office.',
      importance: Importance.high,
    );
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  void setOnTapped(OnSmartPunchTapped cb) => _onTapped = cb;

  Future<void> showSmartPunchNotification(String officeName) async {
    const androidDetails = AndroidNotificationDetails(
      _kSmartPunchChannelId,
      'Smart Punch-In',
      channelDescription: 'Notifies you when you arrive at your assigned office.',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentSound: true,
    );
    await _plugin.show(
      _kSmartPunchNotificationId,
      'You\'re near $officeName',
      'Tap to punch in for attendance',
      const NotificationDetails(android: androidDetails, iOS: iosDetails),
      payload: 'smart_punch',
    );
  }

  Future<void> cancelSmartPunchNotification() =>
      _plugin.cancel(_kSmartPunchNotificationId);

  Future<bool> requestPermissions() async {
    final android = _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    final ios = _plugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>();
    final androidGranted = await android?.requestNotificationsPermission() ?? true;
    final iosGranted = await ios?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        ) ??
        true;
    return androidGranted && iosGranted;
  }

  void _handleTap(NotificationResponse response) {
    if (response.payload == 'smart_punch') {
      _onTapped?.call();
    }
  }
}
