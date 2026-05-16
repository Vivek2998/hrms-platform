import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../models/team_member_model.dart';
import '../../../../core/dio/dio_client.dart';

part 'team_repository.g.dart';

@riverpod
TeamRepository teamRepository(TeamRepositoryRef ref) =>
    TeamRepository(dio: ref.read(dioClientProvider));

class TeamRepository {
  final Dio _dio;
  const TeamRepository({required Dio dio}) : _dio = dio;

  Future<List<TeamMember>> getDirectory({String? search}) async {
    final res = await _dio.get(
      '/employees/directory',
      queryParameters: {
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return (res.data['data'] as List)
        .map((e) => TeamMember.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
