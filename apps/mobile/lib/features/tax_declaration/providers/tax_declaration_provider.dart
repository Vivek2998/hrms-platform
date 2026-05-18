import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/tax_declaration_model.dart';
import '../data/repositories/tax_declaration_repository.dart';

part 'tax_declaration_provider.g.dart';

@riverpod
Future<TaxDeclaration?> myTaxDeclaration(
  MyTaxDeclarationRef ref, {
  String? financialYear,
}) =>
    ref
        .read(taxDeclarationRepositoryProvider)
        .getMyDeclaration(financialYear: financialYear);

@riverpod
Future<List<TaxDeclaration>> allTaxDeclarations(
  AllTaxDeclarationsRef ref, {
  String? financialYear,
}) =>
    ref
        .read(taxDeclarationRepositoryProvider)
        .getAllDeclarations(financialYear: financialYear);

@riverpod
class TaxDeclarationNotifier extends _$TaxDeclarationNotifier {
  @override
  AsyncValue<TaxDeclaration?> build() => const AsyncData(null);

  Future<void> save({
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
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref
        .read(taxDeclarationRepositoryProvider)
        .saveDeclaration(
          financialYear: financialYear,
          regime: regime,
          ppf: ppf,
          epf: epf,
          elss: elss,
          lic: lic,
          nsc: nsc,
          homeLoanPrincipal: homeLoanPrincipal,
          tuitionFees: tuitionFees,
          sukanyaSamriddhi: sukanyaSamriddhi,
          healthInsuranceSelf: healthInsuranceSelf,
          healthInsuranceParents: healthInsuranceParents,
          rentPaid: rentPaid,
          landlordPan: landlordPan,
          npsEmployee: npsEmployee,
          homeLoanInterest: homeLoanInterest,
          savingsInterest: savingsInterest,
        ));
    ref.invalidate(myTaxDeclarationProvider);
  }

  Future<void> submit(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(taxDeclarationRepositoryProvider).submitDeclaration(id).then((_) => null));
    ref.invalidate(myTaxDeclarationProvider);
  }

  Future<void> verify(String id) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(taxDeclarationRepositoryProvider).verifyDeclaration(id).then((_) => null));
    ref.invalidate(allTaxDeclarationsProvider);
  }
}
