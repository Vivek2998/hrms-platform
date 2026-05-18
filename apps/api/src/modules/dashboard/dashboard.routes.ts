import type { FastifyInstance } from 'fastify';
import { ok } from '../../lib/response.js';

export function dashboardRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/dashboard/widgets', auth, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const today = new Date();
    const todayMonth = today.getUTCMonth();
    const todayDay = today.getUTCDate();
    const todayYear = today.getUTCFullYear();
    const thirtyDaysAgo = new Date(Date.UTC(todayYear, todayMonth, todayDay - 30));

    // ── Birthdays: today + next 6 days (7-day window) ──────────
    const empWithDob = await app.prisma.employee.findMany({
      where: { organizationId: orgId, deletedAt: null, status: 'ACTIVE', dateOfBirth: { not: null } },
      select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true, dateOfBirth: true },
    });
    const today00 = new Date(Date.UTC(todayYear, todayMonth, todayDay));
    const msPerDay = 1000 * 60 * 60 * 24;
    const birthdays = empWithDob
      .map((e) => {
        const dob = new Date(e.dateOfBirth!);
        // Build this year's birthday; if it already passed, use next year
        let nextBday = new Date(Date.UTC(todayYear, dob.getUTCMonth(), dob.getUTCDate()));
        if (nextBday < today00) {
          nextBday = new Date(Date.UTC(todayYear + 1, dob.getUTCMonth(), dob.getUTCDate()));
        }
        const daysUntil = Math.round((nextBday.getTime() - today00.getTime()) / msPerDay);
        return { ...e, daysUntil };
      })
      .filter((e) => e.daysUntil <= 6)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // ── New joinees (last 30 days) ──────────────────────────────
    const newJoinees = await app.prisma.employee.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        status: 'ACTIVE',
        dateOfJoining: { gte: thirtyDaysAgo },
      },
      select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true, dateOfJoining: true },
      orderBy: { dateOfJoining: 'desc' },
      take: 10,
    });

    // ── Work anniversaries (today's month + day, year before current) ──
    const empWithJoining = await app.prisma.employee.findMany({
      where: { organizationId: orgId, deletedAt: null, status: 'ACTIVE', dateOfJoining: { not: null } },
      select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true, dateOfJoining: true },
    });
    const workAnniversaries = empWithJoining
      .filter((e) => {
        const d = new Date(e.dateOfJoining!);
        return (
          d.getUTCMonth() === todayMonth &&
          d.getUTCDate() === todayDay &&
          d.getUTCFullYear() < todayYear
        );
      })
      .map((e) => ({
        ...e,
        years: todayYear - new Date(e.dateOfJoining!).getUTCFullYear(),
      }));

    // ── My pending requests (employee self-view) ────────────────
    let myPendingRequests = null;
    if (role === 'EMPLOYEE' || role === 'MANAGER') {
      const [leaves, regularisations, compOffs] = await Promise.all([
        app.prisma.leaveRequest.findMany({
          where: { organizationId: orgId, employeeId: userId, status: { in: ['PENDING', 'APPROVED'] } },
          select: {
            id: true, fromDate: true, toDate: true, totalDays: true,
            status: true, createdAt: true,
            leaveType: { select: { name: true, code: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        app.prisma.attendanceRegularisation.findMany({
          where: { organizationId: orgId, employeeId: userId, status: 'PENDING' },
          select: { id: true, date: true, requestedIn: true, requestedOut: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        app.prisma.compOff.findMany({
          where: { organizationId: orgId, employeeId: userId, status: 'PENDING' },
          select: { id: true, workedDate: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);
      myPendingRequests = { leaves, regularisations, compOffs };
    }

    return reply.send(
      ok({ birthdays, newJoinees, workAnniversaries, myPendingRequests }),
    );
  });
}
