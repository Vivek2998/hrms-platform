import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';

const createSchema = z.object({
  workedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reason: z.string().min(3).max(500),
});

const reviewSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

export function compOffRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /comp-offs  (EMPLOYEE sees own; HR/Manager sees all)
  app.get('/comp-offs', auth, async (req, reply) => {
    const query = paginationSchema
      .extend({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional(),
      })
      .parse(req.query);

    const isEmployee = req.user.role === 'EMPLOYEE';
    const where = {
      organizationId: req.user.orgId,
      ...(query.status && { status: query.status }),
      ...(isEmployee && { employeeId: req.user.sub }),
    };

    const [records, total] = await app.prisma.$transaction([
      app.prisma.compOff.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              designation: true,
            },
          },
        },
        ...paginationArgs(query),
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.compOff.count({ where }),
    ]);

    return reply.send(paginated(records, query.page, query.limit, total));
  });

  // POST /comp-offs
  app.post('/comp-offs', auth, async (req, reply) => {
    const input = createSchema.parse(req.body);

    const expiresAt = new Date(input.workedDate + 'T00:00:00.000Z');
    expiresAt.setDate(expiresAt.getDate() + 90);

    const record = await app.prisma.compOff.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        workedDate: new Date(input.workedDate + 'T00:00:00.000Z'),
        ...(input.requestedDate !== undefined && {
          requestedDate: new Date(input.requestedDate + 'T00:00:00.000Z'),
        }),
        reason: input.reason,
        expiresAt,
      },
    });

    return reply.status(201).send(ok(record));
  });

  // PATCH /comp-offs/:id/review  (HR / Manager)
  app.patch('/comp-offs/:id/review', auth, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = reviewSchema.parse(req.body);

    const record = await app.prisma.compOff.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!record) throw fail('Request not found', 404);
    if (record.status !== 'PENDING') throw fail('Only pending requests can be reviewed', 400);

    await app.prisma.compOff.update({
      where: { id },
      data: {
        status: input.action,
        reviewedBy: req.user.sub,
        reviewedAt: new Date(),
        ...(input.remarks !== undefined && { remarks: input.remarks }),
      },
    });

    return reply.send(ok({ message: `Comp off ${input.action.toLowerCase()}` }));
  });
}
