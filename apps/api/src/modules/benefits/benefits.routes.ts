import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const planSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['HEALTH_INSURANCE', 'LIFE_INSURANCE', 'NPS', 'GYM', 'MEAL_ALLOWANCE', 'TRANSPORT', 'OTHER']),
  description: z.string().optional(),
  maxAmount: z.number().positive().optional(),
  enrollmentDeadline: z.string().optional(),
});

const empSelect = { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true, designation: true };

export async function benefitsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /benefits — list plans with enrollment status for current employee
  app.get('/benefits', auth, async (req, reply) => {
    const plans = await app.prisma.benefitPlan.findMany({
      where: { organizationId: req.user.orgId, isActive: true },
      include: {
        enrollments: {
          where: { employeeId: req.user.sub },
          select: { status: true, amount: true, enrolledAt: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return reply.send(ok(plans.map((p) => ({ ...p, myEnrollment: p.enrollments[0] ?? null }))));
  });

  // GET /benefits/enrollments — HR sees all enrollments
  app.get('/benefits/enrollments', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const enrollments = await app.prisma.benefitEnrollment.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        plan: { select: { id: true, name: true, type: true } },
        employee: { select: empSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(enrollments));
  });

  // POST /benefits — HR creates plan
  app.post('/benefits', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = planSchema.parse(req.body);
    const plan = await app.prisma.benefitPlan.create({
      data: {
        organizationId: req.user.orgId,
        ...input,
        enrollmentDeadline: input.enrollmentDeadline ? new Date(input.enrollmentDeadline) : undefined,
      },
    });
    return reply.status(201).send(ok(plan));
  });

  // PATCH /benefits/:id — HR updates plan
  app.patch('/benefits/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = planSchema.partial().parse(req.body);
    await app.prisma.benefitPlan.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { ...input, enrollmentDeadline: input.enrollmentDeadline ? new Date(input.enrollmentDeadline) : undefined },
    });
    return reply.send(ok({ id }));
  });

  // POST /benefits/:id/enroll — employee enrolls
  app.post('/benefits/:id/enroll', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { amount, details } = z.object({ amount: z.number().optional(), details: z.any().optional() }).parse(req.body);

    const plan = await app.prisma.benefitPlan.findFirst({ where: { id, organizationId: req.user.orgId, isActive: true } });
    if (!plan) throw fail('Plan not found', 404);

    const enrollment = await app.prisma.benefitEnrollment.upsert({
      where: { planId_employeeId: { planId: id, employeeId: req.user.sub } },
      create: {
        organizationId: req.user.orgId,
        planId: id,
        employeeId: req.user.sub,
        status: 'ENROLLED',
        amount,
        details,
        enrolledAt: new Date(),
      },
      update: { status: 'ENROLLED', amount, details, enrolledAt: new Date() },
    });
    return reply.send(ok(enrollment));
  });

  // PATCH /benefits/:id/waive — employee waives enrollment
  app.patch('/benefits/:id/waive', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.benefitEnrollment.upsert({
      where: { planId_employeeId: { planId: id, employeeId: req.user.sub } },
      create: {
        organizationId: req.user.orgId,
        planId: id,
        employeeId: req.user.sub,
        status: 'WAIVED',
      },
      update: { status: 'WAIVED' },
    });
    return reply.send(ok({ waived: true }));
  });
}
