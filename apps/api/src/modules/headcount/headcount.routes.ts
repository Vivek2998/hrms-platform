import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const planSchema = z.object({
  departmentId: z.string().uuid().optional(),
  financialYear: z.string().min(4),
  budgetedCount: z.number().int().positive(),
  notes: z.string().optional(),
});

const positionSchema = z.object({
  planId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  title: z.string().min(2),
  count: z.number().int().min(1).default(1),
  targetDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function headcountRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /headcount/plans
  app.get('/headcount/plans', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const plans = await app.prisma.headcountPlan.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        openPositions: true,
        _count: { select: { openPositions: true } },
      },
      orderBy: [{ financialYear: 'desc' }, { createdAt: 'desc' }],
    });
    return reply.send(ok(plans));
  });

  // POST /headcount/plans
  app.post('/headcount/plans', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = planSchema.parse(req.body);
    const plan = await app.prisma.headcountPlan.create({
      data: { organizationId: req.user.orgId, ...input },
    });
    return reply.status(201).send(ok(plan));
  });

  // PATCH /headcount/plans/:id
  app.patch('/headcount/plans/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = planSchema.partial().parse(req.body);
    await app.prisma.headcountPlan.updateMany({ where: { id, organizationId: req.user.orgId }, data: input });
    return reply.send(ok({ id }));
  });

  // GET /headcount/positions
  app.get('/headcount/positions', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { status } = z.object({ status: z.string().optional() }).parse(req.query);
    const positions = await app.prisma.openPosition.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(status ? { status: status as any } : {}),
      },
      include: { plan: { select: { financialYear: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(positions));
  });

  // POST /headcount/positions
  app.post('/headcount/positions', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = positionSchema.parse(req.body);
    const position = await app.prisma.openPosition.create({
      data: {
        organizationId: req.user.orgId,
        ...input,
        targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      },
    });
    return reply.status(201).send(ok(position));
  });

  // PATCH /headcount/positions/:id
  app.patch('/headcount/positions/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = positionSchema.partial().merge(
      z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'FILLED', 'ON_HOLD', 'CANCELLED']).optional() })
    ).parse(req.body);
    await app.prisma.openPosition.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { ...input, targetDate: input.targetDate ? new Date(input.targetDate) : undefined },
    });
    return reply.send(ok({ id }));
  });
}
