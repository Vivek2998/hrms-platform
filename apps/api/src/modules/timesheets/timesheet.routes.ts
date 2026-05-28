import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;

const projectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20).toUpperCase(),
  description: z.string().optional(),
  clientName: z.string().optional(),
  isBillable: z.boolean().default(true),
});

const entrySchema = z.object({
  projectId: z.string().uuid(),
  date: z.string(),
  hours: z.number().min(0.25).max(24),
  description: z.string().optional(),
  isBillable: z.boolean().default(true),
});

const empSelect = { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true };

function weekStart(dateStr: string): Date {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export async function timesheetRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── Projects ─────────────────────────────────────────────────

  app.get('/projects', auth, async (req, reply) => {
    const projects = await app.prisma.project.findMany({
      where: { organizationId: req.user.orgId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return reply.send(ok(projects));
  });

  app.post('/projects', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = projectSchema.parse(req.body);
    const project = await app.prisma.project.create({
      data: { organizationId: req.user.orgId, ...input },
    });
    return reply.status(201).send(ok(project));
  });

  app.patch('/projects/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = projectSchema.partial().parse(req.body);
    await app.prisma.project.updateMany({ where: { id, organizationId: req.user.orgId }, data: input });
    return reply.send(ok({ id }));
  });

  // ── Timesheet Entries ─────────────────────────────────────────

  app.get('/timesheets', auth, async (req, reply) => {
    const query = z.object({
      employeeId: z.string().uuid().optional(),
      weekStart: z.string().optional(),
      status: z.string().optional(),
    }).parse(req.query);

    const isHR = (HR_ROLES as readonly string[]).includes(req.user.role);
    const entries = await app.prisma.timesheetEntry.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(!isHR ? { employeeId: req.user.sub } : query.employeeId ? { employeeId: query.employeeId } : {}),
        ...(query.weekStart ? { weekStart: new Date(query.weekStart) } : {}),
        ...(query.status ? { status: query.status as any } : {}),
      },
      include: {
        employee: { select: empSelect },
        project: { select: { id: true, name: true, code: true, isBillable: true } },
      },
      orderBy: [{ weekStart: 'desc' }, { date: 'asc' }],
    });
    return reply.send(ok(entries));
  });

  app.post('/timesheets', auth, async (req, reply) => {
    const input = entrySchema.parse(req.body);
    const ws = weekStart(input.date);

    const entry = await app.prisma.timesheetEntry.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        projectId: input.projectId,
        date: new Date(input.date),
        hours: input.hours,
        description: input.description,
        isBillable: input.isBillable,
        weekStart: ws,
      },
      include: { project: { select: { id: true, name: true, code: true } } },
    });
    return reply.status(201).send(ok(entry));
  });

  app.patch('/timesheets/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = entrySchema.partial().parse(req.body);
    const entry = await app.prisma.timesheetEntry.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub, status: 'DRAFT' },
    });
    if (!entry) throw fail('Entry not found or not editable', 404);
    await app.prisma.timesheetEntry.update({ where: { id }, data: input });
    return reply.send(ok({ id }));
  });

  app.delete('/timesheets/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const entry = await app.prisma.timesheetEntry.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub, status: 'DRAFT' },
    });
    if (!entry) throw fail('Entry not found or not deletable', 404);
    await app.prisma.timesheetEntry.delete({ where: { id } });
    return reply.send(ok(null));
  });

  // PUT /timesheets/upsert — create or update entry for an employee+project+date
  // Used by the timesheet grid cell so editing an existing value updates rather than duplicates.
  app.put('/timesheets/upsert', auth, async (req, reply) => {
    const input = entrySchema.parse(req.body);
    const ws = weekStart(input.date);

    const existing = await app.prisma.timesheetEntry.findFirst({
      where: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        projectId: input.projectId,
        date: new Date(input.date),
      },
    });

    if (existing) {
      if (existing.status !== 'DRAFT') throw fail('Entry already submitted, cannot edit', 400);
      const updated = await app.prisma.timesheetEntry.update({
        where: { id: existing.id },
        data: { hours: input.hours, description: input.description, isBillable: input.isBillable },
        include: { project: { select: { id: true, name: true, code: true } } },
      });
      return reply.send(ok(updated));
    }

    const entry = await app.prisma.timesheetEntry.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        projectId: input.projectId,
        date: new Date(input.date),
        hours: input.hours,
        description: input.description,
        isBillable: input.isBillable,
        weekStart: ws,
      },
      include: { project: { select: { id: true, name: true, code: true } } },
    });
    return reply.status(201).send(ok(entry));
  });

  // PATCH /timesheets/approve-week — bulk-approve all SUBMITTED entries for an employee's week
  app.patch('/timesheets/approve-week', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { employeeId, weekStartDate } = z
      .object({ employeeId: z.string().uuid(), weekStartDate: z.string() })
      .parse(req.body);
    const result = await app.prisma.timesheetEntry.updateMany({
      where: {
        organizationId: req.user.orgId,
        employeeId,
        weekStart: new Date(weekStartDate),
        status: 'SUBMITTED',
      },
      data: { status: 'APPROVED', approvedById: req.user.sub, approvedAt: new Date() },
    });
    return reply.send(ok({ approved: result.count }));
  });

  // POST /timesheets/submit-week — submit all DRAFT entries for a week
  app.post('/timesheets/submit-week', auth, async (req, reply) => {
    const { weekStartDate } = z.object({ weekStartDate: z.string() }).parse(req.body);
    const ws = new Date(weekStartDate);
    const result = await app.prisma.timesheetEntry.updateMany({
      where: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        weekStart: ws,
        status: 'DRAFT',
      },
      data: { status: 'SUBMITTED' },
    });
    return reply.send(ok({ submitted: result.count }));
  });

  // PATCH /timesheets/:id/approve
  app.patch('/timesheets/:id/approve', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.timesheetEntry.updateMany({
      where: { id, organizationId: req.user.orgId, status: 'SUBMITTED' },
      data: { status: 'APPROVED', approvedById: req.user.sub, approvedAt: new Date() },
    });
    return reply.send(ok({ id }));
  });

  // PATCH /timesheets/:id/reject
  app.patch('/timesheets/:id/reject', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    await app.prisma.timesheetEntry.updateMany({
      where: { id, organizationId: req.user.orgId, status: 'SUBMITTED' },
      data: { status: 'REJECTED', rejectedReason: reason },
    });
    return reply.send(ok({ id }));
  });
}
