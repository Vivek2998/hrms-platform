class Holiday {
  final String id;
  final String name;
  final DateTime date;
  final String type; // NATIONAL | REGIONAL | OPTIONAL
  final int year;

  const Holiday({
    required this.id,
    required this.name,
    required this.date,
    required this.type,
    required this.year,
  });

  bool get isUpcoming => date.isAfter(DateTime.now().subtract(const Duration(days: 1)));
  bool get isToday {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  factory Holiday.fromJson(Map<String, dynamic> json) => Holiday(
        id: json['id'] as String,
        name: json['name'] as String,
        date: DateTime.parse(json['date'] as String),
        type: json['type'] as String,
        year: json['year'] as int,
      );
}
