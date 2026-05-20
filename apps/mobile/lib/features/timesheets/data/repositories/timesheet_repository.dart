import 'package:dio/dio.dart';
import '../models/timesheet_model.dart';

class TimesheetRepository {
  final Dio _dio;
  TimesheetRepository({required Dio dio}) : _dio = dio;

  Future<List<Project>> getProjects() async {
    final res = await _dio.get('/projects');
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => Project.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Project> createProject(String name, {String? clientName}) async {
    final res = await _dio.post('/projects', data: {
      'name': name,
      if (clientName != null) 'clientName': clientName,
    });
    return Project.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<List<TimesheetEntry>> getEntries({String? weekStart}) async {
    final res = await _dio.get('/timesheet/entries',
        queryParameters: {if (weekStart != null) 'weekStart': weekStart});
    final data = res.data['data'] as List<dynamic>;
    return data
        .map((e) => TimesheetEntry.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<TimesheetEntry> upsertEntry({
    required String projectId,
    required String date,
    required double hours,
    required String weekStart,
    String? note,
  }) async {
    final res = await _dio.post('/timesheet/entries', data: {
      'projectId': projectId,
      'date': date,
      'hours': hours,
      'weekStart': weekStart,
      if (note != null) 'note': note,
    });
    return TimesheetEntry.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<void> submitWeek(String weekStart) async {
    await _dio.post('/timesheet/submit', data: {'weekStart': weekStart});
  }
}
