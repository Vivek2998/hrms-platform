import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const hrRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

const createSchema = z.object({
  employeeId: z.string().uuid(),
  lastWorkingDate: z.string(),
  basicDays: z.number().min(0).default(0),
  basicAmount: z.number().min(0).default(0),
  pendingLeavesDays: z.number().min(0).default(0),
  leaveEncashment: z.number().min(0).default(0),
  gratuityYears: z.number().min(0).default(0),
  gratuityAmount: z.number().min(0).default(0),
  bonusAmount: z.number().min(0).default(0),
  otherDeductions: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export async function fnfRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /fnf — HR sees all; employee sees own
  app.get('/fnf', auth, async (req, reply) => {
    const { organizationId, role, employeeId } = req.user as any;
    const isHr = hrRoles.includes(role);

    const settlements = await app.prisma.fnFSettlement.findMany({
      where: {
        organizationId,
        ...(!isHr ? { employeeId } : {}),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true, designation: true },
        },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(settlements));
  });

  // GET /fnf/:employeeId — get settlement for a specific employee
  app.get('/fnf/:employeeId', auth, async (req, reply) => {
    const { organizationId, role, employeeId: currentUser } = req.user as any;
    const { employeeId } = req.params as any;

    if (!hrRoles.includes(role) && currentUser !== employeeId) throw fail('Forbidden', 403);

    const settlement = await app.prisma.fnFSettlement.findFirst({
      where: { organizationId, employeeId },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true, employeeCode: true,
            designation: true, dateOfJoining: true,
            department: { select: { name: true } },
          },
        },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!settlement) throw fail('No FnF settlement found', 404);
    return reply.send(ok(settlement));
  });

  // POST /fnf — HR creates settlement (auto-calculates netPayable)
  app.post('/fnf', auth, async (req, reply) => {
    const { organizationId, role } = req.user as any;
    if (!hrRoles.includes(role)) throw fail('Forbidden', 403);

    const body = createSchema.parse(req.body);

    const existing = await app.prisma.fnFSettlement.findFirst({
      where: { organizationId, employeeId: body.employeeId },
    });
    if (existing) throw fail('FnF settlement already exists for this employee', 409);

    const netPayable =
      body.basicAmount +
      body.leaveEncashment +
      body.gratuityAmount +
      body.bonusAmount -
      body.otherDeductions;

    const settlement = await app.prisma.fnFSettlement.create({
      data: {
        organizationId,
        employeeId: body.employeeId,
        lastWorkingDate: new Date(body.lastWorkingDate),
        basicDays: body.basicDays,
        basicAmount: body.basicAmount,
        pendingLeavesDays: body.pendingLeavesDays,
        leaveEncashment: body.leaveEncashment,
        gratuityYears: body.gratuityYears,
        gratuityAmount: body.gratuityAmount,
        bonusAmount: body.bonusAmount,
        otherDeductions: body.otherDeductions,
        netPayable,
        notes: body.notes,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    });
    return reply.status(201).send(ok(settlement));
  });

  // PATCH /fnf/:id — HR edits draft settlement
  app.patch('/fnf/:id', auth, async (req, reply) => {
    const { organizationId, role } = req.user as any;
    if (!hrRoles.includes(role)) throw fail('Forbidden', 403);

    const { id } = req.params as any;
    const body = createSchema.partial().parse(req.body);

    const existing = await app.prisma.fnFSettlement.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'DRAFT') throw fail('Can only edit DRAFT settlements', 409);

    const merged = { ...existing, ...body };
    const netPayable =
      (merged.basicAmount ?? 0) +
      (merged.leaveEncashment ?? 0) +
      (merged.gratuityAmount ?? 0) +
      (merged.bonusAmount ?? 0) -
      (merged.otherDeductions ?? 0);

    await app.prisma.fnFSettlement.update({
      where: { id },
      data: { ...body, netPayable, lastWorkingDate: body.lastWorkingDate ? new Date(body.lastWorkingDate) : undefined },
    });
    return reply.send(ok({ id }));
  });

  // PATCH /fnf/:id/submit — HR submits for approval
  app.patch('/fnf/:id/submit', auth, async (req, reply) => {
    const { organizationId, role } = req.user as any;
    if (!hrRoles.includes(role)) throw fail('Forbidden', 403);

    const { id } = req.params as any;
    const existing = await app.prisma.fnFSettlement.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'DRAFT') throw fail('Already submitted', 409);

    await app.prisma.fnFSettlement.update({ where: { id }, data: { status: 'PENDING_APPROVAL' } });
    return reply.send(ok({ id }));
  });

  // PATCH /fnf/:id/approve
  app.patch('/fnf/:id/approve', auth, async (req, reply) => {
    const { organizationId, role, employeeId } = req.user as any;
    if (!hrRoles.includes(role)) throw fail('Forbidden', 403);

    const { id } = req.params as any;
    const existing = await app.prisma.fnFSettlement.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'PENDING_APPROVAL') throw fail('Not pending approval', 409);

    await app.prisma.fnFSettlement.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: employeeId, approvedAt: new Date() },
    });
    return reply.send(ok({ id }));
  });

  // PATCH /fnf/:id/paid — mark as paid
  app.patch('/fnf/:id/paid', auth, async (req, reply) => {
    const { organizationId, role } = req.user as any;
    if (!hrRoles.includes(role)) throw fail('Forbidden', 403);

    const { id } = req.params as any;
    const existing = await app.prisma.fnFSettlement.findFirst({ where: { id, organizationId } });
    if (!existing) throw fail('Not found', 404);
    if (existing.status !== 'APPROVED') throw fail('Not approved', 409);

    await app.prisma.fnFSettlement.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
    return reply.send(ok({ id }));
  });
}
