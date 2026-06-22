import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response.js';

const createSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10),
  isAnonymous: z.boolean().optional().default(false),
});

const respondSchema = z.object({
  response: z.string().min(1),
  status: z.enum(['REVIEWED', 'CLOSED']),
});

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

export function suggestionRoutes(app: FastifyInstance) {
  // POST /suggestions
  app.post('/suggestions', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, sub: employeeId } = req.user;
    const input = createSchema.parse(req.body);
    const suggestion = await app.prisma.suggestionBox.create({
      data: { organizationId: orgId, employeeId, ...input },
    });
    return reply.status(201).send(ok(suggestion));
  });

  // GET /suggestions — HR sees all, employee sees own
  app.get('/suggestions', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const isHR = (HR_ROLES as readonly string[]).includes(role);

    const suggestions = await app.prisma.suggestionBox.findMany({
      where: {
        organizationId: orgId,
        ...(isHR ? {} : { employeeId: userId }),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, avatarUrl: true, designation: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // BUG-L04: Mask employeeId AND employee relation for anonymous suggestions.
    // Spreading ...s exposes the employeeId field even when employee relation is nulled.
    const result = suggestions.map((s) => ({
      ...s,
      employeeId: s.isAnonymous ? null : s.employeeId,
      employee: s.isAnonymous ? null : s.employee,
    }));

    return reply.status(200).send(ok(result));
  });

  // PATCH /suggestions/:id/respond — HR only
  app.patch('/suggestions/:id/respond', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, sub: responderId, role } = req.user;
    if (!(HR_ROLES as readonly string[]).includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const { id } = req.params as { id: string };
    const input = respondSchema.parse(req.body);
    const suggestion = await app.prisma.suggestionBox.update({
      where: { id, organizationId: orgId },
      data: { ...input, respondedBy: responderId, respondedAt: new Date() },
    });
    return reply.status(200).send(ok(suggestion));
  });
}
