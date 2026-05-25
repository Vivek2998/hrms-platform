import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/dashboard_model.dart';
import '../../../core/dio/dio_client.dart';

final dashboardWidgetsProvider = FutureProvider<DashboardWidgets>((ref) async {
  final dio = ref.read(dioClientProvider);
  final res = await dio.get('/dashboard/widgets');
  final data = res.data['data'] as Map<String, dynamic>;

  final birthdays = ((data['birthdays'] as List<dynamic>?) ?? [])
      .cast<Map<String, dynamic>>()
      .map(BirthdayEmployee.fromJson)
      .toList();

  final newJoinees = ((data['newJoinees'] as List<dynamic>?) ?? [])
      .cast<Map<String, dynamic>>()
      .map(NewJoinee.fromJson)
      .toList();

  final workAnniversaries = ((data['workAnniversaries'] as List<dynamic>?) ?? [])
      .cast<Map<String, dynamic>>()
      .map(WorkAnniversary.fromJson)
      .toList();

  return DashboardWidgets(
    birthdays: birthdays,
    newJoinees: newJoinees,
    workAnniversaries: workAnniversaries,
    quoteCategory: (data['quoteCategory'] as String?) ?? 'default',
  );
});

// Keep backward-compat alias so _BirthdaySection can stay as-is
final todayBirthdaysProvider = FutureProvider<List<BirthdayEmployee>>((ref) async {
  final widgets = await ref.watch(dashboardWidgetsProvider.future);
  return widgets.birthdays;
});
