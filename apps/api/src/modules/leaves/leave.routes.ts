import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';
import type { Prisma } from '@prisma/client';
import { sendEmail, leaveDecisionEmail } from '../../lib/email.js';

// Mobile sends startDate/endDate as plain date strings (YYYY-MM-DD)
const applyLeaveSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  reason: z.string().min(3).max(500),
  session: z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  attachmentUrl: z.string().url().optional(),
});

const approveLeaveSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

const leaveTypeBodySchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  daysAllowed: z.coerce.number().int().min(0),
  isPaid: z.boolean().default(true),
  isCarryForward: z.boolean().default(false),
  maxCarryForward: z.coerce.number().int().min(0).default(0),
  isEncashable: z.boolean().default(false),
  applicableAfterDays: z.coerce.number().int().min(0).default(0),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

export function leaveRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /leave-types  (all active leave types for the org)
  app.get('/leave-types', auth, async (req, reply) => {
    const leaveTypes = await app.prisma.leaveType.findMany({
      where: { organizationId: req.user.orgId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    return reply.send(ok(leaveTypes));
  });

  // POST /leave-types
  app.post('/leave-types', auth, async (req, reply) => {
    const input = leaveTypeBodySchema.parse(req.body);
    const leaveType = await app.prisma.leaveType.create({
      data: {
        organizationId: req.user.orgId,
        ...input,
        code: input.code.toUpperCase(),
      },
    });
    return reply.status(201).send(ok(leaveType));
  });

  // PATCH /leave-types/:id
  app.patch('/leave-types/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = leaveTypeBodySchema.partial().parse(req.body);
    const leaveType = await app.prisma.leaveType.update({
      where: { id, organizationId: req.user.orgId },
      data: { ...input, ...(input.code && { code: input.code.toUpperCase() }) },
    });
    return reply.send(ok(leaveType));
  });

  // DELETE /leave-types/:id  (soft delete)
  app.delete('/leave-types/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await app.prisma.leaveType.update({
      where: { id, organizationId: req.user.orgId },
      data: { isActive: false, deletedAt: new Date() },
    });
    return reply.send(ok({ message: 'Leave type deleted' }));
  });

  // ────────────────────────────────────────────────────────────
  // Mobile employee endpoints — /leaves/my*  (must be before /leaves/:id)
  // ────────────────────────────────────────────────────────────

  // GET /leaves/my  (current employee's leave history, mobile-field-mapped)
  app.get('/leaves/my', auth, async (req, reply) => {
    const leaves = await app.prisma.leaveRequest.findMany({
      where: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        deletedAt: null,
      },
      include: {
        leaveType: { select: { name: true, code: true } },
        approvals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = leaves.map((l) => ({
      id: l.id,
      employeeId: l.employeeId,
      organizationId: l.organizationId,
      leaveType: { name: l.leaveType.name, code: l.leaveType.code },
      startDate: l.fromDate,
      endDate: l.toDate,
      totalDays: l.totalDays,
      status: l.status,
      reason: l.reason,
      remarks: l.approvals[0]?.remarks ?? null,
      appliedAt: l.createdAt,
    }));

    return reply.send(ok(data));
  });

  // GET /leaves/my/balance  (current employee's leave balances)
  app.get('/leaves/my/balance', auth, async (req, reply) => {
    const year = Number((req.query as Record<string, string>)['year'] ?? new Date().getFullYear());

    const balances = await app.prisma.leaveBalance.findMany({
      where: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        year,
      },
      include: { leaveType: { select: { name: true, code: true } } },
    });

    const data = balances.map((b) => ({
      leaveTypeId: b.leaveTypeId,
      leaveType: { name: b.leaveType.name, code: b.leaveType.code },
      totalDays: b.allocated,
      usedDays: b.used,
      remainingDays: Math.max(0, b.allocated - b.used - b.pending),
    }));

    return reply.send(ok(data));
  });

  // ────────────────────────────────────────────────────────────
  // Shared endpoints
  // ────────────────────────────────────────────────────────────

  // GET /leaves  (paginated list — employees see own; HR/admin see all)
  app.get('/leaves', auth, async (req, reply) => {
    const query = paginationSchema
      .extend({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
        employeeId: z.string().uuid().optional(),
      })
      .parse(req.query);

    const where: Prisma.LeaveRequestWhereInput = {
      organizationId: req.user.orgId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.employeeId
        ? { employeeId: query.employeeId }
        : req.user.role === 'EMPLOYEE'
          ? { employeeId: req.user.sub }
          : {}),
    };

    const [requests, total] = await app.prisma.$transaction([
      app.prisma.leaveRequest.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          leaveType: { select: { id: true, name: true, code: true } },
          approvals: {
            include: {
              approver: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        ...paginationArgs(query),
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.leaveRequest.count({ where }),
    ]);

    return reply.send(paginated(requests, query.page, query.limit, total));
  });

  // POST /leaves  (apply for leave — accepts mobile date format YYYY-MM-DD)
  app.post('/leaves', auth, async (req, reply) => {
    const input = applyLeaveSchema.parse(req.body);

    const from = new Date(input.startDate + 'T00:00:00.000Z');
    const to = new Date(input.endDate + 'T00:00:00.000Z');

    if (to < from) throw fail('End date cannot be before start date', 400);
    if (input.session && from.getTime() !== to.getTime())
      throw fail('Half-day session requires start and end date to be the same', 400);

    const msPerDay = 86_400_000;
    const totalDays = input.session
      ? 0.5
      : Math.floor((to.getTime() - from.getTime()) / msPerDay) + 1;

    const request = await app.prisma.leaveRequest.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        leaveTypeId: input.leaveTypeId,
        fromDate: from,
        toDate: to,
        totalDays,
        reason: input.reason,
        ...(input.session !== undefined && { session: input.session }),
        ...(input.attachmentUrl !== undefined && { attachmentUrl: input.attachmentUrl }),
      },
    });

    return reply.status(201).send(ok(request));
  });

  // PATCH /leaves/:id/approve  (manager/HR approve or reject)
  app.patch('/leaves/:id/approve', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = approveLeaveSchema.parse(req.body);

    const request = await app.prisma.leaveRequest.findFirst({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
      include: {
        employee: { select: { id: true, firstName: true, workEmail: true } },
      },
    });

    if (!request) throw fail('Leave request not found', 404);
    if (request.status !== 'PENDING') throw fail('Only pending requests can be actioned', 400);

    await app.prisma.$transaction([
      app.prisma.leaveRequest.update({
        where: { id },
        data: { status: input.action },
      }),
      app.prisma.leaveApproval.create({
        data: {
          organizationId: req.user.orgId,
          leaveRequestId: id,
          approverId: req.user.sub,
          action: input.action,
          ...(input.remarks !== undefined && { remarks: input.remarks }),
        },
      }),
      app.prisma.notification.create({
        data: {
          organizationId: req.user.orgId,
          employeeId: request.employee.id,
          type: input.action === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
          title: `Leave ${input.action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          body: `Your leave from ${request.fromDate.toISOString().slice(0, 10)} to ${request.toDate.toISOString().slice(0, 10)} has been ${input.action.toLowerCase()}.`,
        },
      }),
    ]);

    void sendEmail(
      request.employee.workEmail,
      `Leave Request ${input.action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
      leaveDecisionEmail(
        request.employee.firstName,
        input.action,
        request.fromDate.toISOString().slice(0, 10),
        request.toDate.toISOString().slice(0, 10),
        input.remarks,
      ),
    );

    return reply.send(ok({ message: `Leave request ${input.action.toLowerCase()}` }));
  });

  // PATCH /leaves/:id/cancel  (employee cancels own pending/approved request)
  app.patch('/leaves/:id/cancel', auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const request = await app.prisma.leaveRequest.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub },
    });

    if (!request) throw fail('Leave request not found', 404);
    if (!['PENDING', 'APPROVED'].includes(request.status))
      throw fail('Cannot cancel this leave request', 400);

    await app.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return reply.send(ok({ message: 'Leave request cancelled' }));
  });

  // GET /leaves/balance/:employeeId  (HR view — any employee's balance)
  app.get('/leaves/balance/:employeeId', auth, async (req, reply) => {
    const { employeeId } = req.params as { employeeId: string };
    const year = Number((req.query as Record<string, string>)['year'] ?? new Date().getFullYear());

    const balances = await app.prisma.leaveBalance.findMany({
      where: { organizationId: req.user.orgId, employeeId, year },
      include: { leaveType: { select: { name: true, code: true, colorHex: true } } },
    });

    return reply.send(ok(balances));
  });

  // ────────────────────────────────────────────────────────────
  // Leave balance management (HR)
  // ────────────────────────────────────────────────────────────

  // GET /leaves/balances  — all balances for org, grouped by employee
  app.get('/leaves/balances', auth, async (req, reply) => {
    const query = paginationSchema
      .extend({
        year: z.coerce.number().int().optional(),
        employeeId: z.string().uuid().optional(),
      })
      .parse(req.query);

    const year = query.year ?? new Date().getFullYear();

    const employees = await app.prisma.employee.findMany({
      where: {
        organizationId: req.user.orgId,
        deletedAt: null,
        status: 'ACTIVE',
        ...(query.employeeId && { id: query.employeeId }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        designation: true,
        leaveBalances: {
          where: { year },
          include: { leaveType: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { firstName: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const total = await app.prisma.employee.count({
      where: {
        organizationId: req.user.orgId,
        deletedAt: null,
        status: 'ACTIVE',
        ...(query.employeeId && { id: query.employeeId }),
      },
    });

    return reply.send(paginated(employees, query.page, query.limit, total));
  });

  // POST /leaves/balance/upsert  — set/create allocation for one employee+leaveType+year
  app.post('/leaves/balance/upsert', auth, async (req, reply) => {
    const input = z.object({
      employeeId:  z.string().uuid(),
      leaveTypeId: z.string().uuid(),
      year:        z.coerce.number().int(),
      allocated:   z.coerce.number().min(0),
    }).parse(req.body);

    const balance = await app.prisma.leaveBalance.upsert({
      where: {
        organizationId_employeeId_leaveTypeId_year: {
          organizationId: req.user.orgId,
          employeeId:     input.employeeId,
          leaveTypeId:    input.leaveTypeId,
          year:           input.year,
        },
      },
      update: { allocated: input.allocated },
      create: {
        organizationId: req.user.orgId,
        employeeId:     input.employeeId,
        leaveTypeId:    input.leaveTypeId,
        year:           input.year,
        allocated:      input.allocated,
      },
    });

    return reply.send(ok(balance));
  });

  // POST /leaves/balance/initialize  — bulk create balances for all active employees
  app.post('/leaves/balance/initialize', auth, async (req, reply) => {
    const { year } = z.object({ year: z.coerce.number().int() }).parse(req.body);

    const [employees, leaveTypes] = await app.prisma.$transaction([
      app.prisma.employee.findMany({
        where: { organizationId: req.user.orgId, deletedAt: null, status: 'ACTIVE' },
        select: { id: true },
      }),
      app.prisma.leaveType.findMany({
        where: { organizationId: req.user.orgId, isActive: true, deletedAt: null },
        select: { id: true, daysAllowed: true },
      }),
    ]);

    const data = employees.flatMap((emp) =>
      leaveTypes.map((lt) => ({
        organizationId: req.user.orgId,
        employeeId:     emp.id,
        leaveTypeId:    lt.id,
        year,
        allocated:      lt.daysAllowed,
      })),
    );

    const result = await app.prisma.leaveBalance.createMany({ data, skipDuplicates: true });

    return reply.send(ok({ created: result.count, total: data.length }));
  });
}
