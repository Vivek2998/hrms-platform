import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const driveSchema = z.object({
  name: z.string().min(2),
  driveType: z.enum(['CAMPUS', 'WALKIN', 'REFERRAL_DRIVE', 'LATERAL']).optional(),
  venue: z.string().optional(),
  driveDate: z.string().optional(),
  targetCount: z.number().int().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  description: z.string().optional(),
});

const candidateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  college: z.string().optional(),
  degree: z.string().optional(),
  cgpa: z.number().optional(),
  status: z.string().optional(),
  resumeUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function hiringDrivesRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/hiring-drives', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const data = await app.prisma.hiringDrive.findMany({
      where: { organizationId: req.user.orgId },
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.post('/hiring-drives', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = driveSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const drive = await app.prisma.hiringDrive.create({
      data: { organizationId: req.user.orgId, ...body.data, driveDate: body.data.driveDate ? new Date(body.data.driveDate) : undefined },
    });
    return reply.status(201).send(ok(drive));
  });

  app.patch('/hiring-drives/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = driveSchema.partial().safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const drive = await app.prisma.hiringDrive.update({
      where: { id, organizationId: req.user.orgId },
      data: { ...body.data, driveDate: body.data.driveDate ? new Date(body.data.driveDate) : undefined },
    });
    return reply.send(ok(drive));
  });

  app.get('/hiring-drives/:id/candidates', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { id } = req.params as any;
    const data = await app.prisma.bulkCandidate.findMany({ where: { driveId: id }, orderBy: { createdAt: 'asc' } });
    return reply.send(ok(data));
  });

  app.post('/hiring-drives/:id/candidates', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = candidateSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const candidate = await app.prisma.bulkCandidate.create({ data: { driveId: id, ...body.data } });
    return reply.status(201).send(ok(candidate));
  });

  app.post('/hiring-drives/:id/candidates/bulk', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = z.object({ candidates: z.array(candidateSchema) }).safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const created = await app.prisma.bulkCandidate.createMany({
      data: body.data.candidates.map((c) => ({ driveId: id, ...c })),
    });
    return reply.status(201).send(ok({ created: created.count }));
  });

  app.patch('/hiring-drives/candidates/:cid', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { cid } = req.params as any;
    const body = candidateSchema.partial().safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const candidate = await app.prisma.bulkCandidate.update({ where: { id: cid }, data: body.data });
    return reply.send(ok(candidate));
  });
}
