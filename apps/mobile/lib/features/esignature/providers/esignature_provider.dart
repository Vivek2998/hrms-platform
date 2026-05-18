import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/esignature_model.dart';
import '../data/repositories/esignature_repository.dart';

part 'esignature_provider.g.dart';

@riverpod
Future<List<ESignatureRequest>> pendingSignatures(PendingSignaturesRef ref) =>
    ref.read(eSignatureRepositoryProvider).getPending();

@riverpod
Future<List<ESignatureRequest>> mySignatureRequests(MySignatureRequestsRef ref) =>
    ref.read(eSignatureRepositoryProvider).getMyRequests();

@riverpod
class ESignatureNotifier extends _$ESignatureNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> create({
    required String requestedTo,
    required String documentName,
    required String documentUrl,
    String? message,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() =>
        ref.read(eSignatureRepositoryProvider).create(
              requestedTo: requestedTo,
              documentName: documentName,
              documentUrl: documentUrl,
              message: message,
            ));
    if (!state.hasError) {
      ref.invalidate(mySignatureRequestsProvider);
    }
  }

  Future<void> sign(String id, String signatureImageUrl) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(eSignatureRepositoryProvider).sign(id, signatureImageUrl));
    if (!state.hasError) ref.invalidate(pendingSignaturesProvider);
  }

  Future<void> decline(String id, {String? reason}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(eSignatureRepositoryProvider).decline(id, reason: reason));
    if (!state.hasError) ref.invalidate(pendingSignaturesProvider);
  }

  Future<void> delete(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(eSignatureRepositoryProvider).delete(id));
    if (!state.hasError) ref.invalidate(mySignatureRequestsProvider);
  }
}
