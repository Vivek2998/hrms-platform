import 'package:dio/dio.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/payslip_model.dart';
import '../../../../core/dio/dio_client.dart';
import '../../../../core/isar/isar_service.dart';
import '../../../../core/storage/secure_storage.dart';

part 'payslip_repository.g.dart';

@riverpod
PayslipRepository payslipRepository(PayslipRepositoryRef ref) =>
    PayslipRepository(
      dio: ref.read(dioClientProvider),
      storage: ref.read(secureStorageProvider),
      isar: IsarService.instance,
    );

class PayslipRepository {
  final Dio _dio;
  final SecureStorageService _storage;
  final Isar _isar;

  PayslipRepository({
    required Dio dio,
    required SecureStorageService storage,
    required Isar isar,
  })  : _dio = dio,
        _storage = storage,
        _isar = isar;

  Future<List<CachedPayslip>> getMyPayslips() async {
    try {
      final res = await _dio.get('/payroll/my-payslips');
      final payslips = (res.data['data'] as List)
          .map((e) => _mapToModel(e as Map<String, dynamic>))
          .toList();
      await _isar.writeTxn(() => _isar.cachedPayslips.putAll(payslips));
      return payslips;
    } catch (_) {
      return _isar.cachedPayslips
          .where()
          .sortByYearDesc()
          .thenByMonthDesc()
          .findAll();
    }
  }

  Future<Map<String, dynamic>> getPayslipDetail(String payslipId) async {
    final res = await _dio.get('/payroll/my-payslips/$payslipId');
    return res.data['data'] as Map<String, dynamic>;
  }

  CachedPayslip _mapToModel(Map<String, dynamic> e) => CachedPayslip()
    ..payslipId = e['id'] as String
    ..employeeId = e['employeeId'] as String
    ..organizationId = e['organizationId'] as String
    ..month = e['month'] as int
    ..year = e['year'] as int
    ..grossEarnings = (e['grossEarnings'] as num).toDouble()
    ..totalDeductions = (e['totalDeductions'] as num).toDouble()
    ..netPay = (e['netPay'] as num).toDouble()
    ..status = e['status'] as String
    ..pdfUrl = e['pdfUrl'] as String?
    ..cachedAt = DateTime.now();
}
