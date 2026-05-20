import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/pay_equity_model.dart';
import '../data/repositories/pay_equity_repository.dart';

final payEquityRepositoryProvider = Provider<PayEquityRepository>(
  (ref) => PayEquityRepository(dio: ref.read(dioClientProvider)),
);

final payEquityLatestProvider =
    FutureProvider.autoDispose<PayEquitySnapshot?>((ref) {
  return ref.read(payEquityRepositoryProvider).getLatest();
});
