import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';
import type { Prisma } from '@prisma/client';

const createDeptSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).toUpperCase(),
  description: z.string().optional(),
  headId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

export function departmentRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/departments', auth, async (req, reply) => {
    const query = paginationSchema.parse(req.query);
    const where: Prisma.DepartmentWhereInput = {
      organizationId: req.user.orgId,
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [departments, total] = await app.prisma.$transaction([
      app.prisma.department.findMany({
        where,
        include: { _count: { select: { employees: true } } },
        ...paginationArgs(query),
        orderBy: { name: 'asc' },
      }),
      app.prisma.department.count({ where }),
    ]);
    return reply.send(paginated(departments, query.page, query.limit, total));
  });

  app.get('/departments/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const dept = await app.prisma.department.findFirst({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
      include: { teams: true, _count: { select: { employees: true } } },
    });
    if (!dept) throw fail('Department not found', 404);
    return reply.send(ok(dept));
  });

  app.post('/departments', auth, async (req, reply) => {
    const input = createDeptSchema.parse(req.body);
    const dept = await app.prisma.department.create({
      data: { ...input, organizationId: req.user.orgId },
    });
    return reply.status(201).send(ok(dept));
  });

  app.patch('/departments/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = createDeptSchema.partial().parse(req.body);
    const dept = await app.prisma.department.updateMany({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
      data: input,
    });
    if (dept.count === 0) throw fail('Department not found', 404);
    return reply.send(ok({ message: 'Updated' }));
  });

  app.delete('/departments/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.department.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { deletedAt: new Date(), isActive: false },
    });
    return reply.status(204).send();
  });
}
