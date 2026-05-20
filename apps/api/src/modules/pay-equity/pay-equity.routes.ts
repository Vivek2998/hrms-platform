import type { FastifyInstance } from 'fastify';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

export async function payEquityRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post('/pay-equity/generate', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const orgId = req.user.orgId;

    // Fetch all active employees with gender, department, designation + latest CTC from salary revisions
    const employees = await app.prisma.employee.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      select: {
        id: true, gender: true, designation: true,
        department: { select: { name: true } },
        salaryRevisions: { select: { ctc: true }, orderBy: { effectiveFrom: 'desc' }, take: 1 },
      },
    });

    const byGender: Record<string, { count: number; total: number }> = {};
    const byDept: Record<string, { count: number; total: number }> = {};
    const byDesig: Record<string, { count: number; total: number }> = {};

    for (const e of employees) {
      const ctc = e.salaryRevisions[0]?.ctc ?? 0;
      if (ctc === 0) continue;
      const g = (e.gender as string) || 'NOT_SPECIFIED';
      const d = e.department?.name ?? 'Unknown';
      const des = e.designation ?? 'Unknown';

      if (!byGender[g]) byGender[g] = { count: 0, total: 0 };
      byGender[g].count++; byGender[g].total += ctc;
      if (!byDept[d]) byDept[d] = { count: 0, total: 0 };
      byDept[d].count++; byDept[d].total += ctc;
      if (!byDesig[des]) byDesig[des] = { count: 0, total: 0 };
      byDesig[des].count++; byDesig[des].total += ctc;
    }

    const avg = (g: { count: number; total: number }) => g.count > 0 ? Math.round(g.total / g.count) : 0;
    const maleAvg = avg(byGender['MALE'] ?? { count: 0, total: 0 });
    const femaleAvg = avg(byGender['FEMALE'] ?? { count: 0, total: 0 });
    const genderGapPct = maleAvg > 0 ? Math.round(((maleAvg - femaleAvg) / maleAvg) * 10000) / 100 : 0;

    const reportData = {
      totalEmployees: employees.length,
      genderGapPct,
      byGender: Object.fromEntries(Object.entries(byGender).map(([k, v]) => [k, { count: v.count, avgCTC: avg(v) }])),
      byDepartment: Object.fromEntries(Object.entries(byDept).map(([k, v]) => [k, { count: v.count, avgCTC: avg(v) }])),
      byDesignation: Object.fromEntries(Object.entries(byDesig).map(([k, v]) => [k, { count: v.count, avgCTC: avg(v) }])),
    };

    const snapshot = await app.prisma.payEquitySnapshot.create({
      data: { organizationId: orgId, reportData, generatedBy: req.user.sub },
    });
    return reply.status(201).send(ok(snapshot));
  });

  app.get('/pay-equity', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const data = await app.prisma.payEquitySnapshot.findMany({
      where: { organizationId: req.user.orgId },
      orderBy: { snapshotDate: 'desc' },
      take: 12,
    });
    return reply.send(ok(data));
  });

  app.get('/pay-equity/latest', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const data = await app.prisma.payEquitySnapshot.findFirst({
      where: { organizationId: req.user.orgId },
      orderBy: { snapshotDate: 'desc' },
    });
    return reply.send(ok(data));
  });
}
