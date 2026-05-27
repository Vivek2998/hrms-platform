import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;
const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;

const empSelect = {
  id: true, firstName: true, lastName: true, employeeCode: true,
  designation: true, avatarUrl: true,
  department: { select: { name: true } },
};

const kraSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().default(true),
});

const kpiSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  unit: z.enum(['PERCENTAGE', 'NUMBER', 'CURRENCY', 'BOOLEAN']).default('NUMBER'),
  targetValue: z.number().optional(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).default('QUARTERLY'),
  isActive: z.boolean().default(true),
});

const assignmentSchema = z.object({
  employeeId: z.string().uuid(),
  kraId: z.string().uuid(),
  period: z.string().min(1),   // e.g. "Q1-2026"
  cycleId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const recordUpdateSchema = z.object({
  actualValue: z.number().optional(),
  targetValue: z.number().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'MISSED', 'PARTIAL']).optional(),
  notes: z.string().optional(),
});

export async function kpiKraRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── KRA CRUD ─────────────────────────────────────────────────

  app.get('/kpi-kra/kras', auth, async (req, reply) => {
    const kras = await app.prisma.kRA.findMany({
      where: { organizationId: req.user.orgId, isActive: true },
      include: {
        kpis: { where: { isActive: true }, orderBy: { createdAt: 'asc' } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(ok(kras));
  });

  app.post('/kpi-kra/kras', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = kraSchema.parse(req.body);
    const kra = await app.prisma.kRA.create({
      data: { organizationId: req.user.orgId, ...input },
    });
    return reply.status(201).send(ok(kra));
  });

  app.patch('/kpi-kra/kras/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = kraSchema.partial().parse(req.body);
    await app.prisma.kRA.updateMany({ where: { id, organizationId: req.user.orgId }, data: input });
    return reply.send(ok({ id }));
  });

  app.delete('/kpi-kra/kras/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    // Soft-delete
    await app.prisma.kRA.updateMany({ where: { id, organizationId: req.user.orgId }, data: { isActive: false } });
    return reply.send(ok(null));
  });

  // ── KPI CRUD (under a KRA) ───────────────────────────────────

  app.post('/kpi-kra/kras/:kraId/kpis', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { kraId } = req.params as { kraId: string };
    const kra = await app.prisma.kRA.findFirst({ where: { id: kraId, organizationId: req.user.orgId } });
    if (!kra) throw fail('KRA not found', 404);
    const input = kpiSchema.parse(req.body);
    const kpi = await app.prisma.kPI.create({
      data: { organizationId: req.user.orgId, kraId, ...input },
    });
    return reply.status(201).send(ok(kpi));
  });

  app.patch('/kpi-kra/kpis/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = kpiSchema.partial().parse(req.body);
    await app.prisma.kPI.updateMany({ where: { id, organizationId: req.user.orgId }, data: input });
    return reply.send(ok({ id }));
  });

  app.delete('/kpi-kra/kpis/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.kPI.updateMany({ where: { id, organizationId: req.user.orgId }, data: { isActive: false } });
    return reply.send(ok(null));
  });

  // ── ASSIGNMENTS ──────────────────────────────────────────────

  // GET /kpi-kra/assignments?employeeId=&period=
  app.get('/kpi-kra/assignments', auth, async (req, reply) => {
    const { employeeId, period } = req.query as { employeeId?: string; period?: string };
    const isHR = (HR_ROLES as readonly string[]).includes(req.user.role);
    const isManager = (MANAGER_ROLES as readonly string[]).includes(req.user.role);

    // Employee sees only their own
    const empFilter = isManager
      ? (employeeId ? { employeeId } : {})
      : { employeeId: req.user.sub };

    const assignments = await app.prisma.employeeKRAAssignment.findMany({
      where: {
        organizationId: req.user.orgId,
        ...empFilter,
        ...(period ? { period } : {}),
      },
      include: {
        employee: { select: empSelect },
        kra: {
          include: { kpis: { where: { isActive: true } } },
        },
        kpiRecords: {
          include: { kpi: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(assignments));
  });

  // POST /kpi-kra/assignments — assign a KRA to an employee (HR / Manager)
  app.post('/kpi-kra/assignments', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = assignmentSchema.parse(req.body);

    const kra = await app.prisma.kRA.findFirst({
      where: { id: input.kraId, organizationId: req.user.orgId },
      include: { kpis: { where: { isActive: true } } },
    });
    if (!kra) throw fail('KRA not found', 404);

    // Create assignment + auto-create KPI records for each KPI in the KRA
    const assignment = await app.prisma.$transaction(async (tx) => {
      const asgn = await tx.employeeKRAAssignment.create({
        data: {
          organizationId: req.user.orgId,
          employeeId: input.employeeId,
          kraId: input.kraId,
          period: input.period,
          cycleId: input.cycleId,
          notes: input.notes,
        },
      });
      // Auto-create a KPI record for each active KPI in this KRA
      if (kra.kpis.length > 0) {
        await tx.employeeKPIRecord.createMany({
          data: kra.kpis.map((kpi) => ({
            organizationId: req.user.orgId,
            assignmentId: asgn.id,
            kpiId: kpi.id,
            targetValue: kpi.targetValue,
          })),
          skipDuplicates: true,
        });
      }
      return asgn;
    });

    const full = await app.prisma.employeeKRAAssignment.findUnique({
      where: { id: assignment.id },
      include: {
        employee: { select: empSelect },
        kra: { include: { kpis: { where: { isActive: true } } } },
        kpiRecords: { include: { kpi: true } },
      },
    });
    return reply.status(201).send(ok(full));
  });

  app.patch('/kpi-kra/assignments/:id', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = z.object({
      status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
      notes: z.string().optional(),
      overallScore: z.number().min(0).max(100).optional(),
    }).parse(req.body);
    await app.prisma.employeeKRAAssignment.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: input,
    });
    return reply.send(ok({ id }));
  });

  app.delete('/kpi-kra/assignments/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.employeeKRAAssignment.deleteMany({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok(null));
  });

  // ── KPI RECORDS (actual values) ──────────────────────────────

  // PATCH /kpi-kra/records/:id — employee or manager updates actual value
  app.patch('/kpi-kra/records/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = recordUpdateSchema.parse(req.body);

    // Find record and verify ownership
    const record = await app.prisma.employeeKPIRecord.findFirst({
      where: { id, organizationId: req.user.orgId },
      include: { assignment: true },
    });
    if (!record) throw fail('Record not found', 404);

    const isManager = (MANAGER_ROLES as readonly string[]).includes(req.user.role);
    const isOwner = record.assignment.employeeId === req.user.sub;
    if (!isManager && !isOwner) throw fail('Forbidden', 403);

    // Compute achievement %
    let achievementPct = record.achievementPct;
    const target = input.targetValue ?? record.targetValue;
    const actual = input.actualValue !== undefined ? input.actualValue : record.actualValue;
    if (target && target > 0 && actual !== null && actual !== undefined) {
      achievementPct = Math.round((actual / target) * 100);
    }

    await app.prisma.employeeKPIRecord.update({
      where: { id },
      data: {
        ...input,
        achievementPct,
        recordedAt: new Date(),
      },
    });

    // Recompute overall assignment score as average achievement across all records
    const allRecords = await app.prisma.employeeKPIRecord.findMany({
      where: { assignmentId: record.assignmentId, achievementPct: { not: null } },
    });
    if (allRecords.length > 0) {
      const avg = allRecords.reduce((s, r) => s + (r.achievementPct ?? 0), 0) / allRecords.length;
      await app.prisma.employeeKRAAssignment.update({
        where: { id: record.assignmentId },
        data: { overallScore: Math.round(avg) },
      });
    }

    return reply.send(ok({ id, achievementPct }));
  });

  // GET /kpi-kra/summary — quick stats for dashboard
  app.get('/kpi-kra/summary', auth, async (req, reply) => {
    const orgId = req.user.orgId;
    const isManager = (MANAGER_ROLES as readonly string[]).includes(req.user.role);
    const empFilter = isManager ? {} : { employeeId: req.user.sub };

    const [totalKRAs, totalAssignments, activeAssignments, completedAssignments] =
      await Promise.all([
        app.prisma.kRA.count({ where: { organizationId: orgId, isActive: true } }),
        app.prisma.employeeKRAAssignment.count({ where: { organizationId: orgId, ...empFilter } }),
        app.prisma.employeeKRAAssignment.count({ where: { organizationId: orgId, status: 'ACTIVE', ...empFilter } }),
        app.prisma.employeeKRAAssignment.count({ where: { organizationId: orgId, status: 'COMPLETED', ...empFilter } }),
      ]);

    return reply.send(ok({ totalKRAs, totalAssignments, activeAssignments, completedAssignments }));
  });
}
