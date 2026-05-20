import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const contractorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  pan: z.string().optional(),
  gstNumber: z.string().optional(),
  contractType: z.enum(['INDIVIDUAL', 'AGENCY', 'FREELANCER']).optional(),
  skills: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dailyRate: z.number().positive().optional(),
  currency: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED']).optional(),
  documents: z.any().optional(),
});

const poSchema = z.object({
  poNumber: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  invoiceUrl: z.string().optional(),
});

export async function contractorsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/contractors', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const q = req.query as any;
    const data = await app.prisma.contractor.findMany({
      where: { organizationId: req.user.orgId, ...(q.status ? { status: q.status } : {}) },
      include: { _count: { select: { pos: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.post('/contractors', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = contractorSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const contractor = await app.prisma.contractor.create({
      data: {
        organizationId: req.user.orgId,
        ...body.data,
        skills: body.data.skills ?? [],
        startDate: body.data.startDate ? new Date(body.data.startDate) : undefined,
        endDate: body.data.endDate ? new Date(body.data.endDate) : undefined,
      },
    });
    return reply.status(201).send(ok(contractor));
  });

  app.get('/contractors/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { id } = req.params as any;
    const data = await app.prisma.contractor.findFirst({ where: { id, organizationId: req.user.orgId }, include: { pos: true } });
    if (!data) throw fail('Not found', 404);
    return reply.send(ok(data));
  });

  app.patch('/contractors/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = contractorSchema.partial().safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const data = await app.prisma.contractor.update({
      where: { id, organizationId: req.user.orgId },
      data: {
        ...body.data,
        startDate: body.data.startDate ? new Date(body.data.startDate) : undefined,
        endDate: body.data.endDate ? new Date(body.data.endDate) : undefined,
      },
    });
    return reply.send(ok(data));
  });

  app.post('/contractors/:id/pos', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = poSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const po = await app.prisma.purchaseOrder.create({
      data: {
        contractorId: id,
        ...body.data,
        startDate: body.data.startDate ? new Date(body.data.startDate) : undefined,
        endDate: body.data.endDate ? new Date(body.data.endDate) : undefined,
      },
    });
    return reply.status(201).send(ok(po));
  });

  app.patch('/contractors/pos/:poId', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { poId } = req.params as any;
    const body = poSchema.partial().safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const po = await app.prisma.purchaseOrder.update({ where: { id: poId }, data: body.data });
    return reply.send(ok(po));
  });
}
