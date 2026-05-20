import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const designationSchema = z.object({
  name: z.string().min(2),
  level: z.number().int().min(1).max(20),
  department: z.string().optional(),
  description: z.string().optional(),
  skills: z.array(z.string()).default([]),
});

const pathSchema = z.object({
  fromDesignationId: z.string().uuid(),
  toDesignationId: z.string().uuid(),
  typicalYears: z.number().int().positive().optional(),
  skillsRequired: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function careerRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /designations
  app.get('/designations', auth, async (req, reply) => {
    const designations = await app.prisma.designation.findMany({
      where: { organizationId: req.user.orgId },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
    return reply.send(ok(designations));
  });

  // POST /designations — HR creates
  app.post('/designations', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = designationSchema.parse(req.body);
    const d = await app.prisma.designation.create({
      data: { organizationId: req.user.orgId, ...input },
    });
    return reply.status(201).send(ok(d));
  });

  // PATCH /designations/:id
  app.patch('/designations/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = designationSchema.partial().parse(req.body);
    await app.prisma.designation.updateMany({ where: { id, organizationId: req.user.orgId }, data: input });
    return reply.send(ok({ id }));
  });

  // DELETE /designations/:id
  app.delete('/designations/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.designation.deleteMany({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok(null));
  });

  // GET /career-paths
  app.get('/career-paths', auth, async (req, reply) => {
    const paths = await app.prisma.careerPath.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        fromDesignation: true,
        toDesignation: true,
      },
      orderBy: [{ fromDesignation: { level: 'asc' } }],
    });
    return reply.send(ok(paths));
  });

  // GET /career-paths/from/:designationId — paths from a specific designation
  app.get('/career-paths/from/:designationId', auth, async (req, reply) => {
    const { designationId } = req.params as { designationId: string };
    const paths = await app.prisma.careerPath.findMany({
      where: { organizationId: req.user.orgId, fromDesignationId: designationId },
      include: { toDesignation: true },
    });
    return reply.send(ok(paths));
  });

  // POST /career-paths
  app.post('/career-paths', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = pathSchema.parse(req.body);
    const path = await app.prisma.careerPath.create({
      data: { organizationId: req.user.orgId, ...input },
      include: { fromDesignation: true, toDesignation: true },
    });
    return reply.status(201).send(ok(path));
  });

  // DELETE /career-paths/:id
  app.delete('/career-paths/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.careerPath.deleteMany({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok(null));
  });
}
