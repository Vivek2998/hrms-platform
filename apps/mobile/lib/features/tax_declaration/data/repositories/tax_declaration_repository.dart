import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/tax_declaration_model.dart';
import '../../../../core/dio/dio_client.dart';

part 'tax_declaration_repository.g.dart';

@riverpod
TaxDeclarationRepository taxDeclarationRepository(TaxDeclarationRepositoryRef ref) =>
    TaxDeclarationRepository(dio: ref.read(dioClientProvider));

class TaxDeclarationRepository {
  final Dio _dio;
  TaxDeclarationRepository({required Dio dio}) : _dio = dio;

  Future<TaxDeclaration?> getMyDeclaration({String? financialYear}) async {
    final fy = financialYear ?? currentFinancialYear();
    final res = await _dio.get('/tax-declarations/my',
        queryParameters: {'financialYear': fy});
    final list = res.data['data'] as List;
    if (list.isEmpty) return null;
    return TaxDeclaration.fromJson(list.first as Map<String, dynamic>);
  }

  Future<List<TaxDeclaration>> getAllDeclarations({String? financialYear}) async {
    final fy = financialYear ?? currentFinancialYear();
    final res = await _dio.get('/tax-declarations',
        queryParameters: {'financialYear': fy});
    return (res.data['data'] as List)
        .map((e) => TaxDeclaration.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<TaxDeclaration> saveDeclaration({
    required String financialYear,
    required String regime,
    double ppf = 0,
    double epf = 0,
    double elss = 0,
    double lic = 0,
    double nsc = 0,
    double homeLoanPrincipal = 0,
    double tuitionFees = 0,
    double sukanyaSamriddhi = 0,
    double healthInsuranceSelf = 0,
    double healthInsuranceParents = 0,
    double rentPaid = 0,
    String? landlordPan,
    double npsEmployee = 0,
    double homeLoanInterest = 0,
    double savingsInterest = 0,
  }) async {
    final res = await _dio.post('/tax-declarations', data: {
      'financialYear': financialYear,
      'regime': regime,
      'ppf': ppf,
      'epf': epf,
      'elss': elss,
      'lic': lic,
      'nsc': nsc,
      'homeLoanPrincipal': homeLoanPrincipal,
      'tuitionFees': tuitionFees,
      'sukanyaSamriddhi': sukanyaSamriddhi,
      'healthInsuranceSelf': healthInsuranceSelf,
      'healthInsuranceParents': healthInsuranceParents,
      'rentPaid': rentPaid,
      if (landlordPan != null && landlordPan.isNotEmpty) 'landlordPan': landlordPan,
      'npsEmployee': npsEmployee,
      'homeLoanInterest': homeLoanInterest,
      'savingsInterest': savingsInterest,
    });
    return TaxDeclaration.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> submitDeclaration(String id) async {
    await _dio.patch('/tax-declarations/$id/submit');
  }

  Future<void> verifyDeclaration(String id) async {
    await _dio.patch('/tax-declarations/$id/verify');
  }
}
