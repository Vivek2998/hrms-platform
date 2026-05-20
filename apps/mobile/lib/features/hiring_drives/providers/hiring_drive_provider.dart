import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/dio/dio_client.dart';
import '../data/models/hiring_drive_model.dart';
import '../data/repositories/hiring_drive_repository.dart';

final hiringDriveRepositoryProvider = Provider<HiringDriveRepository>(
  (ref) => HiringDriveRepository(dio: ref.read(dioClientProvider)),
);

final hiringDrivesProvider =
    FutureProvider.autoDispose<List<HiringDrive>>((ref) {
  return ref.read(hiringDriveRepositoryProvider).getDrives();
});
