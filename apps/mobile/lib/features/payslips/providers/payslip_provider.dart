import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/payslip_model.dart';
import '../data/repositories/payslip_repository.dart';

part 'payslip_provider.g.dart';

@Riverpod(keepAlive: true)
Future<List<CachedPayslip>> payslipList(PayslipListRef ref) {
  return ref.read(payslipRepositoryProvider).getMyPayslips();
}

@Riverpod(keepAlive: true)
Future<Map<String, dynamic>> payslipDetail(
  PayslipDetailRef ref,
  String payslipId,
) {
  return ref.read(payslipRepositoryProvider).getPayslipDetail(payslipId);
}
