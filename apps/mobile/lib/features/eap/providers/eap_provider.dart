import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/eap_model.dart';
import '../data/repositories/eap_repository.dart';

final eapRepositoryProvider = Provider<EapRepository>(
  (ref) => EapRepository(dio: ref.read(dioClientProvider)),
);

final eapResourcesProvider =
    FutureProvider.autoDispose<List<EapResource>>((ref) {
  return ref.read(eapRepositoryProvider).getResources();
});
