import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';

export function notificationRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /notifications  (current user's notifications)
  app.get('/notifications', auth, async (req, reply) => {
    const query = paginationSchema
      .extend({
        unreadOnly: z
          .string()
          .optional()
          .transform((v) => v === 'true'),
      })
      .parse(req.query);

    const where = {
      organizationId: req.user.orgId,
      employeeId: req.user.sub,
      ...(query.unreadOnly && { isRead: false }),
    };

    const [notifications, total] = await app.prisma.$transaction([
      app.prisma.notification.findMany({
        where,
        ...paginationArgs(query),
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.notification.count({ where }),
    ]);

    return reply.send(paginated(notifications, query.page, query.limit, total));
  });

  // GET /notifications/unread-count
  app.get('/notifications/unread-count', auth, async (req, reply) => {
    const count = await app.prisma.notification.count({
      where: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        isRead: false,
      },
    });
    return reply.send(ok({ count }));
  });

  // PATCH /notifications/:id/read
  app.patch('/notifications/:id/read', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.notification.updateMany({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub },
      data: { isRead: true, readAt: new Date() },
    });
    return reply.send(ok({ message: 'Marked as read' }));
  });

  // PATCH /notifications/read-all
  app.patch('/notifications/read-all', auth, async (req, reply) => {
    await app.prisma.notification.updateMany({
      where: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
    return reply.send(ok({ message: 'All notifications marked as read' }));
  });
}
