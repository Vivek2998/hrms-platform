import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';

const revisionSchema = z.object({
  employeeId: z.string().uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ctc: z.number().positive(),
  reason: z.string().optional(),
});

function buildComponents(ctc: number) {
  const monthly = ctc / 12;
  const basic = Math.round((monthly * 0.4) / 100) * 100;
  const hra = Math.round((basic * 0.5) / 100) * 100;
  const lta = Math.round((basic * 0.0833) / 100) * 100;
  const special = Math.round(monthly - basic - hra - lta);
  return {
    basic,
    hra,
    lta,
    special: Math.max(0, special),
    gross: basic + hra + lta + Math.max(0, special),
  };
}

export function salaryRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /salary-revisions?employeeId=
  app.get('/salary-revisions', auth, async (req, reply) => {
    const query = paginationSchema
      .extend({ employeeId: z.string().uuid() })
      .parse(req.query);

    const employee = await app.prisma.employee.findFirst({
      where: { id: query.employeeId, organizationId: req.user.orgId },
    });
    if (!employee) throw fail('Employee not found', 404);

    const [revisions, total] = await app.prisma.$transaction([
      app.prisma.salaryRevision.findMany({
        where: { employeeId: query.employeeId, organizationId: req.user.orgId },
        ...paginationArgs(query),
        orderBy: { effectiveFrom: 'desc' },
      }),
      app.prisma.salaryRevision.count({
        where: { employeeId: query.employeeId, organizationId: req.user.orgId },
      }),
    ]);

    return reply.send(paginated(revisions, query.page, query.limit, total));
  });

  // POST /salary-revisions
  app.post('/salary-revisions', auth, async (req, reply) => {
    const input = revisionSchema.parse(req.body);

    const employee = await app.prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId: req.user.orgId },
    });
    if (!employee) throw fail('Employee not found', 404);

    const { basic, hra, lta, special, gross } = buildComponents(input.ctc);

    // Estimate statutory deductions for net pay display
    const pfEmp = basic > 15000 ? 1800 : Math.round(basic * 0.12);
    const esiEmp = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
    const netPay = gross - pfEmp - esiEmp;

    const components = [
      { code: 'BASIC', name: 'Basic Salary', amount: basic },
      { code: 'HRA', name: 'House Rent Allowance', amount: hra },
      { code: 'LTA', name: 'Leave Travel Allowance', amount: lta },
      ...(special > 0 ? [{ code: 'SPEC', name: 'Special Allowance', amount: special }] : []),
    ];

    const revision = await app.prisma.salaryRevision.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        effectiveFrom: new Date(input.effectiveFrom),
        ctc: input.ctc,
        basic,
        gross,
        netPay,
        components,
        reason: input.reason,
        approvedBy: req.user.sub,
      },
    });

    return reply.status(201).send(ok(revision));
  });
}
