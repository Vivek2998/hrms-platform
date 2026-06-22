import type { FastifyInstance } from 'fastify';
import { ok } from '../../lib/response.js';

// ─── Quote category resolution ────────────────────────────────────────────────

type QuoteCategory =
  | 'pip' | 'chief' | 'intern' | 'hr' | 'manager'
  | 'engineering' | 'sales' | 'finance' | 'marketing'
  | 'operations' | 'customer' | 'legal' | 'default';

function resolveQuoteCategory(params: {
  designation: string | null;
  departmentName: string | null;
  employmentType: string;
  role: string;
  hasPip: boolean;
}): QuoteCategory {
  const { designation, departmentName, employmentType, role, hasPip } = params;
  const des = (designation ?? '').toLowerCase();
  const dept = (departmentName ?? '').toLowerCase();

  if (hasPip) return 'pip';

  const chiefKeys = ['ceo', 'cto', 'cfo', 'coo', 'cxo', 'chief ', 'president', 'vice president', 'vp ', ' vp', ' vp,', 'director', 'head of'];
  if (chiefKeys.some((k) => des.includes(k))) return 'chief';

  const internKeys = ['intern', 'trainee', 'apprentice', 'graduate trainee', 'fresher'];
  if (employmentType === 'INTERN' || internKeys.some((k) => des.includes(k))) return 'intern';

  if (role === 'HR' || ['human resource', ' hr', 'hr ', 'people ops', 'talent'].some((k) => dept.includes(k))) return 'hr';

  const managerKeys = ['manager', 'team lead', 'team leader', 'supervisor', 'principal', 'scrum master'];
  if (role === 'MANAGER' || managerKeys.some((k) => des.includes(k))) return 'manager';

  if (['engineering', 'software', 'tech', ' it', 'it ', 'development', 'devops', 'data', 'product', 'qa', 'quality', 'infrastructure'].some((k) => dept.includes(k))) return 'engineering';
  if (['sales', 'business development', 'revenue', 'pre-sales', 'presales', 'inside sales'].some((k) => dept.includes(k))) return 'sales';
  if (['finance', 'accounts', 'accounting', 'payroll', 'treasury', 'tax', 'audit', 'controller'].some((k) => dept.includes(k))) return 'finance';
  if (['marketing', 'brand', 'growth', 'content', 'digital', 'communications', ' pr', 'pr '].some((k) => dept.includes(k))) return 'marketing';
  if (['operations', 'logistics', 'supply chain', 'procurement', 'admin', 'facilities', 'office'].some((k) => dept.includes(k))) return 'operations';
  if (['customer', 'support', 'service', 'cx ', 'client success', 'helpdesk', 'success'].some((k) => dept.includes(k))) return 'customer';
  if (['legal', 'compliance', 'risk', 'governance', 'secretarial'].some((k) => dept.includes(k))) return 'legal';

  return 'default';
}

// ─── Routes ───────────────────────────────────────────────────────────────────

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
    // BUG-M03: Use raw SQL to filter by month+day in DB instead of loading
    // all employees and filtering in Node.js (was O(N) memory per request).
    const upcomingDays: Array<{ month: number; day: number; daysUntil: number }> = [];
    for (let offset = 0; offset <= 6; offset++) {
      const d = new Date(Date.UTC(todayYear, todayMonth, todayDay + offset));
      upcomingDays.push({ month: d.getUTCMonth() + 1, day: d.getUTCDate(), daysUntil: offset });
    }

    const caseExpr = upcomingDays
      .map((d) => `WHEN EXTRACT(MONTH FROM e."dateOfBirth") = ${d.month} AND EXTRACT(DAY FROM e."dateOfBirth") = ${d.day} THEN ${d.daysUntil}`)
      .join(' ');
    const orExpr = upcomingDays
      .map((d) => `(EXTRACT(MONTH FROM e."dateOfBirth") = ${d.month} AND EXTRACT(DAY FROM e."dateOfBirth") = ${d.day})`)
      .join(' OR ');

    const birthdays = await app.prisma.$queryRawUnsafe<
      Array<{ id: string; firstName: string; lastName: string; designation: string | null; avatarUrl: string | null; dateOfBirth: Date; daysUntil: number }>
    >(`
      SELECT
        e.id, e."firstName", e."lastName", e.designation, e."avatarUrl", e."dateOfBirth",
        CASE ${caseExpr} ELSE 99 END AS "daysUntil"
      FROM employees e
      WHERE e."organizationId" = $1
        AND e."deletedAt" IS NULL
        AND e.status = 'ACTIVE'
        AND e."dateOfBirth" IS NOT NULL
        AND (${orExpr})
      ORDER BY "daysUntil" ASC
    `, orgId);

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
    // Use raw SQL with EXTRACT so the DB filters — avoids loading every active
    // employee into Node.js memory just to match today's month+day.
    const workAnniversaries = await app.prisma.$queryRawUnsafe<
      Array<{ id: string; firstName: string; lastName: string; designation: string | null; avatarUrl: string | null; dateOfJoining: Date; years: number }>
    >(`
      SELECT
        e.id,
        e."firstName",
        e."lastName",
        e.designation,
        e."avatarUrl",
        e."dateOfJoining",
        (${todayYear} - EXTRACT(YEAR FROM e."dateOfJoining"))::int AS years
      FROM employees e
      WHERE e."organizationId" = $1
        AND e."deletedAt" IS NULL
        AND e.status = 'ACTIVE'
        AND e."dateOfJoining" IS NOT NULL
        AND EXTRACT(MONTH FROM e."dateOfJoining") = ${todayMonth + 1}
        AND EXTRACT(DAY   FROM e."dateOfJoining") = ${todayDay}
        AND EXTRACT(YEAR  FROM e."dateOfJoining") < ${todayYear}
      ORDER BY years DESC
    `, orgId);

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

    // ── Quote category for the current employee ─────────────────
    const emp = await app.prisma.employee.findUnique({
      where: { id: userId },
      select: {
        designation: true,
        employmentType: true,
        department: { select: { name: true } },
      },
    });

    const hasPip = emp
      ? (await app.prisma.performanceImprovementPlan.count({
          where: { organizationId: orgId, employeeId: userId, status: { in: ['ACTIVE', 'EXTENDED'] } },
        })) > 0
      : false;

    const quoteCategory: QuoteCategory = emp
      ? resolveQuoteCategory({
          designation: emp.designation ?? null,
          departmentName: emp.department?.name ?? null,
          employmentType: emp.employmentType,
          role,
          hasPip,
        })
      : 'default';

    return reply.send(
      ok({ birthdays, newJoinees, workAnniversaries, myPendingRequests, quoteCategory }),
    );
  });
}
