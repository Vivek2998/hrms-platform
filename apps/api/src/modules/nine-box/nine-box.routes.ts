import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;

const upsertSchema = z.object({
  employeeId: z.string().uuid(),
  performance: z.number().int().min(1).max(3),
  potential: z.number().int().min(1).max(3),
  cycleId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const PERF_LABELS = ['', 'Low Performer', 'Meets Expectations', 'High Performer'];
const POT_LABELS = ['', 'Limited Potential', 'Growth Potential', 'High Potential'];
const BOX_LABELS: Record<string, string> = {
  '1-1': 'Underperformer', '2-1': 'Core Player', '3-1': 'Highly Valued',
  '1-2': 'Inconsistent Player', '2-2': 'Core Player', '3-2': 'High Professional',
  '1-3': 'Enigma', '2-3': 'Future Star', '3-3': 'Star',
};

const empSelect = {
  id: true, firstName: true, lastName: true, employeeCode: true,
  designation: true, avatarUrl: true,
  department: { select: { name: true } },
};

export async function nineBoxRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /nine-box — all assessments with grid metadata
  app.get('/nine-box', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { cycleId } = z.object({ cycleId: z.string().uuid().optional() }).parse(req.query);

    const assessments = await app.prisma.nineBoxAssessment.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(cycleId ? { cycleId } : {}),
      },
      include: {
        employee: { select: empSelect },
        assessedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = assessments.map((a) => ({
      ...a,
      performanceLabel: PERF_LABELS[a.performance],
      potentialLabel: POT_LABELS[a.potential],
      boxLabel: BOX_LABELS[`${a.performance}-${a.potential}`] ?? 'Unknown',
    }));

    // Build 3×3 grid structure
    const grid: Record<string, typeof enriched> = {};
    for (let p = 1; p <= 3; p++) {
      for (let pot = 1; pot <= 3; pot++) {
        grid[`${p}-${pot}`] = enriched.filter((a) => a.performance === p && a.potential === pot);
      }
    }

    return reply.send(ok({ assessments: enriched, grid }));
  });

  // POST /nine-box — upsert an assessment
  app.post('/nine-box', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = upsertSchema.parse(req.body);

    const assessment = await app.prisma.nineBoxAssessment.upsert({
      where: {
        organizationId_cycleId_employeeId: {
          organizationId: req.user.orgId,
          cycleId: input.cycleId ?? null,
          employeeId: input.employeeId,
        },
      },
      create: {
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        assessedById: req.user.sub,
        cycleId: input.cycleId,
        performance: input.performance,
        potential: input.potential,
        notes: input.notes,
      },
      update: {
        performance: input.performance,
        potential: input.potential,
        notes: input.notes,
        assessedById: req.user.sub,
      },
      include: { employee: { select: empSelect } },
    });
    return reply.send(ok(assessment));
  });
}
