class Shift {
  final String id;
  final String name;
  final String code;
  final String startTime; // HH:mm
  final String endTime; // HH:mm
  final int graceMinutes;
  final int halfDayAfterMinutes;
  final int absentAfterMinutes;
  final int breakDurationMinutes;
  final bool isNightShift;
  final List<int> weeklyOffDays; // 0=Sun,6=Sat
  final bool isActive;

  const Shift({
    required this.id,
    required this.name,
    required this.code,
    required this.startTime,
    required this.endTime,
    required this.graceMinutes,
    required this.halfDayAfterMinutes,
    required this.absentAfterMinutes,
    required this.breakDurationMinutes,
    required this.isNightShift,
    required this.weeklyOffDays,
    required this.isActive,
  });

  factory Shift.fromJson(Map<String, dynamic> j) => Shift(
        id: j['id'] as String,
        name: j['name'] as String,
        code: j['code'] as String,
        startTime: j['startTime'] as String,
        endTime: j['endTime'] as String,
        graceMinutes: j['graceMinutes'] as int? ?? 0,
        halfDayAfterMinutes: j['halfDayAfterMinutes'] as int? ?? 240,
        absentAfterMinutes: j['absentAfterMinutes'] as int? ?? 480,
        breakDurationMinutes: j['breakDurationMinutes'] as int? ?? 60,
        isNightShift: j['isNightShift'] as bool? ?? false,
        weeklyOffDays: ((j['weeklyOffDays'] as List?) ?? [0, 6])
            .map((e) => e as int)
            .toList(),
        isActive: j['isActive'] as bool? ?? true,
      );

  String get formattedTime => '${_fmt(startTime)} – ${_fmt(endTime)}';

  String _fmt(String t) {
    final parts = t.split(':');
    final h = int.parse(parts[0]);
    final m = parts[1];
    final period = h >= 12 ? 'PM' : 'AM';
    final h12 = h == 0 ? 12 : (h > 12 ? h - 12 : h);
    return '$h12:$m $period';
  }
}

class ShiftAssignment {
  final String id;
  final String employeeId;
  final String shiftId;
  final DateTime effectiveFrom;
  final DateTime? effectiveTo;
  final DateTime createdAt;
  final Map<String, dynamic>? employee;
  final Shift? shift;

  const ShiftAssignment({
    required this.id,
    required this.employeeId,
    required this.shiftId,
    required this.effectiveFrom,
    this.effectiveTo,
    required this.createdAt,
    this.employee,
    this.shift,
  });

  factory ShiftAssignment.fromJson(Map<String, dynamic> j) => ShiftAssignment(
        id: j['id'] as String,
        employeeId: j['employeeId'] as String,
        shiftId: j['shiftId'] as String,
        effectiveFrom: DateTime.parse(j['effectiveFrom'] as String),
        effectiveTo:
            j['effectiveTo'] != null ? DateTime.parse(j['effectiveTo'] as String) : null,
        createdAt: DateTime.parse(j['createdAt'] as String),
        employee: j['employee'] as Map<String, dynamic>?,
        shift: j['shift'] != null
            ? Shift.fromJson(j['shift'] as Map<String, dynamic>)
            : null,
      );

  bool get isActive {
    final now = DateTime.now();
    if (now.isBefore(effectiveFrom)) return false;
    if (effectiveTo != null && now.isAfter(effectiveTo!)) return false;
    return true;
  }
}
