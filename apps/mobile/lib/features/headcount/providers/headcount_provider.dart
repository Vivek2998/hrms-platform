import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/headcount_model.dart';
import '../data/repositories/headcount_repository.dart';
import '../../../core/dio/dio_client.dart';

final headcountRepositoryProvider = Provider<HeadcountRepository>((ref) {
  return HeadcountRepository(dio: ref.read(dioClientProvider));
});

final headcountPlansProvider =
    FutureProvider.autoDispose<List<HeadcountPlan>>((ref) {
  return ref.read(headcountRepositoryProvider).getPlans();
});

final openPositionsProvider =
    FutureProvider.autoDispose<List<OpenPosition>>((ref) {
  return ref.read(headcountRepositoryProvider).getPositions();
});
