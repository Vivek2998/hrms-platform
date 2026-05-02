import 'package:isar/isar.dart';

part 'payslip_model.g.dart';

@collection
class CachedPayslip {
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  late String payslipId;

  late String employeeId;
  late String organizationId;
  late int month;
  late int year;
  late double grossEarnings;
  late double totalDeductions;
  late double netPay;
  late String status; // DRAFT, PROCESSED, PAID
  String? pdfUrl;
  late DateTime cachedAt;
}
