import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../data/models/announcement_model.dart';
import '../data/repositories/announcements_repository.dart';

part 'announcements_provider.g.dart';

@Riverpod(keepAlive: true)
Future<List<Announcement>> announcementsList(AnnouncementsListRef ref) =>
    ref.read(announcementsRepositoryProvider).getAnnouncements(limit: 5);
