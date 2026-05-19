import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../features/auth/providers/auth_provider.dart';
import '../data/models/room_model.dart';
import '../providers/room_provider.dart';

class RoomsScreen extends ConsumerStatefulWidget {
  const RoomsScreen({super.key});

  @override
  ConsumerState<RoomsScreen> createState() => _RoomsScreenState();
}

class _RoomsScreenState extends ConsumerState<RoomsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tab;
  String? _filterDate;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  String get _role =>
      ref.read(authNotifierProvider).valueOrNull?.user?.role ?? '';

  bool get _isHr =>
      ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].contains(_role);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meeting Rooms'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [
            Tab(text: 'Rooms'),
            Tab(text: 'My Bookings'),
          ],
        ),
        actions: [
          if (_isHr)
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: _showAddRoomSheet,
            ),
        ],
      ),
      body: TabBarView(
        controller: _tab,
        children: [
          _RoomsTab(isHr: _isHr, onBook: _showBookSheet),
          _BookingsTab(filterDate: _filterDate, onFilterDate: (d) => setState(() => _filterDate = d)),
        ],
      ),
    );
  }

  void _showAddRoomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddRoomSheet(onCreated: () {
        ref.invalidate(meetingRoomsProvider);
      }),
    );
  }

  void _showBookSheet(MeetingRoom room) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BookRoomSheet(room: room),
    );
  }
}

// ─── Rooms Tab ────────────────────────────────────────────────────────────────

class _RoomsTab extends ConsumerWidget {
  final bool isHr;
  final void Function(MeetingRoom) onBook;

  const _RoomsTab({required this.isHr, required this.onBook});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(meetingRoomsProvider);
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (rooms) {
        if (rooms.isEmpty) {
          return const Center(
            child: Text('No meeting rooms configured.', style: TextStyle(color: Colors.grey)),
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(meetingRoomsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: rooms.length,
            itemBuilder: (_, i) => _RoomCard(room: rooms[i], isHr: isHr, onBook: onBook),
          ),
        );
      },
    );
  }
}

class _RoomCard extends ConsumerWidget {
  final MeetingRoom room;
  final bool isHr;
  final void Function(MeetingRoom) onBook;

  const _RoomCard({required this.room, required this.isHr, required this.onBook});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(room.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      if (room.location != null)
                        Row(children: [
                          const Icon(Icons.location_on_outlined, size: 13, color: Colors.grey),
                          const SizedBox(width: 3),
                          Text(room.location!, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ]),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.people_outline, size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text('${room.capacity}', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
            if (room.amenities.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: room.amenities.map((a) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(a, style: const TextStyle(fontSize: 11)),
                )).toList(),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () => onBook(room),
                    icon: const Icon(Icons.calendar_today_outlined, size: 16),
                    label: const Text('Book Room'),
                  ),
                ),
                if (isHr) ...[
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () async {
                      final ok = await showDialog<bool>(
                        context: ref.context,
                        builder: (_) => AlertDialog(
                          title: const Text('Deactivate Room'),
                          content: Text('Deactivate "${room.name}"? Existing bookings remain.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ref.context, false), child: const Text('Cancel')),
                            TextButton(onPressed: () => Navigator.pop(ref.context, true), child: const Text('Deactivate')),
                          ],
                        ),
                      );
                      if (ok == true) {
                        await ref.read(roomNotifierProvider.notifier).deactivateRoom(room.id);
                      }
                    },
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                    child: const Icon(Icons.delete_outline, size: 18),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────

class _BookingsTab extends ConsumerWidget {
  final String? filterDate;
  final void Function(String?) onFilterDate;

  const _BookingsTab({this.filterDate, required this.onFilterDate});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(roomBookingsProvider());
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      onFilterDate(DateFormat('yyyy-MM-dd').format(picked));
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today_outlined, size: 16, color: Colors.grey),
                        const SizedBox(width: 8),
                        Text(
                          filterDate ?? 'Filter by date',
                          style: TextStyle(color: filterDate != null ? Colors.black87 : Colors.grey),
                        ),
                        const Spacer(),
                        if (filterDate != null)
                          GestureDetector(
                            onTap: () => onFilterDate(null),
                            child: const Icon(Icons.close, size: 16, color: Colors.grey),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: async.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
            data: (bookings) {
              final filtered = filterDate != null
                  ? bookings.where((b) => DateFormat('yyyy-MM-dd').format(b.startTime) == filterDate).toList()
                  : bookings;
              if (filtered.isEmpty) {
                return const Center(
                  child: Text('No bookings found.', style: TextStyle(color: Colors.grey)),
                );
              }
              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(roomBookingsProvider()),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) => _BookingCard(booking: filtered[i]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _BookingCard extends ConsumerWidget {
  final RoomBooking booking;
  const _BookingCard({required this.booking});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dateFmt = DateFormat('dd MMM yyyy');
    final timeFmt = DateFormat('HH:mm');
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 4,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(booking.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  if (booking.room != null)
                    Text(booking.room!.name + (booking.room!.location != null ? ' · ${booking.room!.location}' : ''),
                        style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 6),
                  Row(children: [
                    const Icon(Icons.calendar_today_outlined, size: 13, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(dateFmt.format(booking.startTime), style: const TextStyle(fontSize: 12)),
                    const SizedBox(width: 10),
                    const Icon(Icons.access_time, size: 13, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text('${timeFmt.format(booking.startTime)} – ${timeFmt.format(booking.endTime)}',
                        style: const TextStyle(fontSize: 12)),
                  ]),
                  Row(children: [
                    const Icon(Icons.people_outline, size: 13, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text('${booking.attendees} attendees', style: const TextStyle(fontSize: 12)),
                  ]),
                ],
              ),
            ),
            IconButton(
              icon: Icon(Icons.cancel_outlined, color: AppColors.error),
              onPressed: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Cancel Booking'),
                    content: Text('Cancel "${booking.title}"?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
                      TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Yes, Cancel')),
                    ],
                  ),
                );
                if (ok == true) {
                  final success = await ref.read(roomNotifierProvider.notifier).cancelBooking(booking.id);
                  if (success && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Booking cancelled'), backgroundColor: Colors.green),
                    );
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Add Room Sheet ───────────────────────────────────────────────────────────

class _AddRoomSheet extends ConsumerStatefulWidget {
  final VoidCallback onCreated;
  const _AddRoomSheet({required this.onCreated});

  @override
  ConsumerState<_AddRoomSheet> createState() => _AddRoomSheetState();
}

class _AddRoomSheetState extends ConsumerState<_AddRoomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  int _capacity = 1;
  final List<String> _amenities = [];

  static const _commonAmenities = ['WiFi', 'Projector', 'TV', 'Whiteboard', 'Coffee', 'AC', 'Video Conferencing'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final success = await ref.read(roomNotifierProvider.notifier).createRoom(
          name: _nameCtrl.text.trim(),
          location: _locationCtrl.text.trim().isEmpty ? null : _locationCtrl.text.trim(),
          capacity: _capacity,
          amenities: _amenities,
        );
    if (success && mounted) {
      widget.onCreated();
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Room created'), backgroundColor: Colors.green),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(roomNotifierProvider).isLoading;
    return DraggableScrollableSheet(
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: Align(alignment: Alignment.centerLeft, child: Text('Add Meeting Room', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
            ),
            const Divider(height: 24),
            Expanded(
              child: SingleChildScrollView(
                controller: ctrl,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextFormField(
                        controller: _nameCtrl,
                        decoration: const InputDecoration(labelText: 'Room Name *', border: OutlineInputBorder()),
                        validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _locationCtrl,
                        decoration: const InputDecoration(labelText: 'Location / Floor', border: OutlineInputBorder(), hintText: 'e.g. 2nd Floor, East Wing'),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          const Text('Capacity:', style: TextStyle(fontWeight: FontWeight.w500)),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: _capacity > 1 ? () => setState(() => _capacity--) : null,
                          ),
                          Text('$_capacity', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setState(() => _capacity++),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const Text('Amenities:', style: TextStyle(fontWeight: FontWeight.w500)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: _commonAmenities.map((a) {
                          final sel = _amenities.contains(a);
                          return FilterChip(
                            label: Text(a),
                            selected: sel,
                            onSelected: (_) => setState(() => sel ? _amenities.remove(a) : _amenities.add(a)),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: loading ? null : _submit,
                          child: loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Create Room'),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Book Room Sheet ──────────────────────────────────────────────────────────

class _BookRoomSheet extends ConsumerStatefulWidget {
  final MeetingRoom room;
  const _BookRoomSheet({required this.room});

  @override
  ConsumerState<_BookRoomSheet> createState() => _BookRoomSheetState();
}

class _BookRoomSheetState extends ConsumerState<_BookRoomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  DateTime _date = DateTime.now();
  TimeOfDay _start = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _end = const TimeOfDay(hour: 10, minute: 0);
  int _attendees = 1;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final startDt = DateTime(_date.year, _date.month, _date.day, _start.hour, _start.minute);
    final endDt = DateTime(_date.year, _date.month, _date.day, _end.hour, _end.minute);
    if (!endDt.isAfter(startDt)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('End time must be after start time'), backgroundColor: Colors.red),
      );
      return;
    }

    final success = await ref.read(roomNotifierProvider.notifier).createBooking(
          roomId: widget.room.id,
          title: _titleCtrl.text.trim(),
          startTime: startDt.toUtc().toIso8601String(),
          endTime: endDt.toUtc().toIso8601String(),
          attendees: _attendees,
          notes: _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
        );
    if (success && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Room booked successfully'), backgroundColor: Colors.green),
      );
    } else if (!success && mounted) {
      final err = ref.read(roomNotifierProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err?.toString() ?? 'Failed to book room'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(roomNotifierProvider).isLoading;
    final dateFmt = DateFormat('dd MMM yyyy');
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.6,
      maxChildSize: 0.95,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Book Room — ${widget.room.name}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    if (widget.room.location != null)
                      Text(widget.room.location!, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  ],
                ),
              ),
            ),
            const Divider(height: 24),
            Expanded(
              child: SingleChildScrollView(
                controller: ctrl,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextFormField(
                        controller: _titleCtrl,
                        decoration: const InputDecoration(labelText: 'Meeting Title *', border: OutlineInputBorder()),
                        validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 14),
                      GestureDetector(
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: _date,
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (picked != null) setState(() => _date = picked);
                        },
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'Date', border: OutlineInputBorder()),
                          child: Row(children: [
                            Text(dateFmt.format(_date)),
                            const Spacer(),
                            const Icon(Icons.calendar_today_outlined, size: 18, color: Colors.grey),
                          ]),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () async {
                                final t = await showTimePicker(context: context, initialTime: _start);
                                if (t != null) setState(() => _start = t);
                              },
                              child: InputDecorator(
                                decoration: const InputDecoration(labelText: 'Start Time', border: OutlineInputBorder()),
                                child: Text(_start.format(context)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () async {
                                final t = await showTimePicker(context: context, initialTime: _end);
                                if (t != null) setState(() => _end = t);
                              },
                              child: InputDecorator(
                                decoration: const InputDecoration(labelText: 'End Time', border: OutlineInputBorder()),
                                child: Text(_end.format(context)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          const Text('Attendees (max ${0}):', style: TextStyle(fontWeight: FontWeight.w500)),
                          const Spacer(),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: _attendees > 1 ? () => setState(() => _attendees--) : null,
                          ),
                          Text('$_attendees', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: _attendees < widget.room.capacity ? () => setState(() => _attendees++) : null,
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _notesCtrl,
                        decoration: const InputDecoration(labelText: 'Notes (optional)', border: OutlineInputBorder()),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: loading ? null : _submit,
                          child: loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Book Room'),
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
