import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/esop_model.dart';
import '../data/repositories/esop_repository.dart';

final esopRepositoryProvider = Provider<EsopRepository>(
  (ref) => EsopRepository(dio: ref.read(dioClientProvider)),
);

final myEsopGrantsProvider =
    FutureProvider.autoDispose<List<EsopGrant>>((ref) {
  return ref.read(esopRepositoryProvider).getMyGrants();
});
