import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const approverRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const createSchema = z.object({
  date: z.string(),
  reason: z.string().optional(),
});

const rejectSchema = z.object({ reason: z.string().optional() });

export async function wfhRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /wfh — employee sees own; approvers see all
  app.get('/wfh', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { role } = req.user;
    const isApprover = approverRoles.includes(role);

    const requests = await app.prisma.wFHRequest.findMany({
      where: {
        organizationId,
        ...(!isApprover ? { employeeId } : {}),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });
    return reply.send(ok(requests));
  });

  // POST /wfh
  app.post('/wfh', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { date, reason } = createSchema.parse(req.body);

    const existing = await app.prisma.wFHRequest.findFirst({
      where: { organizationId, employeeId, date: new Date(date) },
    });
    if (existing) throw fail('WFH request already exists for this date', 409);

    const request = await app.prisma.wFHRequest.create({
      data: { organizationId, employeeId, date: new Date(date), reason },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    });
    return reply.status(201).send(ok(request));
  });

  // PATCH /wfh/:id/approve
  app.patch('/wfh/:id/approve', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { role } = req.user;
    if (!approverRoles.includes(role)) throw fail('Forbidden', 403);

    const { id } = req.params as any;
    const existing = await app.prisma.wFHRequest.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'PENDING') throw fail('Not pending', 409);

    await app.prisma.$transaction([
      app.prisma.wFHRequest.update({
        where: { id },
        data: { status: 'APPROVED', approvedById: employeeId, approvedAt: new Date() },
      }),
      app.prisma.attendanceRecord.upsert({
        where: {
          organizationId_employeeId_date: {
            organizationId,
            employeeId: existing.employeeId,
            date: existing.date,
          },
        },
        update: { status: 'WFH', remarks: 'WFH approved' },
        create: {
          organizationId,
          employeeId: existing.employeeId,
          date: existing.date,
          status: 'WFH',
          remarks: 'WFH approved',
        },
      }),
    ]);
    return reply.send(ok({ id }));
  });

  // PATCH /wfh/:id/reject
  app.patch('/wfh/:id/reject', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const { role } = req.user;
    if (!approverRoles.includes(role)) throw fail('Forbidden', 403);

    const { id } = req.params as any;
    const { reason } = rejectSchema.parse(req.body ?? {});

    const existing = await app.prisma.wFHRequest.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'PENDING') throw fail('Not pending', 409);

    await app.prisma.wFHRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
    return reply.send(ok({ id }));
  });

  // DELETE /wfh/:id — cancel own PENDING request
  app.delete('/wfh/:id', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { id } = req.params as any;

    const existing = await app.prisma.wFHRequest.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.employeeId !== employeeId) throw fail('Forbidden', 403);
    if (existing.status !== 'PENDING') throw fail('Only pending requests can be cancelled', 409);

    await app.prisma.wFHRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
    return reply.send(ok({ id }));
  });
}
