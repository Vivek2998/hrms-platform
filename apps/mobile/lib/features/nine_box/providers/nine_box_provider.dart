import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/nine_box_model.dart';
import '../data/repositories/nine_box_repository.dart';
import '../../../core/dio/dio_client.dart';

final nineBoxRepositoryProvider = Provider<NineBoxRepository>((ref) {
  return NineBoxRepository(dio: ref.read(dioClientProvider));
});

final nineBoxDataProvider =
    FutureProvider.autoDispose<NineBoxData>((ref) {
  return ref.read(nineBoxRepositoryProvider).getData();
});
