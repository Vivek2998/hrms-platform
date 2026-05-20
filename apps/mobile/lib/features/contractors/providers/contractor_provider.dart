import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/contractor_model.dart';
import '../data/repositories/contractor_repository.dart';

final contractorRepositoryProvider = Provider<ContractorRepository>(
  (ref) => ContractorRepository(dio: ref.read(dioClientProvider)),
);

final contractorsProvider =
    FutureProvider.autoDispose<List<Contractor>>((ref) {
  return ref.read(contractorRepositoryProvider).getContractors();
});
