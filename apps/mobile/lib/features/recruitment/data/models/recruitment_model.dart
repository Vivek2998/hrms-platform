class JobPosting {
  final String id;
  final String title;
  final String? location;
  final String employmentType;
  final String description;
  final String? requirements;
  final double? minSalary;
  final double? maxSalary;
  final int openings;
  final String status;
  final String? closingDate;
  final DateTime createdAt;
  final int applicationCount;

  const JobPosting({
    required this.id,
    required this.title,
    this.location,
    required this.employmentType,
    required this.description,
    this.requirements,
    this.minSalary,
    this.maxSalary,
    required this.openings,
    required this.status,
    this.closingDate,
    required this.createdAt,
    required this.applicationCount,
  });

  factory JobPosting.fromJson(Map<String, dynamic> j) => JobPosting(
        id: j['id'] as String,
        title: j['title'] as String,
        location: j['location'] as String?,
        employmentType: j['employmentType'] as String? ?? 'FULL_TIME',
        description: j['description'] as String,
        requirements: j['requirements'] as String?,
        minSalary: j['minSalary'] != null ? (j['minSalary'] as num).toDouble() : null,
        maxSalary: j['maxSalary'] != null ? (j['maxSalary'] as num).toDouble() : null,
        openings: (j['openings'] as num?)?.toInt() ?? 1,
        status: j['status'] as String,
        closingDate: j['closingDate'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
        applicationCount:
            (j['_count'] as Map<String, dynamic>?)?['applications'] as int? ?? 0,
      );

  bool get isOpen => status == 'OPEN';
}

class JobApplication {
  final String id;
  final String jobId;
  final String candidateName;
  final String candidateEmail;
  final String? candidatePhone;
  final String? resumeUrl;
  final String stage;
  final String? notes;
  final String? rejectionReason;
  final DateTime createdAt;
  final String? jobTitle;
  final int interviewCount;

  const JobApplication({
    required this.id,
    required this.jobId,
    required this.candidateName,
    required this.candidateEmail,
    this.candidatePhone,
    this.resumeUrl,
    required this.stage,
    this.notes,
    this.rejectionReason,
    required this.createdAt,
    this.jobTitle,
    required this.interviewCount,
  });

  factory JobApplication.fromJson(Map<String, dynamic> j) => JobApplication(
        id: j['id'] as String,
        jobId: j['jobId'] as String,
        candidateName: j['candidateName'] as String,
        candidateEmail: j['candidateEmail'] as String,
        candidatePhone: j['candidatePhone'] as String?,
        resumeUrl: j['resumeUrl'] as String?,
        stage: j['stage'] as String,
        notes: j['notes'] as String?,
        rejectionReason: j['rejectionReason'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
        jobTitle: (j['job'] as Map<String, dynamic>?)?['title'] as String?,
        interviewCount:
            (j['_count'] as Map<String, dynamic>?)?['interviews'] as int? ?? 0,
      );
}

const kEmploymentTypeLabels = {
  'FULL_TIME': 'Full Time',
  'PART_TIME': 'Part Time',
  'CONTRACT': 'Contract',
  'INTERN': 'Intern',
  'CONSULTANT': 'Consultant',
};

const kStageLabels = {
  'APPLIED': 'Applied',
  'SCREENING': 'Screening',
  'INTERVIEW': 'Interview',
  'OFFER': 'Offer',
  'HIRED': 'Hired',
  'REJECTED': 'Rejected',
};

const kStages = [
  'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED',
];
