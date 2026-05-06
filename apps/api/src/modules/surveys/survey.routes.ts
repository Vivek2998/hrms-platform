import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const questionSchema = z.object({
  questionText: z.string().min(1),
  questionType: z.enum(['RATING_5', 'RATING_10', 'TEXT', 'MULTIPLE_CHOICE']).default('RATING_5'),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  questions: z.array(questionSchema).min(1),
});

const respondSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      ratingValue: z.number().int().optional(),
      textValue: z.string().optional(),
    }),
  ),
});

export function surveyRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /surveys — HR sees all; employees see only ACTIVE
  app.get('/surveys', auth, async (req, reply) => {
    const isHR = HR_ROLES.includes(req.user.role as typeof HR_ROLES[number]);
    const surveys = await app.prisma.pulseSurvey.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(isHR ? {} : { status: 'ACTIVE' }),
      },
      include: {
        _count: { select: { questions: true, responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each survey, check if the current employee has already responded
    const myResponseIds = isHR
      ? []
      : await app.prisma.surveyResponse
          .findMany({
            where: { employeeId: req.user.sub, surveyId: { in: surveys.map((s) => s.id) } },
            select: { surveyId: true },
          })
          .then((rows) => rows.map((r) => r.surveyId));

    const data = surveys.map((s) => ({
      ...s,
      hasResponded: myResponseIds.includes(s.id),
    }));

    return reply.send(ok(data));
  });

  // POST /surveys — HR only
  app.post('/surveys', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as typeof HR_ROLES[number])) throw fail('Forbidden', 403);
    const input = createSchema.parse(req.body);

    const survey = await app.prisma.pulseSurvey.create({
      data: {
        organizationId: req.user.orgId,
        title: input.title,
        ...(input.description ? { description: input.description } : {}),
        isAnonymous: input.isAnonymous,
        ...(input.startsAt ? { startsAt: new Date(input.startsAt) } : {}),
        ...(input.endsAt ? { endsAt: new Date(input.endsAt) } : {}),
        createdBy: req.user.sub,
        questions: {
          create: input.questions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options ?? [],
            isRequired: q.isRequired,
            displayOrder: q.displayOrder,
          })),
        },
      },
      include: { questions: true },
    });

    return reply.status(201).send(ok(survey));
  });

  // GET /surveys/:id — with questions + responded flag
  app.get('/surveys/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const survey = await app.prisma.pulseSurvey.findFirst({
      where: { id, organizationId: req.user.orgId },
      include: { questions: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!survey) throw fail('Survey not found', 404);

    const existing = await app.prisma.surveyResponse.findUnique({
      where: { surveyId_employeeId: { surveyId: id, employeeId: req.user.sub } },
    });

    return reply.send(ok({ ...survey, hasResponded: !!existing }));
  });

  // PATCH /surveys/:id/status — HR activate or close
  app.patch('/surveys/:id/status', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as typeof HR_ROLES[number])) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const { status } = z.object({ status: z.enum(['ACTIVE', 'CLOSED', 'DRAFT']) }).parse(req.body);

    const survey = await app.prisma.pulseSurvey.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { status },
    });
    if (survey.count === 0) throw fail('Survey not found', 404);

    return reply.send(ok({ id, status }));
  });

  // POST /surveys/:id/respond — employee submits answers
  app.post('/surveys/:id/respond', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = respondSchema.parse(req.body);

    const survey = await app.prisma.pulseSurvey.findFirst({
      where: { id, organizationId: req.user.orgId, status: 'ACTIVE' },
    });
    if (!survey) throw fail('Survey not found or not active', 404);

    const existing = await app.prisma.surveyResponse.findUnique({
      where: { surveyId_employeeId: { surveyId: id, employeeId: req.user.sub } },
    });
    if (existing) throw fail('Already responded to this survey', 409);

    const response = await app.prisma.surveyResponse.create({
      data: {
        surveyId: id,
        employeeId: req.user.sub,
        answers: {
          create: input.answers.map((a) => ({
            questionId: a.questionId,
            ...(a.ratingValue !== undefined ? { ratingValue: a.ratingValue } : {}),
            ...(a.textValue ? { textValue: a.textValue } : {}),
          })),
        },
      },
    });

    return reply.status(201).send(ok(response));
  });

  // GET /surveys/:id/results — HR only, aggregated results
  app.get('/surveys/:id/results', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as typeof HR_ROLES[number])) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };

    const survey = await app.prisma.pulseSurvey.findFirst({
      where: { id, organizationId: req.user.orgId },
      include: {
        questions: { orderBy: { displayOrder: 'asc' } },
        responses: { include: { answers: true } },
      },
    });
    if (!survey) throw fail('Survey not found', 404);

    const totalResponses = survey.responses.length;

    const questionResults = survey.questions.map((q) => {
      const allAnswers = survey.responses.flatMap((r) =>
        r.answers.filter((a) => a.questionId === q.id),
      );

      if (q.questionType === 'RATING_5' || q.questionType === 'RATING_10') {
        const ratings = allAnswers.map((a) => a.ratingValue ?? 0).filter((v) => v > 0);
        const avg = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : null;
        return { questionId: q.id, questionText: q.questionText, questionType: q.questionType, avg, count: ratings.length };
      }

      if (q.questionType === 'TEXT') {
        return { questionId: q.id, questionText: q.questionText, questionType: q.questionType, responses: allAnswers.map((a) => a.textValue) };
      }

      return { questionId: q.id, questionText: q.questionText, questionType: q.questionType, answers: allAnswers };
    });

    return reply.send(ok({ surveyId: id, totalResponses, questions: questionResults }));
  });
}
