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
} satisfies Prisma.EmployeeSelect;

async function generateEmployeeCode(prisma: PrismaClient, organizationId: string): Promise<string> {
  const count = await prisma.employee.count({ where: { organizationId } });
  return `EMP${String(count + 1).padStart(4, '0')}`;
}

export async function listEmployees(orgId: string, query: EmployeeListQuery, prisma: PrismaClient) {
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
      select: EMPLOYEE_SELECT,
      ...paginationArgs(query),
      orderBy: { createdAt: query.sortOrder },
    }),
    prisma.employee.count({ where }),
  ]);

  return paginated(employees, query.page, query.limit, total);
}

export async function getEmployee(id: string, orgId: string, prisma: PrismaClient) {
  const employee = await prisma.employee.findFirst({
    where: { id, organizationId: orgId, deletedAt: null },
    select: EMPLOYEE_SELECT,
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

  const employee = await prisma.employee.create({
    data: {
      ...rest,
      organizationId: orgId,
      employeeCode,
      passwordHash,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      dateOfJoining: input.dateOfJoining ? new Date(input.dateOfJoining) : undefined,
    },
    select: EMPLOYEE_SELECT,
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
