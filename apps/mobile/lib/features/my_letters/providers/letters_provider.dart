import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/repositories/letters_repository.dart';
import '../../../core/dio/dio_client.dart';

final lettersRepositoryProvider = Provider<LettersRepository>((ref) {
  return LettersRepository(dio: ref.read(dioClientProvider));
});

final experienceLetterProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.read(lettersRepositoryProvider).getExperienceLetterData();
});

final salaryCertProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) {
  return ref.read(lettersRepositoryProvider).getSalaryCertificateData();
});
