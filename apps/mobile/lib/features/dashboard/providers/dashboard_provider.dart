import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/dashboard_model.dart';
import '../../../core/dio/dio_client.dart';

final todayBirthdaysProvider = FutureProvider<List<BirthdayEmployee>>((ref) async {
  final dio = ref.read(dioClientProvider);
  final res = await dio.get('/dashboard/widgets');
  final data = res.data['data'] as Map<String, dynamic>;
  final list = (data['birthdays'] as List<dynamic>?) ?? [];
  return list
      .cast<Map<String, dynamic>>()
      .map(BirthdayEmployee.fromJson)
      .toList();
});
