import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/document_model.dart';
import '../data/repositories/document_repository.dart';

part 'document_provider.g.dart';

@riverpod
Future<List<AppDocument>> myDocuments(MyDocumentsRef ref) =>
    ref.read(documentRepositoryProvider).getMyDocuments();
