import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const hrRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

const createSchema = z.object({
  jobId: z.string().uuid().optional(),
  candidateName: z.string().min(1),
  candidateEmail: z.string().email(),
  candidatePhone: z.string().optional(),
  position: z.string().min(1),
  message: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'SCREENING', 'HIRED', 'REJECTED']),
  bonusAmount: z.number().positive().optional(),
  bonusPaid: z.boolean().optional(),
  rejectedReason: z.string().optional(),
});

export async function referralRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /referrals
  app.get('/referrals', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { role } = req.user;
    const isHr = hrRoles.includes(role);

    const referrals = await app.prisma.employeeReferral.findMany({
      where: {
        organizationId,
        ...(!isHr ? { referrerId: employeeId } : {}),
      },
      include: {
        referrer: { select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(referrals));
  });

  // POST /referrals — any employee can refer
  app.post('/referrals', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const body = createSchema.parse(req.body);

    const referral = await app.prisma.employeeReferral.create({
      data: { organizationId, referrerId: employeeId, ...body },
      include: {
        referrer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return reply.status(201).send(ok(referral));
  });

  // PATCH /referrals/:id/status — HR updates status
  app.patch('/referrals/:id/status', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const { role } = req.user;
    if (!hrRoles.includes(role)) throw fail('Forbidden', 403);

    const { id } = req.params as any;
    const body = updateStatusSchema.parse(req.body);

    const existing = await app.prisma.employeeReferral.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);

    await app.prisma.employeeReferral.update({
      where: { id },
      data: {
        status: body.status,
        bonusAmount: body.bonusAmount,
        bonusPaid: body.bonusPaid,
        rejectedReason: body.rejectedReason,
        hiredAt: body.status === 'HIRED' ? new Date() : undefined,
      },
    });
    return reply.send(ok({ id }));
  });

  // DELETE /referrals/:id — referrer can delete own SUBMITTED referral
  app.delete('/referrals/:id', auth, async (req, reply) => {
    const organizationId = req.user.orgId;
    const employeeId = req.user.sub;
    const { id } = req.params as any;

    const existing = await app.prisma.employeeReferral.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.referrerId !== employeeId) throw fail('Forbidden', 403);
    if (existing.status !== 'SUBMITTED') throw fail('Cannot delete at this stage', 409);

    await app.prisma.employeeReferral.delete({ where: { id } });
    return reply.send(ok({ id }));
  });
}
