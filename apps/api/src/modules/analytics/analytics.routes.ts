import type { FastifyInstance } from 'fastify';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;
type HrRole = (typeof HR_ROLES)[number];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function analyticsRoutes(app: FastifyInstance) {
  const hrAuth = {
    preHandler: [
      app.authenticate,
      async (req: any, reply: any) => {
        if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
      },
    ],
  };

  app.get('/analytics/overview', hrAuth, async (req, reply) => {
    const { orgId } = req.user;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalActive, totalInactive, newThisMonth, termThisMonth] = await Promise.all([
      app.prisma.employee.count({ where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null } }),
      app.prisma.employee.count({ where: { organizationId: orgId, status: { in: ['INACTIVE', 'TERMINATED'] }, deletedAt: null } }),
      app.prisma.employee.count({ where: { organizationId: orgId, deletedAt: null, dateOfJoining: { gte: startOfMonth, lte: endOfMonth } } }),
      app.prisma.employee.count({ where: { organizationId: orgId, deletedAt: null, dateOfTermination: { gte: startOfMonth, lte: endOfMonth } } }),
    ]);

    const attritionRate = totalActive > 0 ? +((termThisMonth / totalActive) * 100).toFixed(1) : 0;
    return reply.send(ok({ totalActive, totalInactive, newThisMonth, termThisMonth, attritionRate }));
  });

  app.get('/analytics/headcount-trend', hrAuth, async (req, reply) => {
    const { orgId } = req.user;
    const now = new Date();
    const result: { month: string; count: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfM = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = await app.prisma.employee.count({
        where: {
          organizationId: orgId,
          deletedAt: null,
          dateOfJoining: { lte: endOfM },
          OR: [{ dateOfTermination: null }, { dateOfTermination: { gte: d } }],
        },
      });
      result.push({ month: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, count });
    }
    return reply.send(ok(result));
  });

  app.get('/analytics/department-breakdown', hrAuth, async (req, reply) => {
    const { orgId } = req.user;
    const departments = await app.prisma.department.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, name: true },
    });
    const result = await Promise.all(
      departments.map(async (dept) => ({
        department: dept.name,
        count: await app.prisma.employee.count({
          where: { organizationId: orgId, departmentId: dept.id, status: 'ACTIVE', deletedAt: null },
        }),
      })),
    );
    const unassigned = await app.prisma.employee.count({
      where: { organizationId: orgId, departmentId: null, status: 'ACTIVE', deletedAt: null },
    });
    if (unassigned > 0) result.push({ department: 'Unassigned', count: unassigned });
    return reply.send(ok(result.filter((r) => r.count > 0)));
  });

  app.get('/analytics/attendance-summary', hrAuth, async (req, reply) => {
    const { orgId } = req.user;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const records = await app.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { organizationId: orgId, date: { gte: since } },
      _count: { status: true },
    });
    return reply.send(ok(records.map((r) => ({ status: r.status, count: r._count.status }))));
  });

  app.get('/analytics/leave-utilization', hrAuth, async (req, reply) => {
    const { orgId } = req.user;
    const year = new Date().getFullYear();
    const balances = await app.prisma.leaveBalance.findMany({
      where: { organizationId: orgId, year },
      include: { leaveType: { select: { name: true, colorHex: true } } },
    });
    const grouped: Record<string, { name: string; color: string; allocated: number; used: number }> = {};
    for (const b of balances) {
      const key = b.leaveTypeId;
      if (!grouped[key]) grouped[key] = { name: b.leaveType.name, color: b.leaveType.colorHex, allocated: 0, used: 0 };
      grouped[key].allocated += b.allocated;
      grouped[key].used += b.used;
    }
    return reply.send(ok(Object.values(grouped)));
  });

  app.get('/analytics/payroll-trend', hrAuth, async (req, reply) => {
    const { orgId } = req.user;
    const runs = await app.prisma.payrollRun.findMany({
      where: { organizationId: orgId, status: { in: ['COMPLETED', 'PAID'] } },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      take: 12,
      select: { month: true, year: true, totalNetPay: true, totalGross: true, totalDeductions: true, totalEmployees: true },
    });
    return reply.send(ok(runs.map((r) => ({
      month: `${MONTH_NAMES[r.month - 1]} ${String(r.year).slice(2)}`,
      netPay: r.totalNetPay,
      gross: r.totalGross,
      deductions: r.totalDeductions,
      employees: r.totalEmployees,
    }))));
  });
}
