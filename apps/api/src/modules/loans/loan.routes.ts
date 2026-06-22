import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const loanSchema = z.object({
  loanType: z.enum(['PERSONAL_LOAN', 'SALARY_ADVANCE', 'VEHICLE_LOAN', 'HOME_LOAN', 'EDUCATION_LOAN', 'OTHER']),
  amount: z.number().positive(),
  tenure: z.number().int().positive().optional(),
  purpose: z.string().min(3),
  notes: z.string().optional(),
});

export async function loanRoutes(app: FastifyInstance) {
  const approverRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

  // GET /loans
  app.get('/loans', { preHandler: [app.authenticate] }, async (req, reply) => {
    const isApprover = approverRoles.includes(req.user.role);

    const loans = await app.prisma.loanRequest.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(!isApprover ? { employeeId: req.user.sub } : {}),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ data: loans });
  });

  // POST /loans
  app.post('/loans', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = loanSchema.parse(req.body);

    const loan = await app.prisma.loanRequest.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        ...body,
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });
    return reply.status(201).send({ data: loan });
  });

  // PATCH /loans/:id/approve
  app.patch('/loans/:id/approve', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!approverRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const existing = await app.prisma.loanRequest.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (existing.status !== 'PENDING') return reply.status(409).send({ error: 'Not pending' });

    await app.prisma.loanRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: req.user.sub, approvedAt: new Date() },
    });
    return reply.send({ id });
  });

  // PATCH /loans/:id/reject
  app.patch('/loans/:id/reject', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!approverRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body ?? {});

    const existing = await app.prisma.loanRequest.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (existing.status !== 'PENDING') return reply.status(409).send({ error: 'Not pending' });

    await app.prisma.loanRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
    return reply.send({ id });
  });

  // PATCH /loans/:id/disburse
  app.patch('/loans/:id/disburse', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!approverRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const existing = await app.prisma.loanRequest.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (existing.status !== 'APPROVED') return reply.status(409).send({ error: 'Not approved' });

    await app.prisma.loanRequest.update({
      where: { id },
      data: { status: 'DISBURSED', disbursedAt: new Date() },
    });
    return reply.send({ id });
  });

  // PATCH /loans/:id/close
  app.patch('/loans/:id/close', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!approverRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const existing = await app.prisma.loanRequest.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (existing.status !== 'DISBURSED') return reply.status(409).send({ error: 'Not disbursed' });

    await app.prisma.loanRequest.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    return reply.send({ id });
  });

  // DELETE /loans/:id  (cancel own PENDING request)
  app.delete('/loans/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const isApprover = approverRoles.includes(req.user.role);
    const { id } = req.params as any;

    const existing = await app.prisma.loanRequest.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (!isApprover && existing.employeeId !== req.user.sub)
      return reply.status(403).send({ error: 'Forbidden' });
    if (existing.status !== 'PENDING')
      return reply.status(409).send({ error: 'Only pending requests can be cancelled' });

    await app.prisma.loanRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
    return reply.send({ id });
  });
}
