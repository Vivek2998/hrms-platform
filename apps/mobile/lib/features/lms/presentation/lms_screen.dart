import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/models/lms_model.dart';
import '../providers/lms_provider.dart';
import '../../../../core/theme/app_theme.dart';

class LmsScreen extends ConsumerStatefulWidget {
  const LmsScreen({super.key});

  @override
  ConsumerState<LmsScreen> createState() => _LmsScreenState();
}

class _LmsScreenState extends ConsumerState<LmsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;
  final _search = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Learning Hub'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [
            Tab(text: 'Catalog'),
            Tab(text: 'My Learning'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: [
          _CatalogTab(query: _query, searchController: _search,
              onSearch: (v) => setState(() => _query = v)),
          const _MyLearningTab(),
        ],
      ),
    );
  }
}

// ── Catalog Tab ───────────────────────────────────────────────────────────────

class _CatalogTab extends ConsumerWidget {
  final String query;
  final TextEditingController searchController;
  final ValueChanged<String> onSearch;

  const _CatalogTab({
    required this.query,
    required this.searchController,
    required this.onSearch,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(lmsCoursesProvider(search: query.isEmpty ? null : query));
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            controller: searchController,
            onChanged: onSearch,
            decoration: InputDecoration(
              hintText: 'Search courses…',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded),
                      onPressed: () {
                        searchController.clear();
                        onSearch('');
                      },
                    )
                  : null,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
        Expanded(
          child: coursesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
            data: (courses) {
              if (courses.isEmpty) {
                return const Center(child: Text('No courses found'));
              }
              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(lmsCoursesProvider),
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: courses.length,
                  itemBuilder: (_, i) => _CourseCard(course: courses[i]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── My Learning Tab ───────────────────────────────────────────────────────────

class _MyLearningTab extends ConsumerWidget {
  const _MyLearningTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enrollmentsAsync = ref.watch(myLmsCoursesProvider);
    return enrollmentsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (enrollments) {
        if (enrollments.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.school_outlined, size: 64, color: Colors.grey[300]),
                const SizedBox(height: 12),
                Text(
                  'No courses enrolled yet',
                  style: TextStyle(color: Colors.grey[500], fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  'Browse the catalog to get started',
                  style: TextStyle(color: Colors.grey[400], fontSize: 13),
                ),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(myLmsCoursesProvider),
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: enrollments.length,
            itemBuilder: (_, i) => _EnrollmentCard(enrollment: enrollments[i]),
          ),
        );
      },
    );
  }
}

// ── Course Card (Catalog) ─────────────────────────────────────────────────────

class _CourseCard extends ConsumerWidget {
  final LearningCourse course;
  const _CourseCard({required this.course});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(lmsNotifierProvider.notifier);
    final state = ref.watch(lmsNotifierProvider);
    final enrolled = course.myEnrollment != null;
    final levelMeta = kLevelMeta[course.level];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    course.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                ),
                if (levelMeta != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: levelMeta.color.withAlpha(30),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      levelMeta.label,
                      style: TextStyle(
                          color: levelMeta.color,
                          fontSize: 11,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
              ],
            ),
            if (course.description != null) ...[
              const SizedBox(height: 6),
              Text(
                course.description!,
                style:
                    TextStyle(fontSize: 13, color: Colors.grey[600]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                _Chip(Icons.category_outlined, course.category),
                if (course.formattedDuration.isNotEmpty)
                  _Chip(Icons.schedule_outlined, course.formattedDuration),
                _Chip(Icons.people_outline,
                    '${course.enrollmentCount} enrolled'),
              ],
            ),
            if (enrolled && course.myEnrollment != null) ...[
              const SizedBox(height: 10),
              _ProgressBar(progressPct: course.myEnrollment!.progressPct),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${course.myEnrollment!.progressPct}% complete',
                    style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600]),
                  ),
                  if (!course.myEnrollment!.isCompleted)
                    TextButton(
                      style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize:
                              MaterialTapTargetSize.shrinkWrap),
                      onPressed: state.isLoading
                          ? null
                          : () async {
                              final newPct =
                                  (course.myEnrollment!.progressPct + 25)
                                      .clamp(0, 100);
                              await notifier.updateProgress(
                                  course.id, newPct);
                            },
                      child: const Text('+25%',
                          style: TextStyle(fontSize: 12)),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                if (course.externalUrl != null)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final uri = Uri.tryParse(course.externalUrl!);
                        if (uri != null) await launchUrl(uri);
                      },
                      icon: const Icon(Icons.open_in_new_rounded, size: 16),
                      label: const Text('Open'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                if (course.externalUrl != null && !enrolled)
                  const SizedBox(width: 8),
                if (!enrolled)
                  Expanded(
                    child: FilledButton(
                      onPressed: state.isLoading
                          ? null
                          : () async {
                              await notifier.enroll(course.id);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                        'Enrolled in ${course.title}'),
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                  ),
                                );
                              }
                            },
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Enroll'),
                    ),
                  )
                else
                  Expanded(
                    child: FilledButton.tonal(
                      onPressed: null,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(
                        course.myEnrollment!.isCompleted
                            ? 'Completed'
                            : 'Enrolled',
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Enrollment Card (My Learning) ─────────────────────────────────────────────

class _EnrollmentCard extends ConsumerWidget {
  final CourseEnrollment enrollment;
  const _EnrollmentCard({required this.enrollment});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(lmsNotifierProvider.notifier);
    final state = ref.watch(lmsNotifierProvider);
    final course = enrollment.course;
    final levelMeta = kLevelMeta[course.level];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    course.title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                ),
                _StatusBadge(status: enrollment.status),
              ],
            ),
            if (course.description != null) ...[
              const SizedBox(height: 6),
              Text(
                course.description!,
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                if (levelMeta != null)
                  _Chip(Icons.signal_cellular_alt_outlined, levelMeta.label),
                if (course.formattedDuration.isNotEmpty)
                  _Chip(Icons.schedule_outlined, course.formattedDuration),
              ],
            ),
            const SizedBox(height: 10),
            _ProgressBar(progressPct: enrollment.progressPct),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${enrollment.progressPct}% complete',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                if (!enrollment.isCompleted)
                  TextButton(
                    style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                    onPressed: state.isLoading
                        ? null
                        : () async {
                            final newPct =
                                (enrollment.progressPct + 25).clamp(0, 100);
                            await notifier.updateProgress(
                                enrollment.courseId, newPct);
                          },
                    child: const Text('+25%',
                        style: TextStyle(fontSize: 12)),
                  ),
              ],
            ),
            if (course.externalUrl != null) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final uri = Uri.tryParse(course.externalUrl!);
                    if (uri != null) await launchUrl(uri);
                  },
                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                  label: const Text('Open Course'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

class _ProgressBar extends StatelessWidget {
  final int progressPct;
  const _ProgressBar({required this.progressPct});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: LinearProgressIndicator(
        value: progressPct / 100,
        minHeight: 6,
        backgroundColor: Colors.grey[200],
        valueColor: AlwaysStoppedAnimation<Color>(
          progressPct >= 100 ? AppColors.success : AppColors.primary,
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Chip(this.icon, this.label);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: Colors.grey[500]),
        const SizedBox(width: 3),
        Text(label,
            style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      'COMPLETED' => ('Completed', AppColors.success),
      'IN_PROGRESS' => ('In Progress', AppColors.info),
      'DROPPED' => ('Dropped', AppColors.error),
      _ => ('Enrolled', AppColors.warning),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
            color: color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}
