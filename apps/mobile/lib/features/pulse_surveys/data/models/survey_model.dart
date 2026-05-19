class Survey {
  final String id;
  final String title;
  final String? description;
  final String status;
  final bool isAnonymous;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final int questionCount;
  final int responseCount;
  final bool hasResponded;

  const Survey({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.isAnonymous,
    this.startsAt,
    this.endsAt,
    required this.questionCount,
    required this.responseCount,
    required this.hasResponded,
  });

  factory Survey.fromJson(Map<String, dynamic> j) => Survey(
        id: j['id'] as String,
        title: j['title'] as String,
        description: j['description'] as String?,
        status: j['status'] as String,
        isAnonymous: j['isAnonymous'] as bool? ?? false,
        startsAt: j['startsAt'] != null ? DateTime.parse(j['startsAt'] as String) : null,
        endsAt: j['endsAt'] != null ? DateTime.parse(j['endsAt'] as String) : null,
        questionCount: (j['questionCount'] as num?)?.toInt() ??
            (j['_count'] as Map<String, dynamic>?)?['questions'] as int? ?? 0,
        responseCount: (j['responseCount'] as num?)?.toInt() ??
            (j['_count'] as Map<String, dynamic>?)?['responses'] as int? ?? 0,
        hasResponded: j['hasResponded'] as bool? ?? false,
      );

  bool get isActive => status == 'ACTIVE';
  bool get isDraft => status == 'DRAFT';
  bool get isClosed => status == 'CLOSED';
}

class SurveyQuestion {
  final String id;
  final String text;
  final String type;
  final List<String> options;
  final bool required;
  final int displayOrder;

  const SurveyQuestion({
    required this.id,
    required this.text,
    required this.type,
    required this.options,
    required this.required,
    required this.displayOrder,
  });

  factory SurveyQuestion.fromJson(Map<String, dynamic> j) => SurveyQuestion(
        id: j['id'] as String,
        text: j['text'] as String,
        type: j['type'] as String,
        options: (j['options'] as List?)?.map((e) => e as String).toList() ?? [],
        required: j['required'] as bool? ?? false,
        displayOrder: (j['displayOrder'] as num?)?.toInt() ?? 0,
      );

  bool get isRating5 => type == 'RATING_5';
  bool get isRating10 => type == 'RATING_10';
  bool get isText => type == 'TEXT';
  bool get isMultipleChoice => type == 'MULTIPLE_CHOICE';
}

class SurveyDetail extends Survey {
  final List<SurveyQuestion> questions;

  const SurveyDetail({
    required super.id,
    required super.title,
    super.description,
    required super.status,
    required super.isAnonymous,
    super.startsAt,
    super.endsAt,
    required super.questionCount,
    required super.responseCount,
    required super.hasResponded,
    required this.questions,
  });

  factory SurveyDetail.fromJson(Map<String, dynamic> j) {
    final base = Survey.fromJson(j);
    return SurveyDetail(
      id: base.id,
      title: base.title,
      description: base.description,
      status: base.status,
      isAnonymous: base.isAnonymous,
      startsAt: base.startsAt,
      endsAt: base.endsAt,
      questionCount: base.questionCount,
      responseCount: base.responseCount,
      hasResponded: base.hasResponded,
      questions: (j['questions'] as List? ?? [])
          .map((e) => SurveyQuestion.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder)),
    );
  }
}

class QuestionResult {
  final String questionId;
  final String questionText;
  final String type;
  final double? avg;
  final int count;
  final List<String> responses;

  const QuestionResult({
    required this.questionId,
    required this.questionText,
    required this.type,
    this.avg,
    required this.count,
    required this.responses,
  });

  factory QuestionResult.fromJson(Map<String, dynamic> j) => QuestionResult(
        questionId: j['questionId'] as String,
        questionText: j['questionText'] as String,
        type: j['type'] as String,
        avg: j['avg'] != null ? (j['avg'] as num).toDouble() : null,
        count: (j['count'] as num?)?.toInt() ?? 0,
        responses: (j['responses'] as List?)?.map((e) => e as String).toList() ?? [],
      );
}

class SurveyResults {
  final String surveyId;
  final String title;
  final int totalResponses;
  final List<QuestionResult> results;

  const SurveyResults({
    required this.surveyId,
    required this.title,
    required this.totalResponses,
    required this.results,
  });

  factory SurveyResults.fromJson(Map<String, dynamic> j) => SurveyResults(
        surveyId: j['surveyId'] as String,
        title: j['title'] as String,
        totalResponses: (j['totalResponses'] as num?)?.toInt() ?? 0,
        results: (j['results'] as List? ?? [])
            .map((e) => QuestionResult.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class SurveyAnswer {
  final String questionId;
  final int? ratingValue;
  final String? textValue;

  const SurveyAnswer({
    required this.questionId,
    this.ratingValue,
    this.textValue,
  });

  Map<String, dynamic> toJson() => {
        'questionId': questionId,
        if (ratingValue != null) 'ratingValue': ratingValue,
        if (textValue != null) 'textValue': textValue,
      };
}
