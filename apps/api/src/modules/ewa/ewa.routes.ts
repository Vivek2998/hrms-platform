import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const createSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().optional(),
});

const actionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'DISBURSED']),
  rejectedReason: z.string().optional(),
  repaymentDate: z.string().optional(),
});

export async function ewaRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post('/ewa', auth, async (req, reply) => {
    const body = createSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const request = await app.prisma.ewaRequest.create({
      data: { organizationId: req.user.orgId, employeeId: req.user.sub, ...body.data },
    });
    return reply.status(201).send(ok(request));
  });

  app.get('/ewa/mine', auth, async (req, reply) => {
    const data = await app.prisma.ewaRequest.findMany({
      where: { organizationId: req.user.orgId, employeeId: req.user.sub },
      orderBy: { requestedAt: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.get('/ewa', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const q = req.query as any;
    const data = await app.prisma.ewaRequest.findMany({
      where: { organizationId: req.user.orgId, ...(q.status ? { status: q.status } : {}) },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true, designation: true } } },
      orderBy: { requestedAt: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.patch('/ewa/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = actionSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const updated = await app.prisma.ewaRequest.update({
      where: { id, organizationId: req.user.orgId },
      data: {
        status: body.data.status,
        rejectedReason: body.data.rejectedReason,
        repaymentDate: body.data.repaymentDate ? new Date(body.data.repaymentDate) : undefined,
        processedAt: new Date(),
      },
    });
    return reply.send(ok(updated));
  });
}
