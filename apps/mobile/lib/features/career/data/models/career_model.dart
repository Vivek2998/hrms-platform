class Designation {
  final String id;
  final String name;
  final int level;
  final String? department;
  final List<String> skills;

  const Designation({
    required this.id,
    required this.name,
    required this.level,
    this.department,
    required this.skills,
  });

  factory Designation.fromJson(Map<String, dynamic> j) => Designation(
        id: j['id'] as String,
        name: j['name'] as String,
        level: j['level'] as int,
        department: j['department'] as String?,
        skills: (j['skills'] as List<dynamic>? ?? [])
            .map((e) => e as String)
            .toList(),
      );
}

class CareerPath {
  final String id;
  final int? typicalYears;
  final List<String> skillsRequired;
  final Designation? fromDesignation;
  final Designation? toDesignation;

  const CareerPath({
    required this.id,
    this.typicalYears,
    required this.skillsRequired,
    this.fromDesignation,
    this.toDesignation,
  });

  factory CareerPath.fromJson(Map<String, dynamic> j) => CareerPath(
        id: j['id'] as String,
        typicalYears: j['typicalYears'] as int?,
        skillsRequired: (j['skillsRequired'] as List<dynamic>? ?? [])
            .map((e) => e as String)
            .toList(),
        fromDesignation: j['fromDesignation'] != null
            ? Designation.fromJson(j['fromDesignation'] as Map<String, dynamic>)
            : null,
        toDesignation: j['toDesignation'] != null
            ? Designation.fromJson(j['toDesignation'] as Map<String, dynamic>)
            : null,
      );
}
