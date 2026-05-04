import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';

const shiftSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).toUpperCase(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm'),
  graceMinutes: z.number().int().min(0).default(0),
  halfDayAfterMinutes: z.number().int().min(0).default(240),
  absentAfterMinutes: z.number().int().min(0).default(480),
  breakDurationMinutes: z.number().int().min(0).default(60),
  isNightShift: z.boolean().default(false),
  weeklyOffDays: z.array(z.number().int().min(0).max(6)).default([0, 6]),
});

const assignShiftSchema = z.object({
  employeeId: z.string().uuid(),
  shiftId: z.string().uuid(),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
});

export function shiftRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/shifts', auth, async (req, reply) => {
    const query = paginationSchema.parse(req.query);
    const where = {
      organizationId: req.user.orgId,
      deletedAt: null,
      isActive: true,
    };
    const [shifts, total] = await app.prisma.$transaction([
      app.prisma.shift.findMany({
        where,
        ...paginationArgs(query),
        orderBy: { name: 'asc' },
      }),
      app.prisma.shift.count({ where }),
    ]);
    return reply.send(paginated(shifts, query.page, query.limit, total));
  });

  app.post('/shifts', auth, async (req, reply) => {
    const input = shiftSchema.parse(req.body);
    const shift = await app.prisma.shift.create({
      data: { ...input, organizationId: req.user.orgId },
    });
    return reply.status(201).send(ok(shift));
  });

  app.patch('/shifts/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = shiftSchema.partial().parse(req.body);
    const result = await app.prisma.shift.updateMany({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
      data: input,
    });
    if (result.count === 0) throw fail('Shift not found', 404);
    return reply.send(ok({ message: 'Updated' }));
  });

  app.delete('/shifts/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.shift.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { deletedAt: new Date(), isActive: false },
    });
    return reply.status(204).send();
  });

  // POST /shifts/assign
  app.post('/shifts/assign', auth, async (req, reply) => {
    const input = assignShiftSchema.parse(req.body);
    const assignment = await app.prisma.shiftAssignment.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        shiftId: input.shiftId,
        effectiveFrom: new Date(input.effectiveFrom),
        effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
      },
    });
    return reply.status(201).send(ok(assignment));
  });
}
