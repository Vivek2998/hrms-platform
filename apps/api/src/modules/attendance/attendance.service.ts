import type { PrismaClient } from '@prisma/client';
import { fail } from '../../lib/response.js';
import { resolveShiftTimes } from '@hrms/shared-utils';

interface PunchInInput {
  employeeId: string;
  organizationId: string;
  location?: { lat: number; lng: number; accuracy?: number; address?: string };
  photoUrl?: string;
}

interface PunchOutInput {
  employeeId: string;
  organizationId: string;
  location?: { lat: number; lng: number; accuracy?: number; address?: string };
}

export async function punchIn(input: PunchInInput, prisma: PrismaClient) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      organizationId_employeeId_date: {
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        date: today,
      },
    },
  });

  if (existing?.punchIn) throw fail('Already punched in for today', 409);

  const now = new Date();

  // Find active shift assignment
  const assignment = await prisma.shiftAssignment.findFirst({
    where: {
      employeeId: input.employeeId,
      effectiveFrom: { lte: today },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: today } }],
    },
    include: { shift: true },
    orderBy: { effectiveFrom: 'desc' },
  });

  let status: 'PRESENT' | 'LATE' = 'PRESENT';
  let lateMinutes = 0;

  if (assignment) {
    const { start } = resolveShiftTimes(
      today,
      assignment.shift.startTime,
      assignment.shift.endTime,
    );
    const graceEnd = new Date(start.getTime() + assignment.shift.graceMinutes * 60_000);
    if (now > graceEnd) {
      status = 'LATE';
      lateMinutes = Math.floor((now.getTime() - start.getTime()) / 60_000);
    }
  }

  const record = await prisma.attendanceRecord.upsert({
    where: {
      organizationId_employeeId_date: {
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        date: today,
      },
    },
    update: {
      punchIn: now,
      status,
      lateMinutes,
      punchInLocation: input.location ?? undefined,
      punchInPhoto: input.photoUrl,
      shiftId: assignment?.shiftId,
    },
    create: {
      organizationId: input.organizationId,
      employeeId: input.employeeId,
      date: today,
      punchIn: now,
      status,
      lateMinutes,
      punchInLocation: input.location ?? undefined,
      punchInPhoto: input.photoUrl,
      shiftId: assignment?.shiftId,
    },
  });

  return record;
}

export async function punchOut(input: PunchOutInput, prisma: PrismaClient) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      organizationId_employeeId_date: {
        organizationId: input.organizationId,
        employeeId: input.employeeId,
        date: today,
      },
    },
    include: { shift: true },
  });

  if (!record?.punchIn) throw fail('No punch-in found for today', 400);
  if (record.punchOut) throw fail('Already punched out for today', 409);

  const now = new Date();
  const workingMinutes = Math.floor((now.getTime() - record.punchIn.getTime()) / 60_000);

  let overtimeMinutes = 0;
  if (record.shift) {
    const expectedMinutes = record.shift.absentAfterMinutes - record.shift.breakDurationMinutes;
    overtimeMinutes = Math.max(0, workingMinutes - expectedMinutes);
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      punchOut: now,
      workingMinutes,
      overtimeMinutes,
      punchOutLocation: input.location ?? undefined,
    },
  });

  return updated;
}
