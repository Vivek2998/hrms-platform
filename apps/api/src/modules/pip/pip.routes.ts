import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;

const createSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string().min(3),
  reason: z.string().min(10),
  startDate: z.string(),
  endDate: z.string(),
  goals: z.array(z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    targetDate: z.string().optional(),
  })).min(1),
});

const empSelect = {
  id: true, firstName: true, lastName: true, employeeCode: true,
  avatarUrl: true, designation: true,
  department: { select: { name: true } },
};

export async function pipRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /pip — Manager/HR sees all; employee sees own
  app.get('/pip', auth, async (req, reply) => {
    const isManager = (MANAGER_ROLES as readonly string[]).includes(req.user.role);
    const pips = await app.prisma.performanceImprovementPlan.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(!isManager ? { employeeId: req.user.sub } : {}),
      },
      include: {
        employee: { select: empSelect },
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { goals: true, checkIns: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(pips));
  });

  // GET /pip/:id
  app.get('/pip/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const isManager = (MANAGER_ROLES as readonly string[]).includes(req.user.role);
    const pip = await app.prisma.performanceImprovementPlan.findFirst({
      where: {
        id, organizationId: req.user.orgId,
        ...(!isManager ? { employeeId: req.user.sub } : {}),
      },
      include: {
        employee: { select: empSelect },
        manager: { select: { id: true, firstName: true, lastName: true } },
        goals: { orderBy: { createdAt: 'asc' } },
        checkIns: { orderBy: { conductedAt: 'asc' } },
      },
    });
    if (!pip) throw fail('PIP not found', 404);
    return reply.send(ok(pip));
  });

  // POST /pip — Manager/HR creates
  app.post('/pip', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = createSchema.parse(req.body);

    const pip = await app.prisma.performanceImprovementPlan.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        managerId: req.user.sub,
        title: input.title,
        reason: input.reason,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        goals: {
          create: input.goals.map((g) => ({
            title: g.title,
            description: g.description,
            targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
          })),
        },
      },
      include: { employee: { select: empSelect }, goals: true },
    });
    return reply.status(201).send(ok(pip));
  });

  // PATCH /pip/:id/status
  app.patch('/pip/:id/status', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const { status, outcome } = z.object({
      status: z.enum(['ACTIVE', 'COMPLETED', 'EXTENDED', 'TERMINATED']),
      outcome: z.string().optional(),
    }).parse(req.body);

    await app.prisma.performanceImprovementPlan.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { status, outcome, closedAt: status !== 'ACTIVE' ? new Date() : null },
    });
    return reply.send(ok({ id, status }));
  });

  // PATCH /pip/:id/goals/:goalId
  app.patch('/pip/:id/goals/:goalId', auth, async (req, reply) => {
    const { goalId } = req.params as { id: string; goalId: string };
    const { status } = z.object({ status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'MISSED']) }).parse(req.body);
    await app.prisma.pIPGoal.update({ where: { id: goalId }, data: { status } });
    return reply.send(ok({ goalId, status }));
  });

  // POST /pip/:id/check-ins
  app.post('/pip/:id/check-ins', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = z.object({ conductedAt: z.string(), notes: z.string().optional(), progress: z.string().optional() }).parse(req.body);
    const checkIn = await app.prisma.pIPCheckIn.create({
      data: { pipId: id, conductedAt: new Date(input.conductedAt), notes: input.notes, progress: input.progress },
    });
    return reply.status(201).send(ok(checkIn));
  });
}
