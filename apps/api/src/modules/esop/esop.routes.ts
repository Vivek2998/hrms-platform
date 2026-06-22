import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const grantSchema = z.object({
  employeeId: z.string(),
  grantDate: z.string(),
  options: z.number().int().positive(),
  strikePrice: z.number().positive(),
  currency: z.string().optional(),
  vestingSchedule: z.array(z.object({ date: z.string(), options: z.number().int() })),
  cliffMonths: z.number().int().optional(),
  totalVestMonths: z.number().int().optional(),
  status: z.enum(['ACTIVE', 'VESTED', 'EXERCISED', 'CANCELLED', 'EXPIRED']).optional(),
  notes: z.string().optional(),
});

const exerciseSchema = z.object({
  options: z.number().int().positive(),
  exercisePrice: z.number().positive(),
  notes: z.string().optional(),
});

const empSelect = { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true, designation: true };

export async function esopRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/esop', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const data = await app.prisma.esopGrant.findMany({
      where: { organizationId: req.user.orgId },
      include: { employee: { select: empSelect }, exercises: true },
      orderBy: { grantDate: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.get('/esop/mine', auth, async (req, reply) => {
    const data = await app.prisma.esopGrant.findMany({
      where: { employeeId: req.user.sub },
      include: { exercises: true },
      orderBy: { grantDate: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.post('/esop', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = grantSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const employee = await app.prisma.employee.findFirst({ where: { id: body.data.employeeId, organizationId: req.user.orgId } });
    if (!employee) throw fail('Employee not found', 404);
    const grant = await app.prisma.esopGrant.create({
      data: { organizationId: req.user.orgId, ...body.data, grantDate: new Date(body.data.grantDate) },
      include: { employee: { select: empSelect } },
    });
    return reply.status(201).send(ok(grant));
  });

  app.patch('/esop/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = grantSchema.partial().safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const grant = await app.prisma.esopGrant.update({
      where: { id, organizationId: req.user.orgId },
      data: { ...body.data, grantDate: body.data.grantDate ? new Date(body.data.grantDate) : undefined },
    });
    return reply.send(ok(grant));
  });

  app.post('/esop/:id/exercise', auth, async (req, reply) => {
    const body = exerciseSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const grant = await app.prisma.esopGrant.findFirst({ where: { id, employeeId: req.user.sub } });
    if (!grant) throw fail('Grant not found', 404);
    const exercise = await app.prisma.esopExercise.create({ data: { grantId: id, ...body.data } });
    return reply.status(201).send(ok(exercise));
  });
}
