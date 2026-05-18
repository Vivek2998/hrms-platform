import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../data/models/attendance_model.dart';
import '../providers/attendance_provider.dart';

class PunchInScreen extends ConsumerStatefulWidget {
  const PunchInScreen({super.key});

  @override
  ConsumerState<PunchInScreen> createState() => _PunchInScreenState();
}

class _PunchInScreenState extends ConsumerState<PunchInScreen> {
  Position? _position;
  String? _address;
  String? _locationError;
  bool _fetchingLocation = false;

  @override
  void initState() {
    super.initState();
    _fetchLocation();
  }

  Future<void> _fetchLocation() async {
    setState(() {
      _fetchingLocation = true;
      _locationError = null;
    });
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        final req = await Geolocator.requestPermission();
        if (req == LocationPermission.denied ||
            req == LocationPermission.deniedForever) {
          throw Exception('Location permission denied');
        }
      }
      if (permission == LocationPermission.deniedForever) {
        throw Exception(
            'Location permission permanently denied. Enable in Settings.');
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      String? addr;
      try {
        final marks =
            await placemarkFromCoordinates(pos.latitude, pos.longitude);
        if (marks.isNotEmpty) {
          final p = marks.first;
          addr = [p.name, p.locality, p.administrativeArea]
              .whereType<String>()
              .where((s) => s.isNotEmpty)
              .join(', ');
        }
      } catch (_) {}
      setState(() {
        _position = pos;
        _address = addr;
      });
    } catch (e) {
      setState(() => _locationError = e.toString());
    } finally {
      setState(() => _fetchingLocation = false);
    }
  }

  Future<void> _punch(bool isIn) async {
    if (_position == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location not available')),
      );
      return;
    }
    final notifier = ref.read(punchNotifierProvider.notifier);
    if (isIn) {
      await notifier.punchIn(
        latitude: _position!.latitude,
        longitude: _position!.longitude,
      );
    } else {
      await notifier.punchOut(
        latitude: _position!.latitude,
        longitude: _position!.longitude,
      );
    }
    if (!mounted) return;
    final state = ref.read(punchNotifierProvider);
    if (state.hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error?.toString() ?? 'Punch failed'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              isIn ? 'Punched In successfully!' : 'Punched Out successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      context.pop();
    }
  }

  String _fmt(DateTime? dt) =>
      dt != null ? DateFormat('hh:mm a').format(dt.toLocal()) : '--:--';

  CachedAttendanceRecord? _findToday(List<CachedAttendanceRecord> records) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    for (final r in records) {
      final d = r.date.toLocal();
      if (d.year == today.year && d.month == today.month && d.day == today.day) {
        return r;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final punchState = ref.watch(punchNotifierProvider);
    final isLoading = punchState.isLoading || _fetchingLocation;
    final scheme = Theme.of(context).colorScheme;

    final now = DateTime.now();
    final attendanceAsync =
        ref.watch(attendanceListProvider(month: now.month, year: now.year));

    CachedAttendanceRecord? todayRecord;
    if (attendanceAsync.hasValue) {
      todayRecord = _findToday(attendanceAsync.value!);
    }

    final punchedIn = todayRecord?.punchIn != null;
    final punchedOut = todayRecord?.punchOut != null;
    final isComplete = punchedIn && punchedOut;

    return Scaffold(
      appBar: AppBar(title: const Text('Punch In / Out')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Today's status banner ────────────────────────────
            if (attendanceAsync.isLoading)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Center(child: CircularProgressIndicator()),
                ),
              )
            else if (punchedIn)
              Card(
                color: isComplete
                    ? Colors.green.shade50
                    : scheme.primaryContainer.withValues(alpha: 0.4),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Icon(
                        isComplete ? Icons.check_circle : Icons.access_time,
                        color: isComplete ? Colors.green.shade700 : scheme.primary,
                        size: 32,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isComplete ? 'Attendance Complete' : 'Currently Clocked In',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: isComplete
                              ? Colors.green.shade700
                              : scheme.primary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _TimeChip(
                            label: 'In',
                            time: _fmt(todayRecord!.punchIn),
                            color: Colors.green,
                          ),
                          if (punchedOut) ...[
                            const SizedBox(width: 12),
                            _TimeChip(
                              label: 'Out',
                              time: _fmt(todayRecord.punchOut),
                              color: scheme.error,
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 12),

            // ── Location card ────────────────────────────────────
            if (!isComplete)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 48,
                        color: _position != null
                            ? Colors.green
                            : _locationError != null
                                ? scheme.error
                                : scheme.onSurfaceVariant,
                      ),
                      const SizedBox(height: 12),
                      if (_fetchingLocation)
                        const Column(
                          children: [
                            CircularProgressIndicator(),
                            SizedBox(height: 8),
                            Text('Getting your location...'),
                          ],
                        )
                      else if (_locationError != null)
                        Column(
                          children: [
                            Text(
                              _locationError!,
                              textAlign: TextAlign.center,
                              style: TextStyle(color: scheme.error),
                            ),
                            const SizedBox(height: 12),
                            TextButton.icon(
                              onPressed: _fetchLocation,
                              icon: const Icon(Icons.refresh),
                              label: const Text('Retry'),
                            ),
                          ],
                        )
                      else if (_position != null)
                        Column(
                          children: [
                            const Text(
                              'Location captured',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.green),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _address ??
                                  '${_position!.latitude.toStringAsFixed(5)}, '
                                      '${_position!.longitude.toStringAsFixed(5)}',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  fontSize: 12,
                                  color: scheme.onSurfaceVariant),
                            ),
                            Text(
                              'Accuracy: ${_position!.accuracy.toStringAsFixed(0)} m',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: scheme.onSurfaceVariant),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ),

            const Spacer(),

            // ── Action button(s) ─────────────────────────────────
            if (isComplete)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_circle,
                        color: Colors.green.shade700, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Attendance recorded for today',
                      style: TextStyle(
                        color: Colors.green.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              )
            else if (punchedIn) ...[
              // Already clocked in — only show Punch Out
              OutlinedButton.icon(
                onPressed: isLoading || _position == null
                    ? null
                    : () => _punch(false),
                icon: isLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.logout),
                label: const Text('Punch Out'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  foregroundColor: scheme.error,
                  side: BorderSide(color: scheme.error),
                ),
              ),
            ] else ...[
              // Not yet clocked in — only show Punch In
              ElevatedButton.icon(
                onPressed: isLoading || _position == null
                    ? null
                    : () => _punch(true),
                icon: isLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.login),
                label: const Text('Punch In'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
            ],

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _TimeChip extends StatelessWidget {
  final String label;
  final String time;
  final Color color;
  const _TimeChip({required this.label, required this.time, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: '$label  ',
              style: TextStyle(
                  fontSize: 11, color: color, fontWeight: FontWeight.w500),
            ),
            TextSpan(
              text: time,
              style: TextStyle(
                  fontSize: 13, color: color, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
