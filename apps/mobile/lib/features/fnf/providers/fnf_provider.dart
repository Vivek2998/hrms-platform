import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/fnf_model.dart';
import '../data/repositories/fnf_repository.dart';
import '../../../core/dio/dio_client.dart';

final fnfRepositoryProvider = Provider<FnFRepository>((ref) {
  return FnFRepository(dio: ref.read(dioClientProvider));
});

final fnfListProvider = FutureProvider.autoDispose<List<FnFSettlement>>((ref) {
  return ref.read(fnfRepositoryProvider).getSettlements();
});
