import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response.js';

const createSchema = z.object({
  toEmployeeId: z.string().uuid(),
  category: z
    .enum([
      'TEAMWORK',
      'INNOVATION',
      'LEADERSHIP',
      'CUSTOMER_FOCUS',
      'GOING_ABOVE_AND_BEYOND',
      'PROBLEM_SOLVING',
      'MENTORSHIP',
      'OTHER',
    ])
    .default('OTHER'),
  message: z.string().min(5).max(500),
  isPublic: z.boolean().default(true),
});

const reactionSchema = z.object({
  emoji: z.string().min(1).max(4),
});

const employeeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  designation: true,
  avatarUrl: true,
  employeeCode: true,
};

export function kudosRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /kudos  — public feed (all employees can see public kudos in org)
  app.get('/kudos', auth, async (req, reply) => {
    const query = z
      .object({
        toEmployeeId: z.string().uuid().optional(),
        fromEmployeeId: z.string().uuid().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
      .parse(req.query);

    const kudos = await app.prisma.kudos.findMany({
      where: {
        organizationId: req.user.orgId,
        isPublic: true,
        ...(query.toEmployeeId && { toEmployeeId: query.toEmployeeId }),
        ...(query.fromEmployeeId && { fromEmployeeId: query.fromEmployeeId }),
        ...(query.cursor && { id: { lt: query.cursor } }),
      },
      include: {
        fromEmployee: { select: employeeSelect },
        toEmployee: { select: employeeSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
    });

    return reply.send(ok(kudos));
  });

  // GET /kudos/my  — kudos received by the logged-in employee
  app.get('/kudos/my', auth, async (req, reply) => {
    const kudos = await app.prisma.kudos.findMany({
      where: { organizationId: req.user.orgId, toEmployeeId: req.user.sub },
      include: {
        fromEmployee: { select: employeeSelect },
        toEmployee: { select: employeeSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return reply.send(ok(kudos));
  });

  // POST /kudos  — give a kudos
  app.post('/kudos', auth, async (req, reply) => {
    const input = createSchema.parse(req.body);

    if (input.toEmployeeId === req.user.sub) {
      return reply.status(400).send({ message: 'Cannot give kudos to yourself' });
    }

    const toEmployee = await app.prisma.employee.findFirst({
      where: { id: input.toEmployeeId, organizationId: req.user.orgId },
    });
    if (!toEmployee) {
      return reply.status(404).send({ message: 'Employee not found' });
    }

    const kudos = await app.prisma.kudos.create({
      data: {
        organizationId: req.user.orgId,
        fromEmployeeId: req.user.sub,
        toEmployeeId: input.toEmployeeId,
        category: input.category,
        message: input.message,
        isPublic: input.isPublic,
      },
      include: {
        fromEmployee: { select: employeeSelect },
        toEmployee: { select: employeeSelect },
      },
    });

    return reply.status(201).send(ok(kudos));
  });

  // PATCH /kudos/:id/react  — toggle emoji reaction
  app.patch('/kudos/:id/react', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { emoji } = reactionSchema.parse(req.body);

    const kudos = await app.prisma.kudos.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!kudos) return reply.status(404).send({ message: 'Not found' });

    const reactions = (kudos.reactions as Record<string, string[]>) ?? {};
    const reactors = reactions[emoji] ?? [];
    const userId = req.user.sub;

    if (reactors.includes(userId)) {
      reactions[emoji] = reactors.filter((r) => r !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...reactors, userId];
    }

    const updated = await app.prisma.kudos.update({
      where: { id },
      data: { reactions },
      include: {
        fromEmployee: { select: employeeSelect },
        toEmployee: { select: employeeSelect },
      },
    });

    return reply.send(ok(updated));
  });

  // DELETE /kudos/:id  — only the sender or HR/Admin can delete
  app.delete('/kudos/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const kudos = await app.prisma.kudos.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!kudos) return reply.status(404).send({ message: 'Not found' });

    const isOwner = kudos.fromEmployeeId === req.user.sub;
    const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return reply.status(403).send({ message: 'Forbidden' });
    }

    await app.prisma.kudos.delete({ where: { id } });
    return reply.send(ok(null));
  });
}
