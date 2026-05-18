import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/helpdesk_model.dart';
import '../data/repositories/helpdesk_repository.dart';
import '../../../core/dio/dio_client.dart';

final helpdeskRepositoryProvider = Provider<HelpdeskRepository>((ref) {
  return HelpdeskRepository(dio: ref.read(dioClientProvider));
});

final helpdeskTicketsProvider =
    FutureProvider.autoDispose<List<HelpdeskTicket>>((ref) {
  return ref.read(helpdeskRepositoryProvider).getTickets();
});

final helpdeskTicketDetailProvider =
    FutureProvider.autoDispose.family<HelpdeskTicketDetail, String>(
        (ref, id) {
  return ref.read(helpdeskRepositoryProvider).getTicket(id);
});

// ── Create Ticket Notifier ────────────────────────────────────────────────────

class CreateTicketNotifier
    extends StateNotifier<AsyncValue<HelpdeskTicket?>> {
  final HelpdeskRepository _repo;
  final Ref _ref;

  CreateTicketNotifier(this._repo, this._ref)
      : super(const AsyncData(null));

  Future<bool> create({
    required String subject,
    required String description,
    required String category,
    required String priority,
  }) async {
    state = const AsyncLoading();
    try {
      final ticket = await _repo.createTicket(
        subject: subject,
        description: description,
        category: category,
        priority: priority,
      );
      state = AsyncData(ticket);
      _ref.invalidate(helpdeskTicketsProvider);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final createTicketNotifierProvider = StateNotifierProvider.autoDispose<
    CreateTicketNotifier, AsyncValue<HelpdeskTicket?>>((ref) {
  return CreateTicketNotifier(
    ref.read(helpdeskRepositoryProvider),
    ref,
  );
});

// ── Add Comment Notifier ──────────────────────────────────────────────────────

class AddCommentNotifier extends StateNotifier<AsyncValue<void>> {
  final HelpdeskRepository _repo;
  final Ref _ref;

  AddCommentNotifier(this._repo, this._ref)
      : super(const AsyncData(null));

  Future<bool> addComment({
    required String ticketId,
    required String body,
    bool isInternal = false,
  }) async {
    state = const AsyncLoading();
    try {
      await _repo.addComment(
          ticketId: ticketId, body: body, isInternal: isInternal);
      state = const AsyncData(null);
      _ref.invalidate(helpdeskTicketDetailProvider(ticketId));
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }
}

final addCommentNotifierProvider = StateNotifierProvider.autoDispose<
    AddCommentNotifier, AsyncValue<void>>((ref) {
  return AddCommentNotifier(
    ref.read(helpdeskRepositoryProvider),
    ref,
  );
});
