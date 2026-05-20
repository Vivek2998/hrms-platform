import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const createSchema = z.object({
  respondentName: z.string().min(2),
  incidentDate: z.string(),
  incidentLocation: z.string().optional(),
  description: z.string().min(20),
  isAnonymous: z.boolean().default(false),
});

const statusSchema = z.object({
  status: z.enum(['FILED', 'UNDER_INVESTIGATION', 'HEARING', 'RESOLVED', 'DISMISSED', 'CLOSED']),
  resolution: z.string().optional(),
});

const empSelect = { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true };

export async function poshRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /posh/cases — HR sees all; employee sees own (non-anonymous)
  app.get('/posh/cases', auth, async (req, reply) => {
    const isHR = (HR_ROLES as readonly string[]).includes(req.user.role);
    const cases = await app.prisma.pOSHCase.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(!isHR ? { complainantId: req.user.sub } : {}),
      },
      include: {
        complainant: { select: empSelect },
        _count: { select: { updates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    // Hide complainant info for anonymous cases visible to HR
    const sanitised = cases.map((c) => ({
      ...c,
      complainant: c.isAnonymous && isHR ? null : c.complainant,
    }));
    return reply.send(ok(sanitised));
  });

  // GET /posh/cases/:id
  app.get('/posh/cases/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const isHR = (HR_ROLES as readonly string[]).includes(req.user.role);
    const c = await app.prisma.pOSHCase.findFirst({
      where: {
        id,
        organizationId: req.user.orgId,
        ...(!isHR ? { complainantId: req.user.sub } : {}),
      },
      include: {
        complainant: { select: empSelect },
        updates: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!c) throw fail('Case not found', 404);
    return reply.send(ok({ ...c, complainant: c.isAnonymous && isHR ? null : c.complainant }));
  });

  // POST /posh/cases — any employee can file
  app.post('/posh/cases', auth, async (req, reply) => {
    const input = createSchema.parse(req.body);
    const count = await app.prisma.pOSHCase.count({ where: { organizationId: req.user.orgId } });
    const caseNumber = `POSH-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const c = await app.prisma.pOSHCase.create({
      data: {
        organizationId: req.user.orgId,
        caseNumber,
        complainantId: req.user.sub,
        respondentName: input.respondentName,
        incidentDate: new Date(input.incidentDate),
        incidentLocation: input.incidentLocation,
        description: input.description,
        isAnonymous: input.isAnonymous,
      },
    });
    return reply.status(201).send(ok(c));
  });

  // PATCH /posh/cases/:id/status — HR/ICC updates status
  app.patch('/posh/cases/:id/status', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = statusSchema.parse(req.body);

    const existing = await app.prisma.pOSHCase.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!existing) throw fail('Case not found', 404);

    await app.prisma.pOSHCase.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.resolution ? { resolution: input.resolution } : {}),
        ...(input.status === 'RESOLVED' || input.status === 'CLOSED' ? { resolvedAt: new Date() } : {}),
      },
    });
    return reply.send(ok({ id, status: input.status }));
  });

  // POST /posh/cases/:id/updates — add investigation note
  app.post('/posh/cases/:id/updates', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const { note } = z.object({ note: z.string().min(5) }).parse(req.body);

    const existing = await app.prisma.pOSHCase.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!existing) throw fail('Case not found', 404);

    const update = await app.prisma.pOSHCaseUpdate.create({
      data: { caseId: id, updatedBy: req.user.sub, note },
      include: { updatedByEmp: { select: empSelect } },
    });
    return reply.status(201).send(ok(update));
  });
}
