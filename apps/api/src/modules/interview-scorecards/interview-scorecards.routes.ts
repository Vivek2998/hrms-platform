import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;

const scoreItemSchema = z.object({ competency: z.string(), rating: z.number().min(1).max(5), notes: z.string().optional() });
const templateItemSchema = z.object({ competency: z.string(), weight: z.number().optional() });

const createSchema = z.object({
  candidateName: z.string().min(1),
  applicationId: z.string().optional(),
  interviewId: z.string().optional(),
  interviewerIds: z.array(z.string()).optional(),
  template: z.array(templateItemSchema),
  scores: z.array(scoreItemSchema),
  overallRating: z.number().min(1).max(5).optional(),
  recommendation: z.enum(['STRONG_YES', 'YES', 'MAYBE', 'NO', 'STRONG_NO']).optional(),
  notes: z.string().optional(),
  completedAt: z.string().optional(),
});

export async function interviewScorecardsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/interview-scorecards', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const q = req.query as any;
    const data = await app.prisma.interviewScorecard.findMany({
      where: { organizationId: req.user.orgId, ...(q.applicationId ? { applicationId: q.applicationId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.post('/interview-scorecards', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = createSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const scorecard = await app.prisma.interviewScorecard.create({
      data: {
        organizationId: req.user.orgId,
        ...body.data,
        interviewerIds: body.data.interviewerIds ?? [],
        completedAt: body.data.completedAt ? new Date(body.data.completedAt) : new Date(),
      },
    });
    return reply.status(201).send(ok(scorecard));
  });

  app.get('/interview-scorecards/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { id } = req.params as any;
    const data = await app.prisma.interviewScorecard.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!data) throw fail('Not found', 404);
    return reply.send(ok(data));
  });

  app.patch('/interview-scorecards/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = createSchema.partial().safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const data = await app.prisma.interviewScorecard.update({
      where: { id, organizationId: req.user.orgId },
      data: { ...body.data, completedAt: body.data.completedAt ? new Date(body.data.completedAt) : undefined },
    });
    return reply.send(ok(data));
  });
}
