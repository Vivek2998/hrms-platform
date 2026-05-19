import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/asset_model.dart';
import '../data/repositories/asset_repository.dart';

part 'asset_provider.g.dart';

@riverpod
Future<List<Asset>> assets(AssetsRef ref) =>
    ref.read(assetRepositoryProvider).getAssets();

@riverpod
class AssetNotifier extends _$AssetNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> assignAsset(String assetId, String employeeId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(assetRepositoryProvider).assignAsset(assetId, employeeId));
    if (!state.hasError) ref.invalidate(assetsProvider);
  }

  Future<void> returnAsset(String assetId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(assetRepositoryProvider).returnAsset(assetId));
    if (!state.hasError) ref.invalidate(assetsProvider);
  }
}
