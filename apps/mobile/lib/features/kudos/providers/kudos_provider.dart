import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/kudos_model.dart';
import '../data/repositories/kudos_repository.dart';

part 'kudos_provider.g.dart';

@riverpod
Future<List<Kudos>> kudosFeed(KudosFeedRef ref) =>
    ref.read(kudosRepositoryProvider).getFeed();

@riverpod
Future<List<Kudos>> myKudos(MyKudosRef ref) =>
    ref.read(kudosRepositoryProvider).getMyKudos();

@riverpod
class KudosNotifier extends _$KudosNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> give({
    required String toEmployeeId,
    required String category,
    required String message,
    bool isPublic = true,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref.read(kudosRepositoryProvider).giveKudos(
          toEmployeeId: toEmployeeId,
          category: category,
          message: message,
          isPublic: isPublic,
        ));
    if (!state.hasError) {
      ref.invalidate(kudosFeedProvider);
      ref.invalidate(myKudosProvider);
    }
  }

  Future<void> react(String id, String emoji) async {
    state = await AsyncValue.guard(
        () => ref.read(kudosRepositoryProvider).react(id, emoji));
    if (!state.hasError) ref.invalidate(kudosFeedProvider);
  }

  Future<void> delete(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(kudosRepositoryProvider).delete(id));
    if (!state.hasError) {
      ref.invalidate(kudosFeedProvider);
      ref.invalidate(myKudosProvider);
    }
  }
}
