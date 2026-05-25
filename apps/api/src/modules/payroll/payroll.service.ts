import type { PrismaClient } from '@prisma/client';
import { fail } from '../../lib/response.js';
import {
  calculatePF,
  calculateESI,
  calculateProfessionalTax,
  calculateLOP,
} from '@hrms/shared-utils';
import type { IndiaState } from '@hrms/shared-types';

interface PayrollRunInput {
  month: number;
  year: number;
}

export async function initPayrollRun(orgId: string, input: PayrollRunInput, prisma: PrismaClient) {
  const existing = await prisma.payrollRun.findUnique({
    where: {
      organizationId_month_year: {
        organizationId: orgId,
        month: input.month,
        year: input.year,
      },
    },
  });

  if (existing && existing.status !== 'FAILED')
    throw fail(`Payroll for ${String(input.month)}/${String(input.year)} already exists`, 409);

  const run = await prisma.payrollRun.upsert({
    where: {
      organizationId_month_year: {
        organizationId: orgId,
        month: input.month,
        year: input.year,
      },
    },
    update: { status: 'DRAFT' },
    create: {
      organizationId: orgId,
      month: input.month,
      year: input.year,
      status: 'DRAFT',
    },
  });

  return run;
}

export async function processPayrollRun(
  orgId: string,
  payrollRunId: string,
  processedBy: string,
  prisma: PrismaClient,
) {
  const run = await prisma.payrollRun.findFirst({
    where: { id: payrollRunId, organizationId: orgId },
    include: { organization: true },
  });

  if (!run) throw fail('Payroll run not found', 404);
  if (run.status !== 'DRAFT') throw fail('Only DRAFT payroll runs can be processed', 400);

  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: { status: 'PROCESSING' },
  });

  try {
    const monthStart  = new Date(run.year, run.month - 1, 1);
    const monthEnd    = new Date(run.year, run.month, 0); // last calendar day of month
    const daysInMonth = monthEnd.getDate();

    // ─── BUG-04 FIX: 4 parallel bulk queries instead of 2N+1 per-employee ──
    // Previously: every loop iteration fired 2 DB queries (salaryRevision +
    // attendanceRecord) plus 1 upsert = 3N+1 total.  Now: 4 queries total,
    // regardless of employee count.
    const [employees, allRevisions, allAttendance, holidays] = await Promise.all([
      prisma.employee.findMany({
        where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null },
      }),
      // All salary revisions effective during this month for this org
      prisma.salaryRevision.findMany({
        where: {
          organizationId: orgId,
          effectiveFrom: { lte: monthStart },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: monthStart } }],
        },
        orderBy: { effectiveFrom: 'desc' }, // latest first — first match per employee wins
      }),
      // All attendance records for this org + month
      prisma.attendanceRecord.findMany({
        where: {
          organizationId: orgId,
          date: { gte: monthStart, lte: monthEnd },
        },
      }),
      // All declared holidays for this org + month (needed for BUG-05 fix)
      prisma.holiday.findMany({
        where: {
          organizationId: orgId,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { date: true },
      }),
    ]);
    // ─────────────────────────────────────────────────────────────────────────

    // O(1) lookup: employeeId → latest effective salary revision
    const salaryRevisionMap = new Map<string, (typeof allRevisions)[number]>();
    for (const rev of allRevisions) {
      if (!salaryRevisionMap.has(rev.employeeId)) {
        salaryRevisionMap.set(rev.employeeId, rev);
      }
    }

    // O(1) lookup: employeeId → attendance records[]
    const attendanceMap = new Map<string, (typeof allAttendance)[number][]>();
    for (const rec of allAttendance) {
      const list = attendanceMap.get(rec.employeeId);
      if (list) list.push(rec);
      else attendanceMap.set(rec.employeeId, [rec]);
    }

    // ─── BUG-05 FIX: Compute actual working days — exclude weekends + holidays
    // Previously: lopDays = daysInMonth - presentDays used the raw calendar-day
    // count which included Saturdays, Sundays, and public holidays. Employees
    // were penalised with LOP for days they were never expected to attend.
    // Fix: iterate the month, skip Sun (0), Sat (6), and declared holidays.
    const holidayDateSet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
    let calendarWorkingDays = 0;
    {
      const cursor = new Date(Date.UTC(run.year, run.month - 1, 1));
      const end    = new Date(Date.UTC(run.year, run.month - 1, daysInMonth));
      while (cursor <= end) {
        const dow     = cursor.getUTCDay();
        const dateStr = cursor.toISOString().slice(0, 10);
        if (dow !== 0 && dow !== 6 && !holidayDateSet.has(dateStr)) calendarWorkingDays++;
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    let totalGross      = 0;
    let totalDeductions = 0;
    let totalNetPay     = 0;
    let processedCount  = 0;

    // Build all payslip upserts first, then commit in one transaction (BUG-04)
    const payslipOps: ReturnType<typeof prisma.payslip.upsert>[] = [];

    for (const emp of employees) {
      const revision = salaryRevisionMap.get(emp.id);
      if (!revision) continue; // No salary structure configured for this employee — skip

      const attendance = attendanceMap.get(emp.id) ?? [];

      // Present days (HALF_DAY counts as 0.5 towards attendance)
      const presentDays = attendance
        .filter((a) => ['PRESENT', 'LATE', 'WFH', 'HALF_DAY'].includes(a.status))
        .reduce((s, a) => s + (a.status === 'HALF_DAY' ? 0.5 : 1), 0);

      // ─── BUG-05 FIX: Use calendarWorkingDays as the attendance base ───────
      const lopDays = Math.max(0, calendarWorkingDays - presentDays);
      // ─────────────────────────────────────────────────────────────────────

      const lopAmount     = calculateLOP(revision.gross, calendarWorkingDays, lopDays);
      const grossAfterLop = revision.gross - lopAmount;
      const basicAfterLop = revision.basic - calculateLOP(revision.basic, calendarWorkingDays, lopDays);

      const pf = run.organization.pfEnabled
        ? calculatePF(basicAfterLop)
        : {
            pfWage: 0, isAboveCeiling: false,
            employeeEPF: 0, employerEPF: 0, employerEPS: 0,
            employerEDLI: 0, employerAdminCharge: 0,
            totalEmployerContribution: 0, totalCostToEmployer: 0,
          };

      const esi = run.organization.esiEnabled
        ? calculateESI(grossAfterLop)
        : {
            grossSalary: 0, employeeContribution: 0,
            employerContribution: 0, totalESI: 0, isEligible: false,
          };

      const pt =
        run.organization.ptEnabled && run.organization.ptState
          ? calculateProfessionalTax(grossAfterLop, run.organization.ptState as IndiaState)
          : 0;

      const totalDeductionsForEmp = pf.employeeEPF + esi.employeeContribution + pt;
      const netPay                = grossAfterLop - totalDeductionsForEmp;

      const components = revision.components as Array<{
        code: string;
        name: string;
        amount: number;
      }>;

      const earnings = components
        .filter((c) => !['PF_EMP', 'ESI_EMP', 'PT', 'TDS'].includes(c.code))
        .map((c) => ({ code: c.code, name: c.name, amount: c.amount }));

      const deductions = [
        { code: 'LOP',     name: 'Loss of Pay',     amount: lopAmount },
        { code: 'PF_EMP',  name: 'PF (Employee)',    amount: pf.employeeEPF },
        { code: 'ESI_EMP', name: 'ESI (Employee)',   amount: esi.employeeContribution },
        { code: 'PT',      name: 'Professional Tax', amount: pt },
      ].filter((d) => d.amount > 0);

      const statutory = [
        { code: 'PF_ER',  name: 'PF (Employer)',  amount: pf.totalEmployerContribution },
        { code: 'ESI_ER', name: 'ESI (Employer)', amount: esi.employerContribution },
      ].filter((s) => s.amount > 0);

      // BUG-04 FIX: Single payslipData object used for BOTH create AND update.
      // The old code had `update: {}` which meant re-running a payroll run
      // silently left all existing payslips with stale (wrong) figures.
      const payslipData = {
        organizationId:  orgId,
        payrollRunId,
        employeeId:      emp.id,
        month:           run.month,
        year:            run.year,
        workingDays:     calendarWorkingDays,
        presentDays,
        lopDays,
        earnings,
        deductions,
        statutory,
        grossEarnings:   grossAfterLop,
        totalDeductions: totalDeductionsForEmp,
        netPay,
        pfEmployer:      pf.totalEmployerContribution,
        esiEmployer:     esi.employerContribution,
      };

      payslipOps.push(
        prisma.payslip.upsert({
          where: {
            organizationId_payrollRunId_employeeId: {
              organizationId: orgId,
              payrollRunId,
              employeeId: emp.id,
            },
          },
          update: payslipData, // ← was `{}` before — now updates on re-run
          create: payslipData,
        }),
      );

      totalGross      += grossAfterLop;
      totalDeductions += totalDeductionsForEmp;
      totalNetPay     += netPay;
      processedCount++;
    }

    // ─── BUG-04 FIX: Commit all payslip upserts + run status in one shot ────
    // Previously each upsert was fired inside the loop — N round-trips.
    // Now everything is a single atomic transaction.
    await prisma.$transaction([
      ...payslipOps,
      prisma.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status:         'COMPLETED',
          totalEmployees: processedCount,
          totalGross,
          totalDeductions,
          totalNetPay,
          processedBy,
          processedAt:    new Date(),
        },
      }),
    ]);
    // ─────────────────────────────────────────────────────────────────────────

    return await prisma.payrollRun.findUniqueOrThrow({ where: { id: payrollRunId } });
  } catch (err) {
    // Mark run as FAILED so it can be retried once the underlying issue is fixed
    await prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: 'FAILED' },
    });
    throw err;
  }
}
