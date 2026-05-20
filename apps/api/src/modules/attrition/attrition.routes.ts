import type { FastifyInstance } from 'fastify';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

function computeRiskScore(tenureMonths: number, leaves: number, absences: number, hasRevision: boolean) {
  let score = 0;
  const factors: Record<string, boolean> = {};
  if (tenureMonths < 12) { score += 20; factors.shortTenure = true; }
  else if (tenureMonths > 120) { score += 10; factors.longTenureRisk = true; }
  if (leaves > 15) { score += 25; factors.highLeaveUsage = true; }
  else if (leaves > 10) { score += 10; factors.moderateLeaveUsage = true; }
  if (absences > 5) { score += 20; factors.frequentAbsences = true; }
  else if (absences > 2) { score += 10; factors.someAbsences = true; }
  if (!hasRevision) { score += 15; factors.noRecentRevision = true; }
  const capped = Math.min(score, 100);
  const level = capped >= 60 ? 'CRITICAL' : capped >= 40 ? 'HIGH' : capped >= 20 ? 'MEDIUM' : 'LOW';
  return { score: capped, level, factors };
}

export async function attritionRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post('/attrition/compute', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const orgId = req.user.orgId;
    const employees = await app.prisma.employee.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      select: { id: true, dateOfJoining: true },
    });
    const now = new Date();
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    let computed = 0;
    for (const emp of employees) {
      const tenureMonths = emp.dateOfJoining
        ? Math.floor((now.getTime() - new Date(emp.dateOfJoining).getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 0;
      const [leaves, absences, revision] = await Promise.all([
        app.prisma.leaveRequest.count({ where: { employeeId: emp.id, status: 'APPROVED', createdAt: { gte: yearAgo } } }),
        app.prisma.attendanceRecord.count({ where: { employeeId: emp.id, status: 'ABSENT', date: { gte: yearAgo } } }),
        app.prisma.salaryRevisionProposal.findFirst({ where: { employeeId: emp.id, status: 'APPROVED', createdAt: { gte: yearAgo } } }),
      ]);
      const { score, level, factors } = computeRiskScore(tenureMonths, leaves, absences, !!revision);
      await app.prisma.attritionScore.upsert({
        where: { employeeId: emp.id },
        update: { riskScore: score, riskLevel: level, factors, computedAt: now },
        create: { organizationId: orgId, employeeId: emp.id, riskScore: score, riskLevel: level, factors },
      });
      computed++;
    }
    return reply.send(ok({ computed }));
  });

  app.get('/attrition', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const q = req.query as any;
    const data = await app.prisma.attritionScore.findMany({
      where: { organizationId: req.user.orgId, ...(q.level ? { riskLevel: q.level } : {}) },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true, designation: true, department: { select: { name: true } } } },
      },
      orderBy: { riskScore: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.get('/attrition/mine', auth, async (req, reply) => {
    const data = await app.prisma.attritionScore.findUnique({ where: { employeeId: req.user.sub } });
    return reply.send(ok(data));
  });
}
