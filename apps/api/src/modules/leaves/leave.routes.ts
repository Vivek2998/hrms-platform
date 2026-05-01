import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ok, paginated, fail } from "../../lib/response.js";
import { paginationArgs, paginationSchema } from "../../lib/pagination.js";
import type { Prisma } from "@prisma/client";

const applyLeaveSchema = z.object({
  leaveTypeId: z.string().uuid(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  reason: z.string().min(10).max(500),
  attachmentUrl: z.string().url().optional(),
});

const approveLeaveSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED"]),
  remarks: z.string().optional(),
});

export async function leaveRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /leave-types
  app.get("/leave-types", auth, async (req, reply) => {
    const leaveTypes = await app.prisma.leaveType.findMany({
      where: { organizationId: req.user.orgId, isActive: true, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return reply.send(ok(leaveTypes));
  });

  // GET /leaves  (list leave requests)
  app.get("/leaves", auth, async (req, reply) => {
    const query = paginationSchema.extend({
      status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
      employeeId: z.string().uuid().optional(),
    }).parse(req.query);

    const where: Prisma.LeaveRequestWhereInput = {
      organizationId: req.user.orgId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.employeeId
        ? { employeeId: query.employeeId }
        : req.user.role === "EMPLOYEE"
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
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        ...paginationArgs(query),
        orderBy: { createdAt: "desc" },
      }),
      app.prisma.leaveRequest.count({ where }),
    ]);

    return reply.send(paginated(requests, query.page, query.limit, total));
  });

  // POST /leaves  (apply for leave)
  app.post("/leaves", auth, async (req, reply) => {
    const input = applyLeaveSchema.parse(req.body);

    const from = new Date(input.fromDate);
    const to = new Date(input.toDate);

    if (to < from) throw fail("To date cannot be before from date", 400);

    // Simple business day count (weekends not counted — real impl uses holidays)
    const msPerDay = 86_400_000;
    const totalDays =
      Math.floor((to.getTime() - from.getTime()) / msPerDay) + 1;

    const request = await app.prisma.leaveRequest.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        leaveTypeId: input.leaveTypeId,
        fromDate: from,
        toDate: to,
        totalDays,
        reason: input.reason,
        attachmentUrl: input.attachmentUrl,
      },
    });

    return reply.status(201).send(ok(request));
  });

  // PATCH /leaves/:id/approve  (manager/HR approve or reject)
  app.patch("/leaves/:id/approve", auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = approveLeaveSchema.parse(req.body);

    const request = await app.prisma.leaveRequest.findFirst({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
    });

    if (!request) throw fail("Leave request not found", 404);
    if (request.status !== "PENDING") throw fail("Only pending requests can be actioned", 400);

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
          remarks: input.remarks,
        },
      }),
    ]);

    return reply.send(ok({ message: `Leave request ${input.action.toLowerCase()}` }));
  });

  // PATCH /leaves/:id/cancel  (employee cancels own request)
  app.patch("/leaves/:id/cancel", auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const request = await app.prisma.leaveRequest.findFirst({
      where: { id, organizationId: req.user.orgId, employeeId: req.user.sub },
    });

    if (!request) throw fail("Leave request not found", 404);
    if (!["PENDING", "APPROVED"].includes(request.status))
      throw fail("Cannot cancel this leave request", 400);

    await app.prisma.leaveRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return reply.send(ok({ message: "Leave request cancelled" }));
  });

  // GET /leaves/balance/:employeeId
  app.get("/leaves/balance/:employeeId", auth, async (req, reply) => {
    const { employeeId } = req.params as { employeeId: string };
    const year = Number(
      (req.query as Record<string, string>)["year"] ?? new Date().getFullYear(),
    );

    const balances = await app.prisma.leaveBalance.findMany({
      where: { organizationId: req.user.orgId, employeeId, year },
      include: { leaveType: { select: { name: true, code: true, colorHex: true } } },
    });

    return reply.send(ok(balances));
  });
}
