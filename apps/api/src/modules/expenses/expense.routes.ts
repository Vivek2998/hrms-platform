import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;
type HrRole = (typeof HR_ROLES)[number];

const CATEGORIES = ['TRAVEL', 'FOOD', 'ACCOMMODATION', 'COMMUNICATION', 'TRAINING', 'EQUIPMENT', 'MEDICAL', 'OTHER'] as const;

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(CATEGORIES).default('OTHER'),
  amount: z.number().positive(),
  currency: z.string().length(3).default('INR'),
  receiptUrl: z.string().url().optional(),
  expenseDate: z.string().date(), // YYYY-MM-DD
});

const updateSchema = createSchema.partial();

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reviewNote: z.string().optional(),
});

export function expenseRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // Employee: list own claims
  app.get('/expenses/my', auth, async (req, reply) => {
    const claims = await app.prisma.expenseClaim.findMany({
      where: { employeeId: req.user.sub, employee: { organizationId: req.user.orgId } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(claims));
  });

  // HR: list all claims for org
  app.get('/expenses', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);

    // QUALITY-03: Validate status and employeeId at the boundary to avoid `as any` casts
    const EXPENSE_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'] as const;
    const querySchema = z.object({
      status: z.enum(EXPENSE_STATUSES).optional(),
      employeeId: z.string().uuid().optional(),
    });
    const qs = querySchema.parse(req.query);

    const claims = await app.prisma.expenseClaim.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(qs.status ? { status: qs.status } : {}),
        ...(qs.employeeId ? { employeeId: qs.employeeId } : {}),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(claims));
  });

  // Employee: create claim (draft)
  app.post('/expenses', auth, async (req, reply) => {
    const input = createSchema.parse(req.body);
    const claim = await app.prisma.expenseClaim.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        title: input.title,
        category: input.category as any,
        amount: input.amount,
        currency: input.currency,
        expenseDate: new Date(input.expenseDate),
        ...(input.description ? { description: input.description } : {}),
        ...(input.receiptUrl ? { receiptUrl: input.receiptUrl } : {}),
      },
    });
    return reply.status(201).send(ok(claim));
  });

  // Employee: update draft claim
  app.patch('/expenses/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = updateSchema.parse(req.body);
    const existing = await app.prisma.expenseClaim.findFirst({
      where: { id, employeeId: req.user.sub },
    });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'DRAFT') throw fail('Only DRAFT claims can be edited', 400);
    const updated = await app.prisma.expenseClaim.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category ? { category: input.category as any } : {}),
        ...(input.amount ? { amount: input.amount } : {}),
        ...(input.currency ? { currency: input.currency } : {}),
        ...(input.receiptUrl !== undefined ? { receiptUrl: input.receiptUrl } : {}),
        ...(input.expenseDate ? { expenseDate: new Date(input.expenseDate) } : {}),
      },
    });
    return reply.send(ok(updated));
  });

  // Employee: submit claim
  app.patch('/expenses/:id/submit', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await app.prisma.expenseClaim.findFirst({
      where: { id, employeeId: req.user.sub },
    });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'DRAFT') throw fail('Only DRAFT claims can be submitted', 400);
    const updated = await app.prisma.expenseClaim.update({
      where: { id },
      data: { status: 'SUBMITTED' },
    });
    return reply.send(ok(updated));
  });

  // HR: approve or reject
  app.patch('/expenses/:id/review', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const { action, reviewNote } = reviewSchema.parse(req.body);
    const existing = await app.prisma.expenseClaim.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'SUBMITTED') throw fail('Only SUBMITTED claims can be reviewed', 400);
    const updated = await app.prisma.expenseClaim.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reviewedBy: req.user.sub,
        reviewedAt: new Date(),
        ...(reviewNote ? { reviewNote } : {}),
      },
    });
    return reply.send(ok(updated));
  });

  // HR: mark as paid
  app.patch('/expenses/:id/pay', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const existing = await app.prisma.expenseClaim.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'APPROVED') throw fail('Only APPROVED claims can be marked paid', 400);
    const updated = await app.prisma.expenseClaim.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
    return reply.send(ok(updated));
  });

  // Employee or HR: delete draft
  app.delete('/expenses/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const isHR = HR_ROLES.includes(req.user.role as HrRole);
    const existing = await app.prisma.expenseClaim.findFirst({
      where: {
        id,
        ...(isHR
          ? { organizationId: req.user.orgId }
          : { employeeId: req.user.sub }),
      },
    });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'DRAFT') throw fail('Only DRAFT claims can be deleted', 400);
    await app.prisma.expenseClaim.delete({ where: { id } });
    return reply.status(204).send();
  });
}
