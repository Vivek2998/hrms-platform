class Project {
  final String id;
  final String name;
  final String? clientName;

  const Project({required this.id, required this.name, this.clientName});

  factory Project.fromJson(Map<String, dynamic> j) => Project(
        id: j['id'] as String,
        name: j['name'] as String,
        clientName: j['clientName'] as String?,
      );
}

class TimesheetEntry {
  final String id;
  final String projectId;
  final String date;
  final double hours;
  final String? note;
  final String status;

  const TimesheetEntry({
    required this.id,
    required this.projectId,
    required this.date,
    required this.hours,
    this.note,
    required this.status,
  });

  factory TimesheetEntry.fromJson(Map<String, dynamic> j) => TimesheetEntry(
        id: j['id'] as String,
        projectId: j['projectId'] as String,
        date: j['date'] as String,
        hours: (j['hours'] as num).toDouble(),
        note: j['note'] as String?,
        status: j['status'] as String? ?? 'DRAFT',
      );
}
