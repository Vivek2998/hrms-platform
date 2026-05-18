import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/team_member_model.dart';
import '../data/repositories/team_repository.dart';

part 'team_provider.g.dart';

@Riverpod(keepAlive: true)
Future<List<TeamMember>> teamDirectory(TeamDirectoryRef ref,
    {String? search}) =>
    ref.read(teamRepositoryProvider).getDirectory(search: search);
