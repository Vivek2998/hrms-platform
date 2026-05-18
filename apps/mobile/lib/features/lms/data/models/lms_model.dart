import 'package:flutter/material.dart';

class LmsCourseCreator {
  final String id;
  final String firstName;
  final String lastName;
  final String? designation;
  final String employeeCode;

  const LmsCourseCreator({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.designation,
    required this.employeeCode,
  });

  factory LmsCourseCreator.fromJson(Map<String, dynamic> j) => LmsCourseCreator(
        id: j['id'] as String,
        firstName: j['firstName'] as String,
        lastName: j['lastName'] as String,
        designation: j['designation'] as String?,
        employeeCode: j['employeeCode'] as String,
      );
}

class MyEnrollment {
  final String courseId;
  final String status;
  final int progressPct;

  const MyEnrollment({
    required this.courseId,
    required this.status,
    required this.progressPct,
  });

  factory MyEnrollment.fromJson(Map<String, dynamic> j) => MyEnrollment(
        courseId: j['courseId'] as String,
        status: j['status'] as String,
        progressPct: (j['progressPct'] as num).toInt(),
      );

  bool get isCompleted => status == 'COMPLETED';
}

class LearningCourse {
  final String id;
  final String title;
  final String? description;
  final String? thumbnailUrl;
  final String category;
  final String level;
  final int durationMinutes;
  final String status;
  final List<String> tags;
  final String? externalUrl;
  final DateTime createdAt;
  final LmsCourseCreator createdBy;
  final int enrollmentCount;
  final MyEnrollment? myEnrollment;

  const LearningCourse({
    required this.id,
    required this.title,
    this.description,
    this.thumbnailUrl,
    required this.category,
    required this.level,
    required this.durationMinutes,
    required this.status,
    required this.tags,
    this.externalUrl,
    required this.createdAt,
    required this.createdBy,
    required this.enrollmentCount,
    this.myEnrollment,
  });

  factory LearningCourse.fromJson(Map<String, dynamic> j) => LearningCourse(
        id: j['id'] as String,
        title: j['title'] as String,
        description: j['description'] as String?,
        thumbnailUrl: j['thumbnailUrl'] as String?,
        category: j['category'] as String? ?? 'General',
        level: j['level'] as String? ?? 'BEGINNER',
        durationMinutes: (j['durationMinutes'] as num?)?.toInt() ?? 0,
        status: j['status'] as String,
        tags: (j['tags'] as List?)?.map((e) => e as String).toList() ?? [],
        externalUrl: j['externalUrl'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
        createdBy: LmsCourseCreator.fromJson(j['createdBy'] as Map<String, dynamic>),
        enrollmentCount:
            (j['_count'] as Map<String, dynamic>?)?['enrollments'] as int? ?? 0,
        myEnrollment: j['myEnrollment'] != null
            ? MyEnrollment.fromJson(j['myEnrollment'] as Map<String, dynamic>)
            : null,
      );

  String get formattedDuration {
    if (durationMinutes <= 0) return '';
    if (durationMinutes < 60) return '${durationMinutes}m';
    final h = durationMinutes ~/ 60;
    final m = durationMinutes % 60;
    return m > 0 ? '${h}h ${m}m' : '${h}h';
  }
}

class CourseEnrollment {
  final String id;
  final String courseId;
  final String employeeId;
  final String status;
  final int progressPct;
  final DateTime? completedAt;
  final DateTime enrolledAt;
  final LearningCourse course;

  const CourseEnrollment({
    required this.id,
    required this.courseId,
    required this.employeeId,
    required this.status,
    required this.progressPct,
    this.completedAt,
    required this.enrolledAt,
    required this.course,
  });

  factory CourseEnrollment.fromJson(Map<String, dynamic> j) => CourseEnrollment(
        id: j['id'] as String,
        courseId: j['courseId'] as String,
        employeeId: j['employeeId'] as String,
        status: j['status'] as String,
        progressPct: (j['progressPct'] as num).toInt(),
        completedAt:
            j['completedAt'] != null ? DateTime.parse(j['completedAt'] as String) : null,
        enrolledAt: DateTime.parse(j['enrolledAt'] as String),
        course: LearningCourse.fromJson(j['course'] as Map<String, dynamic>),
      );

  bool get isCompleted => status == 'COMPLETED';
}

const kLevelMeta = {
  'BEGINNER': (label: 'Beginner', color: Color(0xFF10B981)),
  'INTERMEDIATE': (label: 'Intermediate', color: Color(0xFF3B82F6)),
  'ADVANCED': (label: 'Advanced', color: Color(0xFF7C3AED)),
};
