import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(10),
  category: z
    .enum(['GENERAL', 'PAYROLL', 'ATTENDANCE', 'LEAVE', 'IT', 'HR', 'OTHER'])
    .default('GENERAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  assignedTo: z.string().optional(),
});

const addCommentSchema = z.object({
  body: z.string().min(1),
  isInternal: z.boolean().optional().default(false),
});

const STAFF_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;

export function helpDeskRoutes(app: FastifyInstance) {
  // POST /helpdesk/tickets
  app.post('/helpdesk/tickets', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, sub: employeeId } = req.user;
    const input = createTicketSchema.parse(req.body);
    const ticket = await app.prisma.helpDeskTicket.create({
      data: { organizationId: orgId, employeeId, ...input },
    });
    return reply.status(201).send(ok(ticket));
  });

  // GET /helpdesk/tickets — HR/Manager sees all, employee sees own
  app.get('/helpdesk/tickets', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const isStaff = (STAFF_ROLES as readonly string[]).includes(role);
    const qs = req.query as { status?: string };

    const tickets = await app.prisma.helpDeskTicket.findMany({
      where: {
        organizationId: orgId,
        ...(isStaff ? {} : { employeeId: userId }),
        ...(qs.status ? { status: qs.status as 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' } : {}),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, avatarUrl: true, designation: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.status(200).send(ok(tickets));
  });

  // GET /helpdesk/tickets/:id — with comments
  app.get('/helpdesk/tickets/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const { id } = req.params as { id: string };
    const isStaff = (STAFF_ROLES as readonly string[]).includes(role);

    const ticket = await app.prisma.helpDeskTicket.findFirst({
      where: {
        id,
        organizationId: orgId,
        ...(isStaff ? {} : { employeeId: userId }),
      },
      include: {
        employee: { select: { firstName: true, lastName: true, avatarUrl: true } },
        comments: {
          where: isStaff ? {} : { isInternal: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!ticket) throw fail('Ticket not found', 404);
    return reply.status(200).send(ok(ticket));
  });

  // PATCH /helpdesk/tickets/:id — update status (staff only)
  app.patch('/helpdesk/tickets/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, role } = req.user;
    if (!(STAFF_ROLES as readonly string[]).includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const { id } = req.params as { id: string };
    const input = updateStatusSchema.parse(req.body);
    const now = new Date();
    const ticket = await app.prisma.helpDeskTicket.update({
      where: { id, organizationId: orgId },
      data: {
        ...input,
        ...(input.status === 'RESOLVED' ? { resolvedAt: now } : {}),
        ...(input.status === 'CLOSED' ? { closedAt: now } : {}),
      },
    });
    return reply.status(200).send(ok(ticket));
  });

  // POST /helpdesk/tickets/:id/comments
  app.post(
    '/helpdesk/tickets/:id/comments',
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const { orgId, sub: authorId, role } = req.user;
      const { id } = req.params as { id: string };
      const isStaff = (STAFF_ROLES as readonly string[]).includes(role);
      const input = addCommentSchema.parse(req.body);

      const exists = await app.prisma.helpDeskTicket.findFirst({
        where: { id, organizationId: orgId, ...(isStaff ? {} : { employeeId: authorId }) },
        select: { id: true },
      });
      if (!exists) throw fail('Ticket not found', 404);

      const comment = await app.prisma.helpDeskTicketComment.create({
        data: {
          ticketId: id,
          authorId,
          body: input.body,
          isInternal: isStaff && (input.isInternal ?? false),
        },
      });
      return reply.status(201).send(ok(comment));
    },
  );
}
