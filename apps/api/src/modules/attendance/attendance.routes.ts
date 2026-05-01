import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ok, paginated, fail } from "../../lib/response.js";
import { paginationArgs, paginationSchema } from "../../lib/pagination.js";
import { punchIn, punchOut } from "./attendance.service.js";
import type { Prisma } from "@prisma/client";

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  address: z.string().optional(),
});

const punchInSchema = z.object({
  location: locationSchema.optional(),
  photoUrl: z.string().url().optional(),
});

const punchOutSchema = z.object({
  location: locationSchema.optional(),
});

const manualEditSchema = z.object({
  punchIn: z.string().datetime().optional(),
  punchOut: z.string().datetime().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "WFH", "ON_LEAVE", "HOLIDAY"]).optional(),
  editReason: z.string().min(5),
});

const attendanceQuerySchema = paginationSchema.extend({
  employeeId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "WFH", "ON_LEAVE", "HOLIDAY", "WEEKEND", "PENDING"]).optional(),
});

export async function attendanceRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /attendance
  app.get("/attendance", auth, async (req, reply) => {
    const query = attendanceQuerySchema.parse(req.query);
    const where: Prisma.AttendanceRecordWhereInput = {
      organizationId: req.user.orgId,
      ...(query.employeeId && { employeeId: query.employeeId }),
      ...(query.status && { status: query.status }),
      ...((query.from ?? query.to) && {
        date: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
    };

    const [records, total] = await app.prisma.$transaction([
      app.prisma.attendanceRecord.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
        ...paginationArgs(query),
        orderBy: { date: "desc" },
      }),
      app.prisma.attendanceRecord.count({ where }),
    ]);

    return reply.send(paginated(records, query.page, query.limit, total));
  });

  // POST /attendance/punch-in  (employee punches in for today)
  app.post("/attendance/punch-in", auth, async (req, reply) => {
    const input = punchInSchema.parse(req.body);
    const record = await punchIn(
      { ...input, employeeId: req.user.sub, organizationId: req.user.orgId },
      app.prisma,
    );
    return reply.status(201).send(ok(record));
  });

  // POST /attendance/punch-out
  app.post("/attendance/punch-out", auth, async (req, reply) => {
    const input = punchOutSchema.parse(req.body);
    const record = await punchOut(
      { ...input, employeeId: req.user.sub, organizationId: req.user.orgId },
      app.prisma,
    );
    return reply.send(ok(record));
  });

  // PATCH /attendance/:id  (HR manual edit)
  app.patch("/attendance/:id", auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = manualEditSchema.parse(req.body);

    const record = await app.prisma.attendanceRecord.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!record) throw fail("Attendance record not found", 404);

    const updated = await app.prisma.attendanceRecord.update({
      where: { id },
      data: {
        ...(input.punchIn && { punchIn: new Date(input.punchIn) }),
        ...(input.punchOut && { punchOut: new Date(input.punchOut) }),
        ...(input.status && { status: input.status }),
        isManuallyEdited: true,
        editReason: input.editReason,
        editedBy: req.user.sub,
      },
    });

    return reply.send(ok(updated));
  });

  // GET /attendance/summary/:employeeId
  app.get("/attendance/summary/:employeeId", auth, async (req, reply) => {
    const { employeeId } = req.params as { employeeId: string };
    const { month, year } = z
      .object({
        month: z.coerce.number().int().min(1).max(12),
        year: z.coerce.number().int().min(2020),
      })
      .parse(req.query);

    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0); // last day of month

    const records = await app.prisma.attendanceRecord.findMany({
      where: {
        organizationId: req.user.orgId,
        employeeId,
        date: { gte: from, lte: to },
      },
    });

    const summary = {
      present: records.filter((r) => r.status === "PRESENT").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      halfDay: records.filter((r) => r.status === "HALF_DAY").length,
      wfh: records.filter((r) => r.status === "WFH").length,
      onLeave: records.filter((r) => r.status === "ON_LEAVE").length,
      totalWorkingMinutes: records.reduce((s, r) => s + r.workingMinutes, 0),
      totalOvertimeMinutes: records.reduce((s, r) => s + r.overtimeMinutes, 0),
      totalLateMinutes: records.reduce((s, r) => s + r.lateMinutes, 0),
    };

    return reply.send(ok(summary));
  });
}
