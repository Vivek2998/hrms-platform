import type { PrismaClient } from "@prisma/client";
import { fail } from "../../lib/response.js";
import {
  calculatePF,
  calculateESI,
  calculateProfessionalTax,
  calculateLOP,
} from "@hrms/shared-utils";
import type { IndiaState } from "@hrms/shared-types";

interface PayrollRunInput {
  month: number;
  year: number;
}

export async function initPayrollRun(
  orgId: string,
  input: PayrollRunInput,
  prisma: PrismaClient,
) {
  const existing = await prisma.payrollRun.findUnique({
    where: {
      organizationId_month_year: {
        organizationId: orgId,
        month: input.month,
        year: input.year,
      },
    },
  });

  if (existing && existing.status !== "FAILED")
    throw fail(`Payroll for ${input.month}/${input.year} already exists`, 409);

  const run = await prisma.payrollRun.upsert({
    where: {
      organizationId_month_year: {
        organizationId: orgId,
        month: input.month,
        year: input.year,
      },
    },
    update: { status: "DRAFT" },
    create: {
      organizationId: orgId,
      month: input.month,
      year: input.year,
      status: "DRAFT",
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

  if (!run) throw fail("Payroll run not found", 404);
  if (run.status !== "DRAFT") throw fail("Only DRAFT payroll runs can be processed", 400);

  await prisma.payrollRun.update({
    where: { id: payrollRunId },
    data: { status: "PROCESSING" },
  });

  try {
    const employees = await prisma.employee.findMany({
      where: { organizationId: orgId, status: "ACTIVE", deletedAt: null },
    });

    // Working days in the month
    const daysInMonth = new Date(run.year, run.month, 0).getDate();

    let totalGross = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;

    for (const emp of employees) {
      // Get latest salary revision
      const revision = await prisma.salaryRevision.findFirst({
        where: {
          employeeId: emp.id,
          effectiveFrom: {
            lte: new Date(run.year, run.month - 1, 1),
          },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date(run.year, run.month - 1, 1) } },
          ],
        },
        orderBy: { effectiveFrom: "desc" },
      });

      if (!revision) continue;

      // Attendance for this month
      const attendance = await prisma.attendanceRecord.findMany({
        where: {
          employeeId: emp.id,
          date: {
            gte: new Date(run.year, run.month - 1, 1),
            lte: new Date(run.year, run.month, 0),
          },
        },
      });

      const presentDays = attendance.filter((a) =>
        ["PRESENT", "LATE", "WFH", "HALF_DAY"].includes(a.status),
      ).reduce((s, a) => s + (a.status === "HALF_DAY" ? 0.5 : 1), 0);

      const lopDays = Math.max(0, daysInMonth - presentDays);

      // LOP deduction
      const lopAmount = calculateLOP(revision.gross, daysInMonth, lopDays);
      const grossAfterLop = revision.gross - lopAmount;
      const basicAfterLop = revision.basic - calculateLOP(revision.basic, daysInMonth, lopDays);

      // Statutory
      const pf = run.organization.pfEnabled
        ? calculatePF(basicAfterLop)
        : { employeeContribution: 0, employerContribution: 0, totalContribution: 0, epfEmployee: 0, eps: 0, edli: 0, adminCharges: 0 };

      const esi = run.organization.esiEnabled
        ? calculateESI(grossAfterLop)
        : { employeeContribution: 0, employerContribution: 0, totalContribution: 0, isEligible: false };

      const pt = run.organization.ptEnabled && run.organization.ptState
        ? calculateProfessionalTax(grossAfterLop, run.organization.ptState as IndiaState)
        : 0;

      const totalDeductionsForEmp =
        pf.employeeContribution + esi.employeeContribution + pt;

      const netPay = grossAfterLop - totalDeductionsForEmp;

      const components = revision.components as Array<{ code: string; name: string; amount: number }>;

      const earnings = components
        .filter((c) => !["PF_EMP", "ESI_EMP", "PT", "TDS"].includes(c.code))
        .map((c) => ({ code: c.code, name: c.name, amount: c.amount }));

      const deductions = [
        { code: "LOP", name: "Loss of Pay", amount: lopAmount },
        { code: "PF_EMP", name: "PF (Employee)", amount: pf.employeeContribution },
        { code: "ESI_EMP", name: "ESI (Employee)", amount: esi.employeeContribution },
        { code: "PT", name: "Professional Tax", amount: pt },
      ].filter((d) => d.amount > 0);

      const statutory = [
        { code: "PF_ER", name: "PF (Employer)", amount: pf.employerContribution },
        { code: "ESI_ER", name: "ESI (Employer)", amount: esi.employerContribution },
      ].filter((s) => s.amount > 0);

      await prisma.payslip.upsert({
        where: {
          organizationId_payrollRunId_employeeId: {
            organizationId: orgId,
            payrollRunId,
            employeeId: emp.id,
          },
        },
        update: {},
        create: {
          organizationId: orgId,
          payrollRunId,
          employeeId: emp.id,
          month: run.month,
          year: run.year,
          workingDays: daysInMonth,
          presentDays,
          lopDays,
          earnings,
          deductions,
          statutory,
          grossEarnings: grossAfterLop,
          totalDeductions: totalDeductionsForEmp,
          netPay,
          pfEmployer: pf.employerContribution,
          esiEmployer: esi.employerContribution,
        },
      });

      totalGross += grossAfterLop;
      totalDeductions += totalDeductionsForEmp;
      totalNetPay += netPay;
    }

    await prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        status: "COMPLETED",
        totalEmployees: employees.length,
        totalGross,
        totalDeductions,
        totalNetPay,
        processedBy,
        processedAt: new Date(),
      },
    });

    return await prisma.payrollRun.findUniqueOrThrow({ where: { id: payrollRunId } });
  } catch (err) {
    await prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: "FAILED" },
    });
    throw err;
  }
}
