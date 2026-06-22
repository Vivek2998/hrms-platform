import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated, fail } from '../../lib/response.js';
import { paginationArgs, paginationSchema } from '../../lib/pagination.js';
import { punchIn, punchOut } from './attendance.service.js';
import type { Prisma } from '@prisma/client';

// Mobile-compatible punch schemas: flat lat/lng instead of nested location
const punchInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  selfieUrl: z.string().url().optional(),
  punchMethod: z.enum(['FINGERPRINT', 'FACE_ID', 'MANUAL']).optional(),
});

const punchOutSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
});

const manualEditSchema = z.object({
  punchIn: z.string().datetime().optional(),
  punchOut: z.string().datetime().optional(),
  status: z
    .enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'WFH', 'ON_LEAVE', 'HOLIDAY'])
    .optional(),
  editReason: z.string().min(5),
});

const attendanceQuerySchema = paginationSchema.extend({
  employeeId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z
    .enum([
      'PRESENT',
      'ABSENT',
      'LATE',
      'HALF_DAY',
      'WFH',
      'ON_LEAVE',
      'HOLIDAY',
      'WEEKEND',
      'PENDING',
    ])
    .optional(),
});

const monthYearSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020),
});

export function attendanceRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /attendance/my  (mobile: employee's own records for a given month)
  app.get('/attendance/my', auth, async (req, reply) => {
    const now = new Date();
    const { month, year } = monthYearSchema.parse({
      month: (req.query as Record<string, string>)['month'] ?? now.getMonth() + 1,
      year: (req.query as Record<string, string>)['year'] ?? now.getFullYear(),
    });

    // QUALITY-02: Use UTC dates to match @db.Date storage in PostgreSQL
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const records = await app.prisma.attendanceRecord.findMany({
      where: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        date: { gte: from, lte: to },
      },
      orderBy: { date: 'asc' },
    });

    return reply.send(ok(records));
  });

  // GET /attendance  (admin/HR: all records with filters)
  app.get('/attendance', auth, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
      throw fail('Forbidden — only HR and Managers can view all attendance records', 403);
    }
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
        orderBy: { date: 'desc' },
      }),
      app.prisma.attendanceRecord.count({ where }),
    ]);

    return reply.send(paginated(records, query.page, query.limit, total));
  });

  // POST /attendance/punch-in  (mobile: flat latitude/longitude)
  app.post('/attendance/punch-in', auth, async (req, reply) => {
    const input = punchInSchema.parse(req.body);
    const record = await punchIn(
      {
        employeeId: req.user.sub,
        organizationId: req.user.orgId,
        location: {
          lat: input.latitude,
          lng: input.longitude,
          ...(input.accuracy !== undefined && { accuracy: input.accuracy }),
        },
        ...(input.selfieUrl !== undefined && { photoUrl: input.selfieUrl }),
        punchMethod: input.punchMethod,
      },
      app.prisma,
    );
    return reply.status(201).send(ok(record));
  });

  // POST /attendance/punch-out
  app.post('/attendance/punch-out', auth, async (req, reply) => {
    const input = punchOutSchema.parse(req.body);
    const record = await punchOut(
      {
        employeeId: req.user.sub,
        organizationId: req.user.orgId,
        location: {
          lat: input.latitude,
          lng: input.longitude,
          ...(input.accuracy !== undefined && { accuracy: input.accuracy }),
        },
      },
      app.prisma,
    );
    return reply.send(ok(record));
  });

  // PATCH /attendance/:id  (HR/Admin manual edit — role-restricted)
  app.patch('/attendance/:id', auth, async (req, reply) => {
    // SEC-04: Only HR, ORG_ADMIN, and SUPER_ADMIN may manually edit attendance.
    // A plain EMPLOYEE or MANAGER editing their own record = payroll fraud vector.
    const allowedRoles: string[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
    if (!allowedRoles.includes(req.user.role)) {
      throw fail('Forbidden — only HR can manually edit attendance records', 403);
    }

    const { id } = req.params as { id: string };
    const input = manualEditSchema.parse(req.body);

    const record = await app.prisma.attendanceRecord.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!record) throw fail('Attendance record not found', 404);

    const updated = await app.prisma.attendanceRecord.update({
      where: { id },
      data: {
        ...(input.punchIn  && { punchIn:  new Date(input.punchIn) }),
        ...(input.punchOut && { punchOut: new Date(input.punchOut) }),
        ...(input.status   && { status:   input.status }),
        isManuallyEdited: true,
        editReason: input.editReason,
        editedBy: req.user.sub,
      },
    });

    return reply.send(ok(updated));
  });

  // GET /attendance/geofence-config  (mobile: current employee's assigned office location)
  app.get('/attendance/geofence-config', auth, async (req, reply) => {
    const employee = await app.prisma.employee.findFirst({
      where: { id: req.user.sub, organizationId: req.user.orgId },
      include: {
        officeLocation: {
          select: { id: true, name: true, latitude: true, longitude: true, radiusMeters: true, isActive: true },
        },
      },
    });
    if (!employee) throw fail('Employee not found', 404);
    return reply.send(
      ok({
        officeLocation:
          employee.officeLocation?.isActive ? {
            id: employee.officeLocation.id,
            name: employee.officeLocation.name,
            latitude: employee.officeLocation.latitude,
            longitude: employee.officeLocation.longitude,
            radiusMeters: employee.officeLocation.radiusMeters,
          }
          : null,
      }),
    );
  });

  // GET /attendance/summary/:employeeId  (monthly summary for dashboards)
  app.get('/attendance/summary/:employeeId', auth, async (req, reply) => {
    const { employeeId } = req.params as { employeeId: string };

    // SEC-05 IDOR fix: employees may only view their own summary.
    // HR / Admin / Manager can view anyone in the org.
    const canViewOthers = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(req.user.role);
    if (!canViewOthers && req.user.sub !== employeeId) {
      throw fail('Forbidden — you can only view your own attendance summary', 403);
    }

    const { month, year } = z
      .object({
        month: z.coerce.number().int().min(1).max(12),
        year: z.coerce.number().int().min(2020),
      })
      .parse(req.query);

    // QUALITY-02: Use UTC dates to match @db.Date storage in PostgreSQL
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const records = await app.prisma.attendanceRecord.findMany({
      where: {
        organizationId: req.user.orgId,
        employeeId,
        date: { gte: from, lte: to },
      },
    });

    return reply.send(
      ok({
        present: records.filter((r) => r.status === 'PRESENT').length,
        absent: records.filter((r) => r.status === 'ABSENT').length,
        late: records.filter((r) => r.status === 'LATE').length,
        halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
        wfh: records.filter((r) => r.status === 'WFH').length,
        onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
        totalWorkingMinutes: records.reduce((s, r) => s + r.workingMinutes, 0),
        totalOvertimeMinutes: records.reduce((s, r) => s + r.overtimeMinutes, 0),
        totalLateMinutes: records.reduce((s, r) => s + r.lateMinutes, 0),
      }),
    );
  });
}
