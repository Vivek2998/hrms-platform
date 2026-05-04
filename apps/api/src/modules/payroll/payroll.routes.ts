import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';
import { initPayrollRun, processPayrollRun } from './payroll.service.js';

const runSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
});

export function payrollRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ────────────────────────────────────────────────────────────
  // Mobile employee endpoints — /payroll/my-payslips*
  // ────────────────────────────────────────────────────────────

  // GET /payroll/my-payslips  (current employee's payslip list)
  app.get('/payroll/my-payslips', auth, async (req, reply) => {
    const query = paginationSchema
      .extend({
        year: z.coerce.number().int().optional(),
      })
      .parse(req.query);

    const payslips = await app.prisma.payslip.findMany({
      where: {
        employeeId: req.user.sub,
        organizationId: req.user.orgId,
        ...(query.year && { year: query.year }),
      },
      include: {
        payrollRun: { select: { status: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const data = payslips.map((p) => ({
      id: p.id,
      employeeId: p.employeeId,
      organizationId: p.organizationId,
      month: p.month,
      year: p.year,
      grossEarnings: p.grossEarnings,
      totalDeductions: p.totalDeductions,
      netPay: p.netPay,
      status: p.payrollRun.status,
      pdfUrl: p.pdfUrl,
    }));

    return reply.send(ok(data));
  });

  // GET /payroll/my-payslips/:id  (full payslip detail with earnings/deductions)
  app.get('/payroll/my-payslips/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const payslip = await app.prisma.payslip.findFirst({
      where: {
        id,
        employeeId: req.user.sub,
        organizationId: req.user.orgId,
      },
      include: {
        payrollRun: { select: { status: true } },
      },
    });

    if (!payslip) throw fail('Payslip not found', 404);

    return reply.send(
      ok({
        id: payslip.id,
        month: payslip.month,
        year: payslip.year,
        grossEarnings: payslip.grossEarnings,
        totalDeductions: payslip.totalDeductions,
        netPay: payslip.netPay,
        earnings: payslip.earnings,
        deductions: payslip.deductions,
        status: payslip.payrollRun.status,
        pdfUrl: payslip.pdfUrl,
      }),
    );
  });

  // ────────────────────────────────────────────────────────────
  // HR/Admin payroll management endpoints
  // ────────────────────────────────────────────────────────────

  // GET /payroll/runs
  app.get('/payroll/runs', auth, async (req, reply) => {
    const query = paginationSchema.parse(req.query);
    const [runs, total] = await app.prisma.$transaction([
      app.prisma.payrollRun.findMany({
        where: { organizationId: req.user.orgId },
        ...paginationArgs(query),
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      app.prisma.payrollRun.count({ where: { organizationId: req.user.orgId } }),
    ]);
    return reply.send(paginated(runs, query.page, query.limit, total));
  });

  // POST /payroll/runs  (create draft payroll run)
  app.post('/payroll/runs', auth, async (req, reply) => {
    const input = runSchema.parse(req.body);
    const run = await initPayrollRun(req.user.orgId, input, app.prisma);
    return reply.status(201).send(ok(run));
  });

  // POST /payroll/runs/:id/process  (calculate and finalize)
  app.post('/payroll/runs/:id/process', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const run = await processPayrollRun(req.user.orgId, id, req.user.sub, app.prisma);
    return reply.send(ok(run));
  });

  // GET /payroll/runs/:id/payslips  (all payslips for a specific run)
  app.get('/payroll/runs/:id/payslips', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const query = paginationSchema.parse(req.query);

    const run = await app.prisma.payrollRun.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!run) throw fail('Payroll run not found', 404);

    const [payslips, total] = await app.prisma.$transaction([
      app.prisma.payslip.findMany({
        where: { payrollRunId: id, organizationId: req.user.orgId },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
        ...paginationArgs(query),
      }),
      app.prisma.payslip.count({ where: { payrollRunId: id } }),
    ]);

    return reply.send(paginated(payslips, query.page, query.limit, total));
  });

  // GET /payroll/payslips/:employeeId  (HR view — any employee's payslips)
  app.get('/payroll/payslips/:employeeId', auth, async (req, reply) => {
    const { employeeId } = req.params as { employeeId: string };

    if (req.user.role === 'EMPLOYEE' && req.user.sub !== employeeId) throw fail('Forbidden', 403);

    const query = paginationSchema
      .extend({
        year: z.coerce.number().int().optional(),
      })
      .parse(req.query);

    const [payslips, total] = await app.prisma.$transaction([
      app.prisma.payslip.findMany({
        where: {
          employeeId,
          organizationId: req.user.orgId,
          ...(query.year && { year: query.year }),
        },
        ...paginationArgs(query),
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      app.prisma.payslip.count({
        where: {
          employeeId,
          organizationId: req.user.orgId,
          ...(query.year && { year: query.year }),
        },
      }),
    ]);

    return reply.send(paginated(payslips, query.page, query.limit, total));
  });
}
