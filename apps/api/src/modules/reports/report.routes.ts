import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { fail } from '../../lib/response.js';

function csvEscape(v: string | number | null | undefined): string {
  if (v == null) return '';
  const s = String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function toRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(csvEscape).join(',');
}

function fmtTime(dt: Date | null): string {
  if (!dt) return '';
  return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
}

function isoDate(dt: Date | null): string {
  if (!dt) return '';
  return dt.toISOString().slice(0, 10);
}

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
const MGR_ROLES = [...HR_ROLES, 'MANAGER'];

export function reportRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /reports/attendance?month=&year=
  app.get('/reports/attendance', auth, async (req, reply) => {
    if (!MGR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { month, year } = z.object({
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int().min(2020),
    }).parse(req.query);

    const records = await app.prisma.attendanceRecord.findMany({
      where: {
        organizationId: req.user.orgId,
        date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) },
      },
      include: {
        employee: {
          select: {
            employeeCode: true, firstName: true, lastName: true,
            designation: true, department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { date: 'asc' }],
    });

    const headers = toRow([
      'Employee Code', 'Employee Name', 'Designation', 'Department',
      'Date', 'Punch In', 'Punch Out', 'Status', 'Working Hours',
    ]);
    const rows = records.map((r) =>
      toRow([
        r.employee.employeeCode,
        `${r.employee.firstName} ${r.employee.lastName}`,
        r.employee.designation,
        r.employee.department?.name,
        isoDate(r.date),
        fmtTime(r.punchIn),
        fmtTime(r.punchOut),
        r.status,
        r.workingMinutes > 0 ? (r.workingMinutes / 60).toFixed(2) : '',
      ]),
    );

    const csv = [headers, ...rows].join('\n');
    const filename = `attendance_${year}_${String(month).padStart(2, '0')}.csv`;
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });

  // GET /reports/payroll?month=&year=
  app.get('/reports/payroll', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { month, year } = z.object({
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int().min(2020),
    }).parse(req.query);

    const payslips = await app.prisma.payslip.findMany({
      where: { organizationId: req.user.orgId, month, year },
      include: {
        employee: {
          select: {
            employeeCode: true, firstName: true, lastName: true,
            designation: true, department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    });

    const headers = toRow([
      'Employee Code', 'Employee Name', 'Designation', 'Department',
      'Working Days', 'Present Days', 'LOP Days',
      'Gross Earnings', 'Total Deductions', 'Net Pay', 'PF (Employer)', 'ESI (Employer)',
    ]);
    const rows = payslips.map((p) =>
      toRow([
        p.employee.employeeCode,
        `${p.employee.firstName} ${p.employee.lastName}`,
        p.employee.designation,
        p.employee.department?.name,
        p.workingDays, p.presentDays, p.lopDays,
        p.grossEarnings.toFixed(2),
        p.totalDeductions.toFixed(2),
        p.netPay.toFixed(2),
        p.pfEmployer.toFixed(2),
        p.esiEmployer.toFixed(2),
      ]),
    );

    const csv = [headers, ...rows].join('\n');
    const filename = `payroll_${year}_${String(month).padStart(2, '0')}.csv`;
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });

  // ── Helpers for statutory JSON extraction ─────────────────────────────────
  function extractStatutory(statutory: any[], codes: string[]): number {
    if (!Array.isArray(statutory)) return 0;
    const upper = codes.map((c) => c.toUpperCase());
    const item = statutory.find((s: any) => upper.includes(String(s.code ?? '').toUpperCase()));
    return item ? Number(item.amount ?? 0) : 0;
  }

  const PF_CODES  = ['PF', 'EPF', 'PROVIDENT_FUND', 'PF_EMPLOYEE'];
  const ESI_CODES = ['ESI', 'ESIC', 'ESI_EMPLOYEE'];
  const PT_CODES  = ['PT', 'PROFESSIONAL_TAX', 'PROF_TAX'];
  const TDS_CODES = ['TDS', 'INCOME_TAX', 'TDS_INCOME_TAX', 'IT'];

  const monthYearSchema = z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2020),
  });

  // GET /reports/pf?month=&year=
  app.get('/reports/pf', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { month, year } = monthYearSchema.parse(req.query);

    const payslips = await app.prisma.payslip.findMany({
      where: { organizationId: req.user.orgId, month, year },
      include: {
        employee: {
          select: {
            employeeCode: true, firstName: true, lastName: true,
            panNumber: true, uanNumber: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    });

    const headers = toRow([
      'Employee Code', 'Employee Name', 'Department', 'PAN', 'UAN',
      'Gross Wages', 'PF Wages', 'Employee PF (12%)', 'Employer PF (12%)', 'Total PF',
    ]);
    const rows = payslips.map((p) => {
      const empPf = extractStatutory(p.statutory as any[], PF_CODES);
      const empPf12 = empPf || (p.grossEarnings * 0.12);
      return toRow([
        p.employee.employeeCode,
        `${p.employee.firstName} ${p.employee.lastName}`,
        p.employee.department?.name,
        p.employee.panNumber,
        p.employee.uanNumber,
        p.grossEarnings.toFixed(2),
        Math.min(p.grossEarnings, 15000).toFixed(2),
        empPf12.toFixed(2),
        p.pfEmployer.toFixed(2),
        (empPf12 + p.pfEmployer).toFixed(2),
      ]);
    });

    const csv = [headers, ...rows].join('\n');
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="pf_${year}_${String(month).padStart(2,'0')}.csv"`)
      .send(csv);
  });

  // GET /reports/esi?month=&year=
  app.get('/reports/esi', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { month, year } = monthYearSchema.parse(req.query);

    const payslips = await app.prisma.payslip.findMany({
      where: { organizationId: req.user.orgId, month, year },
      include: {
        employee: {
          select: {
            employeeCode: true, firstName: true, lastName: true,
            esiNumber: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    });

    const headers = toRow([
      'Employee Code', 'Employee Name', 'Department', 'ESI Number',
      'Gross Wages', 'Employee ESI (0.75%)', 'Employer ESI (3.25%)', 'Total ESI',
    ]);
    const rows = payslips.map((p) => {
      const empEsi = extractStatutory(p.statutory as any[], ESI_CODES);
      return toRow([
        p.employee.employeeCode,
        `${p.employee.firstName} ${p.employee.lastName}`,
        p.employee.department?.name,
        p.employee.esiNumber,
        p.grossEarnings.toFixed(2),
        empEsi.toFixed(2),
        p.esiEmployer.toFixed(2),
        (empEsi + p.esiEmployer).toFixed(2),
      ]);
    });

    const csv = [headers, ...rows].join('\n');
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="esi_${year}_${String(month).padStart(2,'0')}.csv"`)
      .send(csv);
  });

  // GET /reports/pt?month=&year=
  app.get('/reports/pt', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { month, year } = monthYearSchema.parse(req.query);

    const payslips = await app.prisma.payslip.findMany({
      where: { organizationId: req.user.orgId, month, year },
      include: {
        employee: {
          select: {
            employeeCode: true, firstName: true, lastName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    });

    const headers = toRow([
      'Employee Code', 'Employee Name', 'Department',
      'Gross Salary', 'Professional Tax',
    ]);
    const rows = payslips.map((p) => {
      const pt = extractStatutory(p.statutory as any[], PT_CODES);
      return toRow([
        p.employee.employeeCode,
        `${p.employee.firstName} ${p.employee.lastName}`,
        p.employee.department?.name,
        p.grossEarnings.toFixed(2),
        pt.toFixed(2),
      ]);
    });

    const csv = [headers, ...rows].join('\n');
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="pt_${year}_${String(month).padStart(2,'0')}.csv"`)
      .send(csv);
  });

  // GET /reports/tds?month=&year=
  app.get('/reports/tds', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { month, year } = monthYearSchema.parse(req.query);

    const payslips = await app.prisma.payslip.findMany({
      where: { organizationId: req.user.orgId, month, year },
      include: {
        employee: {
          select: {
            employeeCode: true, firstName: true, lastName: true,
            panNumber: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    });

    const headers = toRow([
      'Employee Code', 'Employee Name', 'Department', 'PAN',
      'Gross Earnings', 'Net Pay', 'TDS Deducted',
    ]);
    const rows = payslips.map((p) => {
      const tds = extractStatutory(p.statutory as any[], TDS_CODES);
      return toRow([
        p.employee.employeeCode,
        `${p.employee.firstName} ${p.employee.lastName}`,
        p.employee.department?.name,
        p.employee.panNumber,
        p.grossEarnings.toFixed(2),
        p.netPay.toFixed(2),
        tds.toFixed(2),
      ]);
    });

    const csv = [headers, ...rows].join('\n');
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="tds_${year}_${String(month).padStart(2,'0')}.csv"`)
      .send(csv);
  });

  // GET /reports/leaves?year=
  app.get('/reports/leaves', auth, async (req, reply) => {
    if (!MGR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { year } = z.object({
      year: z.coerce.number().int().min(2020),
    }).parse(req.query);

    const requests = await app.prisma.leaveRequest.findMany({
      where: {
        organizationId: req.user.orgId,
        deletedAt: null,
        fromDate: { gte: new Date(year, 0, 1) },
        toDate: { lte: new Date(year, 11, 31, 23, 59, 59) },
      },
      include: {
        employee: {
          select: {
            employeeCode: true, firstName: true, lastName: true,
            designation: true, department: { select: { name: true } },
          },
        },
        leaveType: { select: { name: true } },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { fromDate: 'asc' }],
    });

    const headers = toRow([
      'Employee Code', 'Employee Name', 'Designation', 'Department',
      'Leave Type', 'From Date', 'To Date', 'Total Days', 'Status', 'Reason',
    ]);
    const rows = requests.map((r) =>
      toRow([
        r.employee.employeeCode,
        `${r.employee.firstName} ${r.employee.lastName}`,
        r.employee.designation,
        r.employee.department?.name,
        r.leaveType.name,
        isoDate(r.fromDate),
        isoDate(r.toDate),
        r.totalDays,
        r.status,
        r.reason,
      ]),
    );

    const csv = [headers, ...rows].join('\n');
    const filename = `leaves_${year}.csv`;
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv);
  });
}
