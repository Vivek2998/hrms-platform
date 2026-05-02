import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import '../providers/attendance_provider.dart';

class PunchInScreen extends ConsumerStatefulWidget {
  const PunchInScreen({super.key});

  @override
  ConsumerState<PunchInScreen> createState() => _PunchInScreenState();
}

class _PunchInScreenState extends ConsumerState<PunchInScreen> {
  Position? _position;
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
      setState(() => _position = pos);
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
          content: Text(isIn ? 'Punched In successfully!' : 'Punched Out successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final punchState = ref.watch(punchNotifierProvider);
    final isLoading = punchState.isLoading || _fetchingLocation;
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Punch In / Out')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
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
                            '${_position!.latitude.toStringAsFixed(5)}, '
                            '${_position!.longitude.toStringAsFixed(5)}',
                            style: TextStyle(
                                fontSize: 12,
                                color: scheme.onSurfaceVariant),
                          ),
                          Text(
                            'Accuracy: ${_position!.accuracy.toStringAsFixed(0)}m',
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
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: isLoading || _position == null
                  ? null
                  : () => _punch(false),
              icon: const Icon(Icons.logout),
              label: const Text('Punch Out'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
                foregroundColor: scheme.error,
                side: BorderSide(color: scheme.error),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
