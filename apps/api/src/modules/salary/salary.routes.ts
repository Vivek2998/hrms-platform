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

const componentSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20).toUpperCase(),
  type: z.enum(['EARNING', 'DEDUCTION', 'STATUTORY']),
  isFixedAmount: z.boolean().default(false),
  defaultPercent: z.number().min(0).max(100).optional(),
  defaultAmount: z.number().min(0).optional(),
  isTaxable: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
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

const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

export function salaryRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── Salary Components (org-level master data) ──────────────

  // GET /salary-components
  app.get('/salary-components', auth, async (req, reply) => {
    const components = await app.prisma.salaryComponent.findMany({
      where: { organizationId: req.user.orgId, deletedAt: null },
      orderBy: [{ type: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    });
    return reply.send(ok(components));
  });

  // POST /salary-components
  app.post('/salary-components', auth, async (req, reply) => {
    if (!ADMIN_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const input = componentSchema.parse(req.body);

    const existing = await app.prisma.salaryComponent.findFirst({
      where: { organizationId: req.user.orgId, code: input.code, deletedAt: null },
    });
    if (existing) throw fail(`Component with code "${input.code}" already exists`, 409);

    const component = await app.prisma.salaryComponent.create({
      data: { ...input, organizationId: req.user.orgId },
    });
    return reply.status(201).send(ok(component));
  });

  // PATCH /salary-components/:id
  app.patch('/salary-components/:id', auth, async (req, reply) => {
    if (!ADMIN_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = componentSchema.partial().parse(req.body);

    const existing = await app.prisma.salaryComponent.findFirst({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
    });
    if (!existing) throw fail('Component not found', 404);

    const updated = await app.prisma.salaryComponent.update({
      where: { id },
      data: input,
    });
    return reply.send(ok(updated));
  });

  // DELETE /salary-components/:id (soft delete)
  app.delete('/salary-components/:id', auth, async (req, reply) => {
    if (!ADMIN_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };

    const existing = await app.prisma.salaryComponent.findFirst({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
    });
    if (!existing) throw fail('Component not found', 404);

    await app.prisma.salaryComponent.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return reply.status(204).send();
  });

  // ── Salary Revisions ───────────────────────────────────────

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
    if (!ADMIN_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
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
