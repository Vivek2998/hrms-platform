import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../data/models/recruitment_model.dart';
import '../providers/recruitment_provider.dart';
import '../../../../core/theme/app_theme.dart';

class RecruitmentScreen extends ConsumerStatefulWidget {
  const RecruitmentScreen({super.key});

  @override
  ConsumerState<RecruitmentScreen> createState() => _RecruitmentScreenState();
}

class _RecruitmentScreenState extends ConsumerState<RecruitmentScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tab;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Recruitment'),
        bottom: TabBar(
          controller: _tab,
          tabs: const [
            Tab(text: 'Job Board'),
            Tab(text: 'Applications'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tab,
        children: const [
          _JobBoardTab(),
          _ApplicationsTab(),
        ],
      ),
    );
  }
}

// ── Job Board Tab ─────────────────────────────────────────────────────────────

class _JobBoardTab extends ConsumerWidget {
  const _JobBoardTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobsAsync = ref.watch(jobPostingsProvider());
    return jobsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (jobs) {
        if (jobs.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.work_outline_rounded, size: 64, color: Colors.grey[300]),
                const SizedBox(height: 12),
                Text('No open positions', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(jobPostingsProvider),
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            itemCount: jobs.length,
            itemBuilder: (_, i) => _JobCard(job: jobs[i]),
          ),
        );
      },
    );
  }
}

class _JobCard extends ConsumerWidget {
  final JobPosting job;
  const _JobCard({required this.job});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fmt = NumberFormat.compactCurrency(symbol: '₹', decimalDigits: 0);
    final (statusLabel, statusColor) = switch (job.status) {
      'OPEN' => ('Open', AppColors.success),
      'FILLED' => ('Filled', AppColors.info),
      _ => ('Closed', Colors.grey),
    };

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
                  child: Text(job.title,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withAlpha(30),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(statusLabel,
                      style: TextStyle(
                          color: statusColor, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              runSpacing: 4,
              children: [
                if (job.location != null)
                  _Chip(Icons.location_on_outlined, job.location!),
                _Chip(Icons.work_outline_rounded,
                    kEmploymentTypeLabels[job.employmentType] ?? job.employmentType),
                _Chip(Icons.people_outline, '${job.openings} opening${job.openings > 1 ? 's' : ''}'),
                if (job.applicationCount > 0)
                  _Chip(Icons.inbox_outlined, '${job.applicationCount} applied'),
              ],
            ),
            if (job.minSalary != null || job.maxSalary != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.currency_rupee_rounded, size: 14, color: Colors.grey),
                  const SizedBox(width: 2),
                  Text(
                    job.minSalary != null && job.maxSalary != null
                        ? '${fmt.format(job.minSalary)} – ${fmt.format(job.maxSalary)}'
                        : job.minSalary != null
                            ? 'From ${fmt.format(job.minSalary)}'
                            : 'Up to ${fmt.format(job.maxSalary)}',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ],
            if (job.closingDate != null) ...[
              const SizedBox(height: 4),
              _Chip(Icons.event_outlined,
                  'Closes ${DateFormat('d MMM yyyy').format(DateTime.parse(job.closingDate!))}'),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _showDetails(context, job),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    child: const Text('View Details'),
                  ),
                ),
                if (job.isOpen) ...[
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => _showApplySheet(context, ref, job),
                      style: FilledButton.styleFrom(
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      child: const Text('Apply Now'),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showDetails(BuildContext context, JobPosting job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _JobDetailsSheet(job: job),
    );
  }

  void _showApplySheet(BuildContext context, WidgetRef ref, JobPosting job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ApplySheet(job: job),
    );
  }
}

// ── Job Details Sheet ─────────────────────────────────────────────────────────

class _JobDetailsSheet extends StatelessWidget {
  final JobPosting job;
  const _JobDetailsSheet({required this.job});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(job.title,
                        style: const TextStyle(
                            fontSize: 17, fontWeight: FontWeight.w700)),
                  ),
                  IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.all(16),
                children: [
                  _DetailSection('Description', job.description),
                  if (job.requirements != null)
                    _DetailSection('Requirements', job.requirements!),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailSection extends StatelessWidget {
  final String title;
  final String content;
  const _DetailSection(this.title, this.content);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 6),
            Text(content,
                style: TextStyle(fontSize: 13, color: Colors.grey[700], height: 1.5)),
          ],
        ),
      );
}

// ── Apply Sheet ───────────────────────────────────────────────────────────────

class _ApplySheet extends ConsumerStatefulWidget {
  final JobPosting job;
  const _ApplySheet({required this.job});

  @override
  ConsumerState<_ApplySheet> createState() => _ApplySheetState();
}

class _ApplySheetState extends ConsumerState<_ApplySheet> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _resume = TextEditingController();
  final _cover = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _resume.dispose();
    _cover.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(recruitmentNotifierProvider);
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (_, controller) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: Text('Apply — ${widget.job.title}',
                        style: const TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ),
                  IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: Form(
                key: _formKey,
                child: ListView(
                  controller: controller,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  children: [
                    _Field('Full Name *', _name, validator: (v) =>
                        v == null || v.isEmpty ? 'Required' : null),
                    _Field('Email *', _email,
                        keyboard: TextInputType.emailAddress,
                        validator: (v) => v == null || !v.contains('@')
                            ? 'Enter a valid email'
                            : null),
                    _Field('Phone', _phone, keyboard: TextInputType.phone),
                    _Field('Resume URL', _resume,
                        keyboard: TextInputType.url,
                        hint: 'https://...'),
                    _Field('Cover Letter', _cover, maxLines: 4),
                  ],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                  16, 8, 16, MediaQuery.paddingOf(context).bottom + 16),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: state.isLoading ? null : _submit,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  child: state.isLoading
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Submit Application',
                          style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await ref.read(recruitmentNotifierProvider.notifier).apply(
          widget.job.id,
          candidateName: _name.text.trim(),
          candidateEmail: _email.text.trim(),
          candidatePhone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
          resumeUrl: _resume.text.trim().isEmpty ? null : _resume.text.trim(),
          coverLetter: _cover.text.trim().isEmpty ? null : _cover.text.trim(),
        );
    if (ok && mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Text('Application submitted!'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ));
    }
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final TextInputType keyboard;
  final String? hint;
  final int maxLines;
  final String? Function(String?)? validator;

  const _Field(this.label, this.controller, {
    this.keyboard = TextInputType.text,
    this.hint,
    this.maxLines = 1,
    this.validator,
  });

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: TextFormField(
          controller: controller,
          keyboardType: keyboard,
          maxLines: maxLines,
          validator: validator,
          decoration: InputDecoration(
            labelText: label,
            hintText: hint,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      );
}

// ── Applications Tab ──────────────────────────────────────────────────────────

class _ApplicationsTab extends ConsumerStatefulWidget {
  const _ApplicationsTab();

  @override
  ConsumerState<_ApplicationsTab> createState() => _ApplicationsTabState();
}

class _ApplicationsTabState extends ConsumerState<_ApplicationsTab> {
  String? _selectedStage;

  @override
  Widget build(BuildContext context) {
    final appsAsync =
        ref.watch(jobApplicationsProvider(stage: _selectedStage));
    return Column(
      children: [
        // Stage filter chips
        SizedBox(
          height: 48,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            children: [
              _FilterChip('All', null, _selectedStage,
                  (v) => setState(() => _selectedStage = v)),
              ...kStages.map((s) => _FilterChip(
                    kStageLabels[s] ?? s,
                    s,
                    _selectedStage,
                    (v) => setState(() => _selectedStage = v),
                  )),
            ],
          ),
        ),
        Expanded(
          child: appsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
            data: (apps) {
              if (apps.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.inbox_outlined,
                          size: 64, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text('No applications found',
                          style: TextStyle(
                              color: Colors.grey[500], fontSize: 16)),
                    ],
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(jobApplicationsProvider),
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                  itemCount: apps.length,
                  itemBuilder: (_, i) => _ApplicationCard(app: apps[i]),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final String? value;
  final String? selected;
  final ValueChanged<String?> onTap;

  const _FilterChip(this.label, this.value, this.selected, this.onTap);

  @override
  Widget build(BuildContext context) {
    final isSelected = selected == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.primaryLight,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.primary,
          ),
        ),
      ),
    );
  }
}

class _ApplicationCard extends ConsumerWidget {
  final JobApplication app;
  const _ApplicationCard({required this.app});

  static const _stageColors = {
    'APPLIED': Color(0xFF6B7280),
    'SCREENING': Color(0xFF3B82F6),
    'INTERVIEW': Color(0xFF8B5CF6),
    'OFFER': Color(0xFFF59E0B),
    'HIRED': Color(0xFF10B981),
    'REJECTED': Color(0xFFEF4444),
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stageColor = _stageColors[app.stage] ?? Colors.grey;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(app.candidateName,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 14)),
                      Text(app.candidateEmail,
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey[500])),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: stageColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(kStageLabels[app.stage] ?? app.stage,
                      style: TextStyle(
                          color: stageColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            if (app.jobTitle != null) ...[
              const SizedBox(height: 4),
              _Chip(Icons.work_outline_rounded, app.jobTitle!),
            ],
            const SizedBox(height: 10),
            // Stage update
            DropdownButtonFormField<String>(
              initialValue: app.stage,
              decoration: InputDecoration(
                labelText: 'Move to stage',
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                isDense: true,
              ),
              items: kStages
                  .map((s) => DropdownMenuItem(
                        value: s,
                        child: Text(kStageLabels[s] ?? s,
                            style: const TextStyle(fontSize: 13)),
                      ))
                  .toList(),
              onChanged: (v) {
                if (v != null && v != app.stage) {
                  ref
                      .read(recruitmentNotifierProvider.notifier)
                      .updateStage(app.id, v);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared Chip ───────────────────────────────────────────────────────────────

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Chip(this.icon, this.label);

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.grey[500]),
          const SizedBox(width: 3),
          Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        ],
      );
}
