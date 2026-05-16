import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/holiday_model.dart';
import '../data/repositories/holiday_repository.dart';

part 'holiday_provider.g.dart';

@riverpod
Future<List<Holiday>> holidays(HolidaysRef ref, int year) =>
    ref.read(holidayRepositoryProvider).getHolidays(year);
