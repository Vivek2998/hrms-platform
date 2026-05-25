import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';
import type { Prisma } from '@prisma/client';
import { sendEmail, leaveDecisionEmail } from '../../lib/email.js';

// ─── Input schemas ───────────────────────────────────────────────────────────

// Mobile sends startDate/endDate as plain date strings (YYYY-MM-DD)
const applyLeaveBehalfSchema = z.object({
  employeeId:    z.string().uuid(),
  leaveTypeId:   z.string().uuid(),
  startDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  endDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  reason:        z.string().min(3).max(500),
  session:       z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  attachmentUrl: z.string().url().optional(),
});

const applyLeaveSchema = z.object({
  leaveTypeId:   z.string().uuid(),
  startDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  endDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  reason:        z.string().min(3).max(500),
  session:       z.enum(['FIRST_HALF', 'SECOND_HALF']).optional(),
  attachmentUrl: z.string().url().optional(),
});

const approveLeaveSchema = z.object({
  action:  z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

const leaveTypeBodySchema = z.object({
  name:                z.string().min(1).max(100),
  code:                z.string().min(1).max(20),
  daysAllowed:         z.coerce.number().int().min(0),
  isPaid:              z.boolean().default(true),
  isCarryForward:      z.boolean().default(false),
  maxCarryForward:     z.coerce.number().int().min(0).default(0),
  isEncashable:        z.boolean().default(false),
  applicableAfterDays: z.coerce.number().int().min(0).default(0),
  colorHex:            z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

// ─── Helper: calculate working days excluding weekends + public holidays ─────
// MINOR-04 fix: an employee applying Mon–Sun should be charged 5 days, not 7.
async function calcWorkingDays(
  prisma: FastifyInstance['prisma'],
  orgId: string,
  from: Date,
  to: Date,
): Promise<number> {
  // Fetch public holidays for this org in the range
  const holidays = await prisma.holiday.findMany({
    where: {
      organizationId: orgId,
      date: { gte: from, lte: to },
    },
    select: { date: true },
  });
  const holidayTimestamps = new Set(
    holidays.map((h) => h.date.toISOString().slice(0, 10)),
  );

  let working = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    const dayOfWeek = cursor.getUTCDay(); // 0=Sun, 6=Sat
    const dateStr   = cursor.toISOString().slice(0, 10);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayTimestamps.has(dateStr);
    if (!isWeekend && !isHoliday) working++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return working;
}

export function leaveRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ─── Leave type management ───────────────────────────────────────────────

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
      data: { organizationId: req.user.orgId, ...input, code: input.code.toUpperCase() },
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

  // ─── Mobile employee endpoints (must be before /leaves/:id) ─────────────

  // GET /leaves/my  (current employee's leave history, mobile-field-mapped)
  app.get('/leaves/my', auth, async (req, reply) => {
    const leaves = await app.prisma.leaveRequest.findMany({
      where: { organizationId: req.user.orgId, employeeId: req.user.sub, deletedAt: null },
      include: {
        leaveType: { select: { name: true, code: true } },
        approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(
      ok(
        leaves.map((l) => ({
          id:             l.id,
          employeeId:     l.employeeId,
          organizationId: l.organizationId,
          leaveType:      { name: l.leaveType.name, code: l.leaveType.code },
          startDate:      l.fromDate,
          endDate:        l.toDate,
          totalDays:      l.totalDays,
          status:         l.status,
          reason:         l.reason,
          remarks:        l.approvals[0]?.remarks ?? null,
          appliedAt:      l.createdAt,
        })),
      ),
    );
  });

  // GET /leaves/my/balance  (current employee's leave balances)
  app.get('/leaves/my/balance', auth, async (req, reply) => {
    const year = Number(
      (req.query as Record<string, string>)['year'] ?? new Date().getFullYear(),
    );

    const balances = await app.prisma.leaveBalance.findMany({
      where: { organizationId: req.user.orgId, employeeId: req.user.sub, year },
      include: { leaveType: { select: { name: true, code: true } } },
    });

    return reply.send(
      ok(
        balances.map((b) => ({
          leaveTypeId:   b.leaveTypeId,
          leaveType:     { name: b.leaveType.name, code: b.leaveType.code },
          totalDays:     b.allocated,
          usedDays:      b.used,
          pendingDays:   b.pending,
          remainingDays: Math.max(0, b.allocated - b.used - b.pending),
        })),
      ),
    );
  });

  // ─── Shared leave request endpoints ─────────────────────────────────────

  // GET /leaves  (paginated — employees see own; HR/Admin see all)
  app.get('/leaves', auth, async (req, reply) => {
    const query = paginationSchema
      .extend({
        status:     z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN']).optional(),
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
          employee:  { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          leaveType: { select: { id: true, name: true, code: true } },
          approvals: {
            include: { approver: { select: { id: true, firstName: true, lastName: true } } },
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

  // POST /leaves  (apply for leave)
  app.post('/leaves', auth, async (req, reply) => {
    const input = applyLeaveSchema.parse(req.body);

    const from = new Date(input.startDate + 'T00:00:00.000Z');
    const to   = new Date(input.endDate   + 'T00:00:00.000Z');

    if (to < from) throw fail('End date cannot be before start date', 400);
    if (input.session && from.getTime() !== to.getTime()) {
      throw fail('Half-day session requires start and end date to be the same', 400);
    }

    // BUG-02: Validate the leave type exists
    const leaveType = await app.prisma.leaveType.findFirst({
      where: { id: input.leaveTypeId, organizationId: req.user.orgId, isActive: true },
    });
    if (!leaveType) throw fail('Leave type not found or inactive', 404);

    // MINOR-04: Calculate working days, excluding weekends and public holidays
    const totalDays = input.session
      ? 0.5
      : await calcWorkingDays(app.prisma, req.user.orgId, from, to);

    if (totalDays <= 0) {
      throw fail('The selected date range contains no working days', 400);
    }

    // BUG-02: Check sufficient balance for paid leave types
    if (leaveType.isPaid) {
      const balance = await app.prisma.leaveBalance.findFirst({
        where: {
          organizationId: req.user.orgId,
          employeeId:     req.user.sub,
          leaveTypeId:    input.leaveTypeId,
          year:           from.getUTCFullYear(),
        },
      });
      const remaining = balance
        ? Math.max(0, balance.allocated - balance.used - balance.pending)
        : 0;
      if (totalDays > remaining) {
        throw fail(
          `Insufficient leave balance. Requested: ${totalDays} day(s), Available: ${remaining} day(s)`,
          400,
        );
      }
    }

    // BUG-03: Reject overlapping PENDING or APPROVED requests
    const overlapping = await app.prisma.leaveRequest.findFirst({
      where: {
        organizationId: req.user.orgId,
        employeeId:     req.user.sub,
        status:         { in: ['PENDING', 'APPROVED'] },
        deletedAt:      null,
        AND: [{ fromDate: { lte: to } }, { toDate: { gte: from } }],
      },
    });
    if (overlapping) {
      throw fail(
        `You already have a ${overlapping.status.toLowerCase()} leave request overlapping these dates`,
        409,
      );
    }

    // Create the request and immediately update the pending balance (BUG-01)
    const request = await app.prisma.$transaction(async (tx) => {
      const created = await tx.leaveRequest.create({
        data: {
          organizationId: req.user.orgId,
          employeeId:     req.user.sub,
          leaveTypeId:    input.leaveTypeId,
          fromDate:       from,
          toDate:         to,
          totalDays,
          reason:         input.reason,
          ...(input.session      !== undefined && { session:       input.session }),
          ...(input.attachmentUrl !== undefined && { attachmentUrl: input.attachmentUrl }),
        },
      });

      // BUG-01 (part 1): Increment pending balance so remaining days decreases immediately
      if (leaveType.isPaid) {
        await tx.leaveBalance.updateMany({
          where: {
            organizationId: req.user.orgId,
            employeeId:     req.user.sub,
            leaveTypeId:    input.leaveTypeId,
            year:           from.getUTCFullYear(),
          },
          data: { pending: { increment: totalDays } },
        });
      }

      return created;
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
        employee:  { select: { id: true, firstName: true, workEmail: true } },
        leaveType: { select: { isPaid: true } },
      },
    });

    if (!request) throw fail('Leave request not found', 404);
    if (request.status !== 'PENDING') throw fail('Only pending requests can be actioned', 400);

    // BUG-01 (part 2): Update balance atomically inside the same transaction
    await app.prisma.$transaction([
      app.prisma.leaveRequest.update({
        where: { id },
        data: { status: input.action },
      }),
      app.prisma.leaveApproval.create({
        data: {
          organizationId: req.user.orgId,
          leaveRequestId: id,
          approverId:     req.user.sub,
          action:         input.action,
          ...(input.remarks !== undefined && { remarks: input.remarks }),
        },
      }),
      app.prisma.notification.create({
        data: {
          organizationId: req.user.orgId,
          employeeId:     request.employee.id,
          type:  input.action === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
          title: `Leave ${input.action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
          body:  `Your leave from ${request.fromDate.toISOString().slice(0, 10)} to ${request.toDate.toISOString().slice(0, 10)} has been ${input.action.toLowerCase()}.`,
        },
      }),
      // BUG-01: Move pending → used on APPROVED; free pending on REJECTED
      ...(request.leaveType.isPaid
        ? [
            app.prisma.leaveBalance.updateMany({
              where: {
                organizationId: req.user.orgId,
                employeeId:     request.employeeId,
                leaveTypeId:    request.leaveTypeId,
                year:           request.fromDate.getUTCFullYear(),
              },
              data:
                input.action === 'APPROVED'
                  ? { used: { increment: request.totalDays }, pending: { decrement: request.totalDays } }
                  : { pending: { decrement: request.totalDays } },
            }),
          ]
        : []),
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

  // PATCH /leaves/:id/cancel  (employee cancels own PENDING or APPROVED request)
  app.patch('/leaves/:id/cancel', auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const request = await app.prisma.leaveRequest.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub },
      include: { leaveType: { select: { isPaid: true } } },
    });

    if (!request) throw fail('Leave request not found', 404);
    if (!['PENDING', 'APPROVED'].includes(request.status)) {
      throw fail('Cannot cancel this leave request', 400);
    }

    // BUG-07: Reverse balance based on the current state of the request
    await app.prisma.$transaction([
      app.prisma.leaveRequest.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      // If it was APPROVED → decrement `used`; if PENDING → decrement `pending`
      ...(request.leaveType.isPaid
        ? [
            app.prisma.leaveBalance.updateMany({
              where: {
                organizationId: req.user.orgId,
                employeeId:     request.employeeId,
                leaveTypeId:    request.leaveTypeId,
                year:           request.fromDate.getUTCFullYear(),
              },
              data:
                request.status === 'APPROVED'
                  ? { used:    { decrement: request.totalDays } }
                  : { pending: { decrement: request.totalDays } },
            }),
          ]
        : []),
    ]);

    return reply.send(ok({ message: 'Leave request cancelled' }));
  });

  // PATCH /leaves/:id/withdraw  (employee withdraws an APPROVED leave — MINOR-03)
  // Distinction from cancel: withdraw is a formal pull-back of an already-approved leave
  // after the approver has acted; cancel works on PENDING or APPROVED.
  app.patch('/leaves/:id/withdraw', auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const request = await app.prisma.leaveRequest.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub },
      include: { leaveType: { select: { isPaid: true } } },
    });

    if (!request) throw fail('Leave request not found', 404);
    if (request.status !== 'APPROVED') {
      throw fail('Only approved leave requests can be withdrawn — use cancel for pending requests', 400);
    }

    await app.prisma.$transaction([
      app.prisma.leaveRequest.update({
        where: { id },
        data: { status: 'WITHDRAWN' },
      }),
      // Reverse the used balance since the leave is being pulled back
      ...(request.leaveType.isPaid
        ? [
            app.prisma.leaveBalance.updateMany({
              where: {
                organizationId: req.user.orgId,
                employeeId:     request.employeeId,
                leaveTypeId:    request.leaveTypeId,
                year:           request.fromDate.getUTCFullYear(),
              },
              data: { used: { decrement: request.totalDays } },
            }),
          ]
        : []),
    ]);

    return reply.send(ok({ message: 'Leave request withdrawn' }));
  });

  // POST /leaves/behalf  (manager/HR applies leave on behalf of an employee)
  app.post('/leaves/behalf', auth, async (req, reply) => {
    const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];
    if (!allowedRoles.includes(req.user.role)) throw fail('Forbidden', 403);

    const input = applyLeaveBehalfSchema.parse(req.body);
    const from  = new Date(input.startDate + 'T00:00:00.000Z');
    const to    = new Date(input.endDate   + 'T00:00:00.000Z');

    if (to < from) throw fail('End date cannot be before start date', 400);
    if (input.session && from.getTime() !== to.getTime()) {
      throw fail('Half-day session requires start and end date to be the same', 400);
    }

    // BUG-08: Managers may only act on their direct reports
    if (req.user.role === 'MANAGER') {
      const isDirectReport = await app.prisma.employee.findFirst({
        where: {
          id:             input.employeeId,
          managerId:      req.user.sub,
          organizationId: req.user.orgId,
          deletedAt:      null,
        },
      });
      if (!isDirectReport) {
        throw fail('Forbidden — managers can only act on behalf of their direct reports', 403);
      }
    }

    const employee = await app.prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId: req.user.orgId, deletedAt: null },
    });
    if (!employee) throw fail('Employee not found', 404);

    const leaveType = await app.prisma.leaveType.findFirst({
      where: { id: input.leaveTypeId, organizationId: req.user.orgId, isActive: true },
    });
    if (!leaveType) throw fail('Leave type not found or inactive', 404);

    // MINOR-04: Exclude weekends + holidays
    const totalDays = input.session
      ? 0.5
      : await calcWorkingDays(app.prisma, req.user.orgId, from, to);

    if (totalDays <= 0) {
      throw fail('The selected date range contains no working days', 400);
    }

    // Create request and update pending balance in one transaction
    const request = await app.prisma.$transaction(async (tx) => {
      const created = await tx.leaveRequest.create({
        data: {
          organizationId: req.user.orgId,
          employeeId:     input.employeeId,
          leaveTypeId:    input.leaveTypeId,
          fromDate:       from,
          toDate:         to,
          totalDays,
          reason:         input.reason,
          ...(input.session       !== undefined && { session:       input.session }),
          ...(input.attachmentUrl !== undefined && { attachmentUrl: input.attachmentUrl }),
        },
      });

      if (leaveType.isPaid) {
        await tx.leaveBalance.updateMany({
          where: {
            organizationId: req.user.orgId,
            employeeId:     input.employeeId,
            leaveTypeId:    input.leaveTypeId,
            year:           from.getUTCFullYear(),
          },
          data: { pending: { increment: totalDays } },
        });
      }

      return created;
    });

    await app.prisma.notification.create({
      data: {
        organizationId: req.user.orgId,
        employeeId:     input.employeeId,
        type:           'LEAVE_APPLIED',
        title:          'Leave Applied on Your Behalf',
        body:           `A leave request was applied for you from ${input.startDate} to ${input.endDate}.`,
      },
    });

    return reply.status(201).send(ok(request));
  });

  // GET /leaves/balance/:employeeId  (HR view — any employee's balance)
  app.get('/leaves/balance/:employeeId', auth, async (req, reply) => {
    const { employeeId } = req.params as { employeeId: string };

    // SEC-05 IDOR fix: employees may only view their own balance
    const canViewOthers = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(req.user.role);
    if (!canViewOthers && req.user.sub !== employeeId) {
      throw fail('Forbidden — you can only view your own leave balance', 403);
    }

    const year = Number(
      (req.query as Record<string, string>)['year'] ?? new Date().getFullYear(),
    );

    const balances = await app.prisma.leaveBalance.findMany({
      where: { organizationId: req.user.orgId, employeeId, year },
      include: { leaveType: { select: { name: true, code: true, colorHex: true } } },
    });

    return reply.send(ok(balances));
  });

  // ─── Leave balance management (HR) ──────────────────────────────────────

  // GET /leaves/balances  — all balances for org, grouped by employee
  app.get('/leaves/balances', auth, async (req, reply) => {
    const query = paginationSchema
      .extend({
        year:       z.coerce.number().int().optional(),
        employeeId: z.string().uuid().optional(),
      })
      .parse(req.query);

    const year = query.year ?? new Date().getFullYear();
    const orgFilter = {
      organizationId: req.user.orgId,
      deletedAt: null,
      status: 'ACTIVE' as const,
      ...(query.employeeId && { id: query.employeeId }),
    };

    const [employees, total] = await app.prisma.$transaction([
      app.prisma.employee.findMany({
        where: orgFilter,
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
      }),
      app.prisma.employee.count({ where: orgFilter }),
    ]);

    return reply.send(paginated(employees, query.page, query.limit, total));
  });

  // POST /leaves/balance/upsert  — set allocation for one employee+leaveType+year
  app.post('/leaves/balance/upsert', auth, async (req, reply) => {
    const input = z
      .object({
        employeeId:  z.string().uuid(),
        leaveTypeId: z.string().uuid(),
        year:        z.coerce.number().int(),
        allocated:   z.coerce.number().min(0),
      })
      .parse(req.body);

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

  // POST /leaves/balance/carry-forward  — copy unused balance to next year
  app.post('/leaves/balance/carry-forward', auth, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role)) {
      throw fail('Forbidden', 403);
    }

    const { fromYear, toYear } = z
      .object({ fromYear: z.coerce.number().int(), toYear: z.coerce.number().int() })
      .refine((d) => d.toYear === d.fromYear + 1, { message: 'toYear must be fromYear + 1' })
      .parse(req.body);

    const leaveTypes = await app.prisma.leaveType.findMany({
      where: {
        organizationId: req.user.orgId,
        isCarryForward: true,
        isActive: true,
        deletedAt: null,
      },
    });

    if (leaveTypes.length === 0) {
      return reply.send(ok({ records: 0, totalDaysCarried: 0, message: 'No carry-forward leave types configured' }));
    }

    const fromBalances = await app.prisma.leaveBalance.findMany({
      where: {
        organizationId: req.user.orgId,
        year:           fromYear,
        leaveTypeId:    { in: leaveTypes.map((lt) => lt.id) },
      },
    });

    // MINOR-02: Track both record count AND actual days carried
    let records = 0;
    let totalDaysCarried = 0;

    // Batch all upserts in a single transaction for performance
    await app.prisma.$transaction(
      fromBalances.flatMap((balance) => {
        const leaveType = leaveTypes.find((lt) => lt.id === balance.leaveTypeId);
        if (!leaveType) return [];

        const remaining = Math.max(0, balance.allocated - balance.used - balance.pending);
        const carryDays = Math.min(remaining, leaveType.maxCarryForward);
        if (carryDays === 0) return [];

        records++;
        totalDaysCarried += carryDays;

        return [
          app.prisma.leaveBalance.upsert({
            where: {
              organizationId_employeeId_leaveTypeId_year: {
                organizationId: req.user.orgId,
                employeeId:     balance.employeeId,
                leaveTypeId:    balance.leaveTypeId,
                year:           toYear,
              },
            },
            // Add carry days on top of existing allocation
            update: { allocated: { increment: carryDays } },
            create: {
              organizationId: req.user.orgId,
              employeeId:     balance.employeeId,
              leaveTypeId:    balance.leaveTypeId,
              year:           toYear,
              allocated:      leaveType.daysAllowed + carryDays,
            },
          }),
        ];
      }),
    );

    return reply.send(
      ok({
        records,
        totalDaysCarried,
        message: `Carried forward ${totalDaysCarried} day(s) across ${records} employee-leave combinations`,
      }),
    );
  });
}
