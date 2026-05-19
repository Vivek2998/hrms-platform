import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const approverRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const createSchema = z.object({
  targetId: z.string().uuid(),
  requesterDate: z.string(),
  targetDate: z.string(),
  reason: z.string().optional(),
});

const rejectSchema = z.object({ reason: z.string().optional() });

export async function shiftSwapRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /shift-swaps
  app.get('/shift-swaps', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { role } = req.user;
    const isApprover = approverRoles.includes(role);

    const swaps = await app.prisma.shiftSwapRequest.findMany({
      where: {
        organizationId,
        ...(!isApprover ? {
          OR: [{ requesterId: employeeId }, { targetId: employeeId }],
        } : {}),
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        target: { select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(swaps));
  });

  // POST /shift-swaps — requester creates swap request
  app.post('/shift-swaps', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const body = createSchema.parse(req.body);

    if (body.targetId === employeeId) throw fail('Cannot swap with yourself', 400);

    const swap = await app.prisma.shiftSwapRequest.create({
      data: {
        organizationId,
        requesterId: employeeId,
        targetId: body.targetId,
        requesterDate: new Date(body.requesterDate),
        targetDate: new Date(body.targetDate),
        reason: body.reason,
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true } },
        target: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return reply.status(201).send(ok(swap));
  });

  // PATCH /shift-swaps/:id/accept — target employee accepts
  app.patch('/shift-swaps/:id/accept', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { id } = req.params as any;

    const existing = await app.prisma.shiftSwapRequest.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.targetId !== employeeId) throw fail('Forbidden', 403);
    if (existing.status !== 'PENDING_ACCEPTANCE') throw fail('Not awaiting acceptance', 409);

    await app.prisma.shiftSwapRequest.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL', targetAcceptedAt: new Date() },
    });
    return reply.send(ok({ id }));
  });

  // PATCH /shift-swaps/:id/approve — manager/HR approves
  app.patch('/shift-swaps/:id/approve', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { role } = req.user;
    if (!approverRoles.includes(role)) throw fail('Forbidden', 403);

    const { id } = req.params as any;
    const existing = await app.prisma.shiftSwapRequest.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'PENDING_APPROVAL') throw fail('Not pending approval', 409);

    await app.prisma.shiftSwapRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: employeeId, approvedAt: new Date() },
    });
    return reply.send(ok({ id }));
  });

  // PATCH /shift-swaps/:id/reject — manager/HR or target employee rejects
  app.patch('/shift-swaps/:id/reject', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { role } = req.user;
    const { id } = req.params as any;
    const { reason } = rejectSchema.parse(req.body ?? {});

    const existing = await app.prisma.shiftSwapRequest.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);

    const canReject =
      approverRoles.includes(role) ||
      existing.targetId === employeeId ||
      existing.requesterId === employeeId;
    if (!canReject) throw fail('Forbidden', 403);

    await app.prisma.shiftSwapRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
    return reply.send(ok({ id }));
  });

  // DELETE /shift-swaps/:id — requester cancels PENDING_ACCEPTANCE request
  app.delete('/shift-swaps/:id', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { id } = req.params as any;

    const existing = await app.prisma.shiftSwapRequest.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.requesterId !== employeeId) throw fail('Forbidden', 403);
    if (existing.status !== 'PENDING_ACCEPTANCE') throw fail('Cannot cancel at this stage', 409);

    await app.prisma.shiftSwapRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
    return reply.send(ok({ id }));
  });
}
