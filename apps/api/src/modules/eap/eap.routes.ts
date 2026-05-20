import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const resourceSchema = z.object({
  title: z.string().min(2),
  category: z.enum(['COUNSELING', 'FINANCIAL', 'LEGAL', 'WELLNESS', 'CRISIS']),
  description: z.string().optional(),
  providerName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  isAnonymous: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function eapRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/eap', auth, async (req, reply) => {
    const q = req.query as any;
    const data = await app.prisma.eapResource.findMany({
      where: { organizationId: req.user.orgId, isActive: true, ...(q.category ? { category: q.category } : {}) },
      orderBy: { category: 'asc' },
    });
    return reply.send(ok(data));
  });

  app.post('/eap', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = resourceSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const resource = await app.prisma.eapResource.create({ data: { organizationId: req.user.orgId, ...body.data } });
    return reply.status(201).send(ok(resource));
  });

  app.patch('/eap/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = resourceSchema.partial().safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const data = await app.prisma.eapResource.update({ where: { id, organizationId: req.user.orgId }, data: body.data });
    return reply.send(ok(data));
  });

  app.delete('/eap/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { id } = req.params as any;
    await app.prisma.eapResource.delete({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok(null));
  });
}
