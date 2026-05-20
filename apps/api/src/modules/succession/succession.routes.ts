import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const planSchema = z.object({
  roleTitle: z.string().min(2),
  departmentId: z.string().uuid().optional(),
  isCritical: z.boolean().default(true),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  notes: z.string().optional(),
});

const nomineeSchema = z.object({
  employeeId: z.string().uuid(),
  readiness: z.enum(['READY_NOW', 'ONE_TO_TWO_YEARS', 'THREE_TO_FIVE_YEARS']).default('ONE_TO_TWO_YEARS'),
  notes: z.string().optional(),
});

const empSelect = {
  id: true, firstName: true, lastName: true, employeeCode: true,
  designation: true, avatarUrl: true,
  department: { select: { name: true } },
};

export async function successionRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /succession/plans
  app.get('/succession/plans', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const plans = await app.prisma.successionPlan.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        successors: {
          include: { employee: { select: empSelect } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { successors: true } },
      },
      orderBy: [{ isCritical: 'desc' }, { riskLevel: 'asc' }],
    });
    return reply.send(ok(plans));
  });

  // POST /succession/plans
  app.post('/succession/plans', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = planSchema.parse(req.body);
    const plan = await app.prisma.successionPlan.create({
      data: { organizationId: req.user.orgId, ...input },
    });
    return reply.status(201).send(ok(plan));
  });

  // PATCH /succession/plans/:id
  app.patch('/succession/plans/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = planSchema.partial().parse(req.body);
    await app.prisma.successionPlan.updateMany({ where: { id, organizationId: req.user.orgId }, data: input });
    return reply.send(ok({ id }));
  });

  // DELETE /succession/plans/:id
  app.delete('/succession/plans/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.successionPlan.deleteMany({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok(null));
  });

  // POST /succession/plans/:id/nominees
  app.post('/succession/plans/:id/nominees', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = nomineeSchema.parse(req.body);

    const plan = await app.prisma.successionPlan.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!plan) throw fail('Plan not found', 404);

    const nominee = await app.prisma.successorNomination.upsert({
      where: { planId_employeeId: { planId: id, employeeId: input.employeeId } },
      create: { planId: id, employeeId: input.employeeId, readiness: input.readiness, notes: input.notes },
      update: { readiness: input.readiness, notes: input.notes },
      include: { employee: { select: empSelect } },
    });
    return reply.send(ok(nominee));
  });

  // PATCH /succession/plans/:id/nominees/:employeeId — update readiness
  app.patch('/succession/plans/:id/nominees/:employeeId', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id, employeeId } = req.params as { id: string; employeeId: string };
    const { readiness, notes } = nomineeSchema.parse(req.body);
    await app.prisma.successorNomination.update({
      where: { planId_employeeId: { planId: id, employeeId } },
      data: { readiness, notes },
    });
    return reply.send(ok({ planId: id, employeeId, readiness }));
  });

  // DELETE /succession/plans/:id/nominees/:employeeId
  app.delete('/succession/plans/:id/nominees/:employeeId', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id, employeeId } = req.params as { id: string; employeeId: string };
    await app.prisma.successorNomination.deleteMany({
      where: { planId: id, employeeId },
    });
    return reply.send(ok(null));
  });
}
