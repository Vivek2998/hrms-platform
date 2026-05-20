import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/succession_model.dart';
import '../data/repositories/succession_repository.dart';
import '../../../core/dio/dio_client.dart';

final successionRepositoryProvider = Provider<SuccessionRepository>((ref) {
  return SuccessionRepository(dio: ref.read(dioClientProvider));
});

final successionPlansProvider =
    FutureProvider.autoDispose<List<SuccessionPlan>>((ref) {
  return ref.read(successionRepositoryProvider).getPlans();
});
