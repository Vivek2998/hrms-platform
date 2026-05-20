import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/compliance_model.dart';
import '../data/repositories/compliance_repository.dart';
import '../../../core/dio/dio_client.dart';

final complianceRepositoryProvider = Provider<ComplianceRepository>((ref) {
  return ComplianceRepository(dio: ref.read(dioClientProvider));
});

final complianceCalendarProvider =
    FutureProvider.autoDispose<List<ComplianceDeadline>>((ref) {
  return ref.read(complianceRepositoryProvider).getCalendar();
});
