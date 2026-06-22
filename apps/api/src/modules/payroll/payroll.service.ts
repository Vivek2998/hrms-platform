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
  // BUG-H03: Atomic compare-and-swap to prevent concurrent double-processing.
  // Two simultaneous requests could both pass a findFirst + status check, then
  // both set status='PROCESSING' and compute duplicate payslips.
  const runCheck = await prisma.payrollRun.findFirst({
    where: { id: payrollRunId, organizationId: orgId },
  });
  if (!runCheck) throw fail('Payroll run not found', 404);
  if (runCheck.status !== 'DRAFT') throw fail('Only DRAFT payroll runs can be processed', 400);

  // updateMany with status='DRAFT' in the WHERE is atomic — only one concurrent
  // request can update the row; the other gets count=0 and returns 409.
  const locked = await prisma.payrollRun.updateMany({
    where: { id: payrollRunId, organizationId: orgId, status: 'DRAFT' },
    data: { status: 'PROCESSING' },
  });
  if (locked.count === 0) {
    throw fail('Payroll run is already being processed by another request', 409);
  }

  // Re-fetch with organization include (needed for PF/ESI/PT flags)
  const run = await prisma.payrollRun.findUniqueOrThrow({
    where: { id: payrollRunId },
    include: { organization: true },
  });

  try {
    // BUG-M01: Use Date.UTC so month boundaries are always midnight UTC,
    // matching how @db.Date fields are stored in PostgreSQL. Using the local
    // Date constructor on a UTC+5:30 server creates dates 5.5 hours offset
    // from midnight UTC, which can include or exclude wrong days.
    const monthStart  = new Date(Date.UTC(run.year, run.month - 1, 1));
    const monthEnd    = new Date(Date.UTC(run.year, run.month, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(Date.UTC(run.year, run.month, 0)).getUTCDate();

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
    // Build a Set of working-day date strings for use in presentDays filtering.
    const workingDaySet = new Set<string>();
    {
      const cursor = new Date(Date.UTC(run.year, run.month - 1, 1));
      const end    = new Date(Date.UTC(run.year, run.month - 1, daysInMonth));
      while (cursor <= end) {
        const dow     = cursor.getUTCDay();
        const dateStr = cursor.toISOString().slice(0, 10);
        if (dow !== 0 && dow !== 6 && !holidayDateSet.has(dateStr)) {
          calendarWorkingDays++;
          workingDaySet.add(dateStr);
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    let totalGross      = 0;
    let totalDeductions = 0;
    let totalNetPay     = 0;
    let processedCount  = 0;

    // BUG-M02: Track employees skipped due to missing salary revision so HR is informed
    const skippedEmployees: Array<{ id: string; employeeCode: string; firstName: string; lastName: string }> = [];

    // BUG-H05: Collect upsert args (not promises) so we can run them inside an
    // interactive transaction with chunking — avoids the 5-second array-form timeout.
    const payslipArgs: Parameters<typeof prisma.payslip.upsert>[0][] = [];

    for (const emp of employees) {
      const revision = salaryRevisionMap.get(emp.id);
      if (!revision) {
        // BUG-M02: Record who was skipped instead of silently continuing
        skippedEmployees.push({
          id: emp.id,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          lastName: emp.lastName,
        });
        continue;
      }

      const attendance = attendanceMap.get(emp.id) ?? [];

      // Present days (HALF_DAY counts as 0.5 towards attendance).
      // Only count records that fall on actual working days — an employee who
      // punches in on a Saturday for comp-off should NOT reduce their LOP count
      // because Saturday isn't in the attendance base (calendarWorkingDays).
      const presentDays = attendance
        .filter((a) => {
          const dateStr = (a.date as Date).toISOString().slice(0, 10);
          return workingDaySet.has(dateStr) && ['PRESENT', 'LATE', 'WFH', 'HALF_DAY'].includes(a.status);
        })
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

      payslipArgs.push({
        where: {
          organizationId_payrollRunId_employeeId: {
            organizationId: orgId,
            payrollRunId,
            employeeId: emp.id,
          },
        },
        update: payslipData,
        create: payslipData,
      });

      totalGross      += grossAfterLop;
      totalDeductions += totalDeductionsForEmp;
      totalNetPay     += netPay;
      processedCount++;
    }

    // BUG-H05: Chunked interactive transaction — avoids 5-second array-form timeout
    // for large orgs (500+ employees). Processes payslips in batches of 50 and
    // then commits the run status update in the same transaction.
    await prisma.$transaction(
      async (tx) => {
        const CHUNK_SIZE = 50;
        for (let i = 0; i < payslipArgs.length; i += CHUNK_SIZE) {
          const chunk = payslipArgs.slice(i, i + CHUNK_SIZE);
          await Promise.all(chunk.map((args) => tx.payslip.upsert(args)));
        }
        await tx.payrollRun.update({
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
        });
      },
      { timeout: 120_000 }, // 2-minute timeout for large orgs
    );

    const completedRun = await prisma.payrollRun.findUniqueOrThrow({ where: { id: payrollRunId } });
    return { run: completedRun, skippedEmployees };
  } catch (err) {
    // Mark run as FAILED so it can be retried once the underlying issue is fixed
    await prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: 'FAILED' },
    });
    throw err;
  }
}
