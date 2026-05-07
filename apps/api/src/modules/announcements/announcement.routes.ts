import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';

const createSchema = z.object({
  title:     z.string().min(1).max(200),
  content:   z.string().min(1).max(5000),
  isPinned:  z.boolean().default(false),
  visibleTo: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

const updateSchema = createSchema.partial();

export function announcementRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /announcements  (all authenticated employees — see active announcements for their org)
  app.get('/announcements', auth, async (req, reply) => {
    const query = paginationSchema.parse(req.query);

    const now = new Date();
    const where = {
      organizationId: req.user.orgId,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    };

    const [announcements, total] = await app.prisma.$transaction([
      app.prisma.announcement.findMany({
        where,
        ...paginationArgs(query),
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      app.prisma.announcement.count({ where }),
    ]);

    return reply.send(paginated(announcements, query.page, query.limit, total));
  });

  // POST /announcements  (HR / Admin only)
  app.post('/announcements', auth, async (req, reply) => {
    const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
    if (!allowedRoles.includes(req.user.role)) throw fail('Insufficient permissions', 403);

    const input = createSchema.parse(req.body);

    const announcement = await app.prisma.announcement.create({
      data: {
        organizationId: req.user.orgId,
        authorId:       req.user.sub,
        title:          input.title,
        content:        input.content,
        isPinned:       input.isPinned,
        visibleTo:      input.visibleTo,
        expiresAt:      input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });

    // Broadcast notification to all active employees asynchronously
    void (async () => {
      try {
        const employees = await app.prisma.employee.findMany({
          where: { organizationId: req.user.orgId, deletedAt: null, status: 'ACTIVE' },
          select: { id: true },
        });

        if (employees.length > 0) {
          await app.prisma.notification.createMany({
            data: employees.map((e) => ({
              organizationId: req.user.orgId,
              employeeId:     e.id,
              type:           'ANNOUNCEMENT' as const,
              title:          input.title,
              body:           input.content.slice(0, 200),
            })),
            skipDuplicates: true,
          });
        }
      } catch (err) {
        app.log.error('[announcements] Failed to broadcast notifications:', err);
      }
    })();

    return reply.status(201).send(ok(announcement));
  });

  // PATCH /announcements/:id  (HR / Admin only)
  app.patch('/announcements/:id', auth, async (req, reply) => {
    const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
    if (!allowedRoles.includes(req.user.role)) throw fail('Insufficient permissions', 403);

    const { id } = req.params as { id: string };
    const input = updateSchema.parse(req.body);

    const existing = await app.prisma.announcement.findFirst({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
    });
    if (!existing) throw fail('Announcement not found', 404);

    const updated = await app.prisma.announcement.update({
      where: { id },
      data: {
        ...(input.title     !== undefined && { title:     input.title }),
        ...(input.content   !== undefined && { content:   input.content }),
        ...(input.isPinned  !== undefined && { isPinned:  input.isPinned }),
        ...(input.visibleTo !== undefined && { visibleTo: input.visibleTo }),
        ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }),
      },
    });

    return reply.send(ok(updated));
  });

  // DELETE /announcements/:id  (HR / Admin only — soft delete)
  app.delete('/announcements/:id', auth, async (req, reply) => {
    const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
    if (!allowedRoles.includes(req.user.role)) throw fail('Insufficient permissions', 403);

    const { id } = req.params as { id: string };
    await app.prisma.announcement.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { deletedAt: new Date() },
    });

    return reply.status(204).send();
  });
}
