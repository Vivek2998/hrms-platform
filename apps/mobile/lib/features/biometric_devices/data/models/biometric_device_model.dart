class BiometricDevice {
  final String id, name, vendor;
  final String? serialNumber, ipAddress, location;
  final bool isActive;
  final DateTime? lastSyncAt;
  final DateTime createdAt;

  BiometricDevice({
    required this.id,
    required this.name,
    required this.vendor,
    this.serialNumber,
    this.ipAddress,
    this.location,
    required this.isActive,
    this.lastSyncAt,
    required this.createdAt,
  });

  factory BiometricDevice.fromJson(Map<String, dynamic> j) => BiometricDevice(
        id: j['id'],
        name: j['name'],
        vendor: j['vendor'],
        serialNumber: j['serialNumber'],
        ipAddress: j['ipAddress'],
        location: j['location'],
        isActive: j['isActive'] ?? true,
        lastSyncAt:
            j['lastSyncAt'] != null ? DateTime.parse(j['lastSyncAt']) : null,
        createdAt: DateTime.parse(j['createdAt']),
      );
}
