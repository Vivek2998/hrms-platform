import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import '../../features/auth/data/models/auth_model.dart';
import '../../features/attendance/data/models/attendance_model.dart';
import '../../features/leaves/data/models/leave_model.dart';
import '../../features/payslips/data/models/payslip_model.dart';

class IsarService {
  static late Isar _isar;
  static Isar get instance => _isar;

  static Future<void> init() async {
    final dir = await getApplicationDocumentsDirectory();
    _isar = await Isar.open(
      [
        CachedUserSchema,
        CachedAttendanceRecordSchema,
        CachedLeaveRequestSchema,
        CachedPayslipSchema,
      ],
      directory: dir.path,
    );
  }
}
