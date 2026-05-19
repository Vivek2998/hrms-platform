import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const travelSchema = z.object({
  purpose: z.string().min(3),
  fromCity: z.string().min(1),
  toCity: z.string().min(1),
  departureDate: z.string(),
  returnDate: z.string().optional(),
  travelMode: z.enum(['FLIGHT', 'TRAIN', 'BUS', 'CAR', 'OTHER']).default('FLIGHT'),
  estimatedBudget: z.number().positive().optional(),
  hotelRequired: z.boolean().default(false),
  advanceRequired: z.boolean().default(false),
  advanceAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function travelRoutes(app: FastifyInstance) {
  const approverRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

  // GET /travel
  app.get('/travel', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { organizationId, role, employeeId } = req.user as any;
    const isApprover = approverRoles.includes(role);

    const requests = await app.prisma.travelRequest.findMany({
      where: {
        organizationId,
        ...(!isApprover ? { employeeId } : {}),
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
    return reply.send({ data: requests });
  });

  // POST /travel
  app.post('/travel', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { organizationId, employeeId } = req.user as any;
    const body = travelSchema.parse(req.body);

    const request = await app.prisma.travelRequest.create({
      data: {
        organizationId,
        employeeId,
        ...body,
        departureDate: new Date(body.departureDate),
        returnDate: body.returnDate ? new Date(body.returnDate) : undefined,
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
    });
    return reply.status(201).send({ data: request });
  });

  // PATCH /travel/:id/approve
  app.patch('/travel/:id/approve', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { organizationId, role, employeeId } = req.user as any;
    if (!approverRoles.includes(role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const existing = await app.prisma.travelRequest.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (existing.status !== 'PENDING') return reply.status(409).send({ error: 'Not pending' });

    await app.prisma.travelRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: employeeId, approvedAt: new Date() },
    });
    return reply.send({ id });
  });

  // PATCH /travel/:id/reject
  app.patch('/travel/:id/reject', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { organizationId, role } = req.user as any;
    if (!approverRoles.includes(role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body ?? {});

    const existing = await app.prisma.travelRequest.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (existing.status !== 'PENDING') return reply.status(409).send({ error: 'Not pending' });

    await app.prisma.travelRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
    return reply.send({ id });
  });

  // DELETE /travel/:id  (cancel own PENDING request)
  app.delete('/travel/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { organizationId, employeeId, role } = req.user as any;
    const { id } = req.params as any;
    const isApprover = approverRoles.includes(role);

    const existing = await app.prisma.travelRequest.findFirst({
      where: { id, organizationId },
    });
    if (!existing) return reply.status(404).send({ error: 'Not found' });
    if (!isApprover && existing.employeeId !== employeeId)
      return reply.status(403).send({ error: 'Forbidden' });
    if (existing.status !== 'PENDING')
      return reply.status(409).send({ error: 'Only pending requests can be cancelled' });

    await app.prisma.travelRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return reply.send({ id });
  });
}
