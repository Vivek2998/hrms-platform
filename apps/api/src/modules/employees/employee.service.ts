import bcrypt from 'bcryptjs';
import type { PrismaClient, Prisma } from '@prisma/client';
import { fail, paginated } from '../../lib/response.js';
import { paginationArgs } from '../../lib/pagination.js';
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeListQuery,
} from './employee.schema.js';

const EMPLOYEE_SELECT = {
  id: true,
  organizationId: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  displayName: true,
  workEmail: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  employmentType: true,
  designation: true,
  designationId: true,
  previousEmployeeCode: true,
  departmentId: true,
  teamId: true,
  managerId: true,
  avatarUrl: true,
  dateOfBirth: true,
  gender: true,
  bloodGroup: true,
  maritalStatus: true,
  presentAddress: true,
  permanentAddress: true,
  emergencyContact: true,
  educationDetails: true,
  experienceDetails: true,
  panNumber: true,
  aadhaarNumber: true,
  pfAccountNumber: true,
  esiNumber: true,
  uanNumber: true,
  bankAccountNumber: true,
  bankIfsc: true,
  bankName: true,
  bankBranch: true,
  dateOfJoining: true,
  dateOfConfirmation: true,
  noticePeriodDays: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
  officeLocationId: true,
  officeLocation: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeSelect;

// Redacted select for MANAGER role — omits PII and financial fields
const EMPLOYEE_SELECT_REDACTED = {
  id: true,
  organizationId: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  displayName: true,
  workEmail: true,
  phone: true,
  role: true,
  status: true,
  employmentType: true,
  designation: true,
  designationId: true,
  previousEmployeeCode: true,
  departmentId: true,
  teamId: true,
  managerId: true,
  avatarUrl: true,
  dateOfJoining: true,
  dateOfConfirmation: true,
  noticePeriodDays: true,
  createdAt: true,
  updatedAt: true,
  department: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
  officeLocationId: true,
  officeLocation: { select: { id: true, name: true } },
} satisfies Prisma.EmployeeSelect;

// BUG-06 FIX: Atomic employee code generation.
//
// Old approach: count employees, add 1 → race condition when two requests
// arrive simultaneously (both read N, both try to claim EMP{N+1}).
//
// New approach: DB-level atomic increment on Organization.employeeSequence.
// The UPDATE is serialised by the row lock so concurrent requests always
// get different sequence numbers — no duplicates possible.
//
// Format: {employeeCodePrefix}-{sequence}  e.g. SSI-1, SSI-473, TCS-1001
// The prefix is set per-organisation at registration time (or auto-derived
// from the org name).  No zero-padding — real companies don't use EMP0001.
async function generateEmployeeCode(prisma: PrismaClient, organizationId: string): Promise<string> {
  const { employeeSequence, employeeCodePrefix } = await prisma.organization.update({
    where: { id: organizationId },
    data:   { employeeSequence: { increment: 1 } },
    select: { employeeSequence: true, employeeCodePrefix: true },
  });
  return `${employeeCodePrefix}-${employeeSequence}`;
}

export async function listEmployees(orgId: string, query: EmployeeListQuery, prisma: PrismaClient, role?: string) {
  const selectFields = role === 'MANAGER' ? EMPLOYEE_SELECT_REDACTED : EMPLOYEE_SELECT;

  const where: Prisma.EmployeeWhereInput = {
    organizationId: orgId,
    deletedAt: null,
    ...(query.status && { status: query.status }),
    ...(query.departmentId && { departmentId: query.departmentId }),
    ...(query.employmentType && { employmentType: query.employmentType }),
    ...(query.search && {
      OR: [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { workEmail: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [employees, total] = await prisma.$transaction([
    prisma.employee.findMany({
      where,
      select: selectFields,
      ...paginationArgs(query),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.count({ where }),
  ]);

  return paginated(employees, query.page, query.limit, total);
}

export async function getEmployee(id: string, orgId: string, prisma: PrismaClient, role?: string) {
  const selectFields = role === 'MANAGER' ? EMPLOYEE_SELECT_REDACTED : EMPLOYEE_SELECT;
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    select: selectFields,
  });
  if (!employee) throw fail('Employee not found', 404);
  return employee;
}

export async function createEmployee(
  orgId: string,
  input: CreateEmployeeInput,
  prisma: PrismaClient,
) {
  const existing = await prisma.employee.findFirst({
    where: { organizationId: orgId, workEmail: input.workEmail, deletedAt: null },
  });
  if (existing) throw fail('An employee with this work email already exists', 409);

  const employeeCode = await generateEmployeeCode(prisma, orgId);
  const passwordHash = await bcrypt.hash(input.password, 12);

  const { password: _, ...rest } = input;
  void _;

  const employee = await prisma.$transaction(async (tx) => {
    const created = await tx.employee.create({
      data: {
        ...rest,
        organizationId: orgId,
        employeeCode,
        passwordHash,
        // MINOR-06 FIX: populate displayName automatically so every employee
        // has a non-null displayName from creation — avoids NULL-display bugs in
        // notification emails and UI headers.
        displayName: input.displayName ?? `${input.firstName} ${input.lastName}`,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        dateOfJoining: input.dateOfJoining ? new Date(input.dateOfJoining) : undefined,
      },
      select: EMPLOYEE_SELECT,
    });

    const year = new Date().getFullYear();
    const leaveTypes = await tx.leaveType.findMany({
      where: { organizationId: orgId, isActive: true, deletedAt: null },
      select: { id: true, daysAllowed: true },
    });

    if (leaveTypes.length > 0) {
      await tx.leaveBalance.createMany({
        data: leaveTypes.map((lt) => ({
          organizationId: orgId,
          employeeId: created.id,
          leaveTypeId: lt.id,
          year,
          allocated: lt.daysAllowed,
          used: 0,
          pending: 0,
          carried: 0,
        })),
        skipDuplicates: true,
      });
    }

    // Auto-assign General Shift (code=GEN) if it exists for this org
    const generalShift = await tx.shift.findFirst({
      where: { organizationId: orgId, code: 'GEN', deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (generalShift) {
      await tx.shiftAssignment.create({
        data: {
          organizationId: orgId,
          employeeId: created.id,
          shiftId: generalShift.id,
          effectiveFrom: input.dateOfJoining ? new Date(input.dateOfJoining) : new Date(),
        },
      });
    }

    return created;
  });

  return employee;
}

export async function updateEmployee(
  id: string,
  orgId: string,
  input: UpdateEmployeeInput,
  prisma: PrismaClient,
) {
  await getEmployee(id, orgId, prisma);

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...input,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      dateOfJoining: input.dateOfJoining ? new Date(input.dateOfJoining) : undefined,
    },
    select: EMPLOYEE_SELECT,
  });

  return employee;
}

export async function softDeleteEmployee(id: string, orgId: string, prisma: PrismaClient) {
  await getEmployee(id, orgId, prisma);
  await prisma.employee.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'TERMINATED' },
  });
}
