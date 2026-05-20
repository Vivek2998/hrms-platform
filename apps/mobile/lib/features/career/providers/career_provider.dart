import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/career_model.dart';
import '../data/repositories/career_repository.dart';
import '../../../core/dio/dio_client.dart';

final careerRepositoryProvider = Provider<CareerRepository>((ref) {
  return CareerRepository(dio: ref.read(dioClientProvider));
});

final designationsProvider =
    FutureProvider.autoDispose<List<Designation>>((ref) {
  return ref.read(careerRepositoryProvider).getDesignations();
});

final careerPathsProvider =
    FutureProvider.autoDispose<List<CareerPath>>((ref) {
  return ref.read(careerRepositoryProvider).getCareerPaths();
});
