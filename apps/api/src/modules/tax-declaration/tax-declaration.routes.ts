import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const declarationSchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{2}$/), // "2025-26"
  regime: z.enum(['OLD', 'NEW']).default('OLD'),
  // 80C — capped at ₹1,50,000
  ppf: z.number().min(0).optional(),
  epf: z.number().min(0).optional(),
  elss: z.number().min(0).optional(),
  lic: z.number().min(0).optional(),
  nsc: z.number().min(0).optional(),
  homeLoanPrincipal: z.number().min(0).optional(),
  tuitionFees: z.number().min(0).optional(),
  sukanyaSamriddhi: z.number().min(0).optional(),
  // 80D
  healthInsuranceSelf: z.number().min(0).optional(),
  healthInsuranceParents: z.number().min(0).optional(),
  // HRA
  rentPaid: z.number().min(0).optional(),
  landlordPan: z.string().optional(),
  // Other
  npsEmployee: z.number().min(0).optional(),    // 80CCD(1B) extra ₹50k
  homeLoanInterest: z.number().min(0).optional(), // 24(b) up to ₹2L
  savingsInterest: z.number().min(0).optional(),  // 80TTA up to ₹10k
  otherDeductions: z.record(z.string(), z.number()).optional(),
});

function computeTotal(data: z.infer<typeof declarationSchema>): number {
  const sec80C = Math.min(150000, [
    data.ppf, data.epf, data.elss, data.lic, data.nsc,
    data.homeLoanPrincipal, data.tuitionFees, data.sukanyaSamriddhi,
  ].reduce((s: number, v) => s + (v ?? 0), 0));

  const sec80D = (data.healthInsuranceSelf ?? 0) + (data.healthInsuranceParents ?? 0);
  const hra = data.rentPaid ?? 0;
  const nps = Math.min(50000, data.npsEmployee ?? 0);
  const homeLoanInt = Math.min(200000, data.homeLoanInterest ?? 0);
  const savings = Math.min(10000, data.savingsInterest ?? 0);
  const other = Object.values(data.otherDeductions ?? {}).reduce((s, v) => s + v, 0);

  return sec80C + sec80D + hra + nps + homeLoanInt + savings + other;
}

export function taxDeclarationRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /tax-declarations/my  (current employee's declarations)
  app.get('/tax-declarations/my', auth, async (req, reply) => {
    const year = (req.query as Record<string, string>)['financialYear'];

    const declarations = await app.prisma.taxDeclaration.findMany({
      where: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        ...(year && { financialYear: year }),
      },
      orderBy: { financialYear: 'desc' },
    });

    return reply.send(ok(declarations));
  });

  // GET /tax-declarations  (HR view — all employees)
  app.get('/tax-declarations', auth, async (req, reply) => {
    const year = (req.query as Record<string, string>)['financialYear'];

    const declarations = await app.prisma.taxDeclaration.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(year && { financialYear: year }),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
      },
      orderBy: [{ financialYear: 'desc' }, { createdAt: 'desc' }],
    });

    return reply.send(ok(declarations));
  });

  // POST /tax-declarations  (upsert — employee saves/updates their declaration)
  app.post('/tax-declarations', auth, async (req, reply) => {
    const input = declarationSchema.parse(req.body);
    const totalDeclared = computeTotal(input);

    const declaration = await app.prisma.taxDeclaration.upsert({
      where: {
        organizationId_employeeId_financialYear: {
          organizationId: req.user.orgId,
          employeeId: req.user.sub,
          financialYear: input.financialYear,
        },
      },
      create: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        ...input,
        totalDeclared,
        status: 'DRAFT',
      },
      update: {
        ...input,
        totalDeclared,
        status: 'DRAFT',
        submittedAt: null,
      },
    });

    return reply.status(201).send(ok(declaration));
  });

  // PATCH /tax-declarations/:id/submit  (employee submits final declaration)
  app.patch('/tax-declarations/:id/submit', auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const declaration = await app.prisma.taxDeclaration.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub },
    });
    if (!declaration) throw fail('Declaration not found', 404);
    if (declaration.status === 'VERIFIED') throw fail('Verified declarations cannot be re-submitted', 400);

    await app.prisma.taxDeclaration.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    });

    return reply.send(ok({ message: 'Declaration submitted successfully' }));
  });

  // PATCH /tax-declarations/:id/verify  (HR marks as verified)
  app.patch('/tax-declarations/:id/verify', auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const declaration = await app.prisma.taxDeclaration.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!declaration) throw fail('Declaration not found', 404);
    if (declaration.status !== 'SUBMITTED') throw fail('Only submitted declarations can be verified', 400);

    await app.prisma.taxDeclaration.update({
      where: { id },
      data: { status: 'VERIFIED', verifiedBy: req.user.sub, verifiedAt: new Date() },
    });

    return reply.send(ok({ message: 'Declaration verified' }));
  });
}
