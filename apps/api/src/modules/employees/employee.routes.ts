import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeListSchema,
} from './employee.schema.js';
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  softDeleteEmployee,
} from './employee.service.js';
import { ok, fail } from '../../lib/response.js';

export function employeeRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /employees/directory — public-safe fields, all roles
  app.get('/employees/directory', auth, async (req, reply) => {
    const { search } = z.object({ search: z.string().optional() }).parse(req.query);

    const employees = await app.prisma.employee.findMany({
      where: {
        organizationId: req.user.orgId,
        deletedAt: null,
        status: 'ACTIVE',
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { designation: { contains: search, mode: 'insensitive' } },
            { employeeCode: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        designation: true,
        workEmail: true,
        phone: true,
        avatarUrl: true,
        dateOfJoining: true,
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
        officeLocationId: true,
        officeLocation: { select: { id: true, name: true } },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return reply.send(ok(employees));
  });

  // GET /employees/org-chart — hierarchy data, all roles
  app.get('/employees/org-chart', auth, async (req, reply) => {
    const employees = await app.prisma.employee.findMany({
      where: { organizationId: req.user.orgId, deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        designation: true,
        avatarUrl: true,
        managerId: true,
        department: { select: { name: true } },
      },
      orderBy: [{ firstName: 'asc' }],
    });

    return reply.send(ok(employees));
  });

  // GET /employees/me  — current employee's own profile (self-service)
  app.get('/employees/me', auth, async (req, reply) => {
    const employee = await app.prisma.employee.findFirst({
      where: { id: req.user.sub, organizationId: req.user.orgId, deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, avatarUrl: true, phone: true,
        dateOfBirth: true, dateOfJoining: true, bloodGroup: true, maritalStatus: true, designation: true,
        presentAddress: true, permanentAddress: true, emergencyContact: true,
        bankAccountNumber: true, bankIfsc: true, bankName: true, bankBranch: true,
        biometricPreference: true,
        department: { select: { id: true, name: true } },
        officeLocation: { select: { id: true, name: true } },
      },
    });
    if (!employee) throw fail('Employee not found', 404);
    return reply.send(ok(employee));
  });

  // PATCH /employees/me/biometric-preference  — employee sets their biometric punch preference
  app.patch('/employees/me/biometric-preference', auth, async (req, reply) => {
    const { preference } = z.object({
      preference: z.enum(['FINGERPRINT_FIRST', 'FACE_FIRST', 'BIOMETRIC_ANY', 'NO_BIOMETRIC']),
    }).parse(req.body);
    await app.prisma.employee.update({
      where: { id: req.user.sub },
      data: { biometricPreference: preference },
    });
    return reply.send(ok({ preference }));
  });

  // PATCH /employees/me/profile  — employee updates their own personal/bank/address details
  app.patch('/employees/me/profile', auth, async (req, reply) => {
    const addressSchema = z.object({
      line1: z.string().optional(), line2: z.string().optional(),
      city: z.string().optional(), state: z.string().optional(),
      pincode: z.string().optional(), country: z.string().default('IN'),
    }).optional();
    const selfSchema = z.object({
      phone: z.string().optional(),
      dateOfBirth: z.string().datetime().optional(),
      bloodGroup: z.string().optional(),
      maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional(),
      presentAddress: addressSchema,
      permanentAddress: addressSchema,
      emergencyContact: z.object({
        name: z.string().optional(), phone: z.string().optional(), relationship: z.string().optional(),
      }).optional(),
      bankAccountNumber: z.string().optional(),
      bankIfsc: z.string().optional(),
      bankName: z.string().optional(),
      bankBranch: z.string().optional(),
      avatarUrl: z.string().url().optional(),
    });
    const input = selfSchema.parse(req.body);
    const updated = await app.prisma.employee.update({
      where: { id: req.user.sub },
      data: {
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        dateOfBirth: true, bloodGroup: true, maritalStatus: true,
        presentAddress: true, permanentAddress: true, emergencyContact: true,
        bankAccountNumber: true, bankIfsc: true, bankName: true, bankBranch: true,
        avatarUrl: true,
      },
    });

    // BUG-M06: Notify the employee when bank details change so they can act if
    // the change was unauthorised (e.g. hijacked session).
    const bankFields = ['bankAccountNumber', 'bankIfsc', 'bankName', 'bankBranch'] as const;
    const hasBankChange = bankFields.some((f) => f in input && input[f] !== undefined);
    if (hasBankChange) {
      void app.prisma.notification.create({
        data: {
          organizationId: req.user.orgId,
          employeeId: req.user.sub,
          type: 'SYSTEM',
          title: 'Bank Details Updated',
          body: 'Your bank details have been updated. If you did not make this change, contact HR immediately.',
        },
      });
    }

    return reply.send(ok(updated));
  });

  // GET /employees  — MANAGER and above only (BUG-C01)
  app.get('/employees', auth, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
      throw fail('Forbidden', 403);
    }
    const query = employeeListSchema.parse(req.query);
    const result = await listEmployees(req.user.orgId, query, app.prisma, req.user.role);
    return reply.send(result);
  });

  // GET /employees/:id  — MANAGER and above only (BUG-C01)
  app.get('/employees/:id', auth, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'].includes(req.user.role)) {
      throw fail('Forbidden', 403);
    }
    const { id } = req.params as { id: string };
    const employee = await getEmployee(id, req.user.orgId, app.prisma, req.user.role);
    return reply.send(ok(employee));
  });

  // POST /employees  — HR and above only (BUG-C02)
  app.post('/employees', auth, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role)) {
      throw fail('Forbidden — only HR can create employees', 403);
    }
    const input = createEmployeeSchema.parse(req.body);
    const employee = await createEmployee(req.user.orgId, input, app.prisma);
    return reply.status(201).send(ok(employee));
  });

  // PATCH /employees/:id  — role-aware edit (BUG-C02 / BUG-H06)
  app.patch('/employees/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = updateEmployeeSchema.parse(req.body);

    const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role);
    const isManager = req.user.role === 'MANAGER';
    const isEmployee = req.user.role === 'EMPLOYEE';

    // EMPLOYEE role: can only edit their own record
    if (isEmployee && id !== req.user.sub) {
      throw fail('Forbidden — you can only edit your own profile', 403);
    }

    // MANAGER role: can only edit self or direct reports
    if (isManager && id !== req.user.sub) {
      const isDirect = await app.prisma.employee.findFirst({
        where: { id, managerId: req.user.sub, organizationId: req.user.orgId, deletedAt: null },
      });
      if (!isDirect) throw fail('Forbidden — you can only edit your direct reports', 403);
    }

    // Non-admin roles cannot change these fields
    if (!isAdmin) {
      delete input.workEmail;
      // HR-only: employment classification and statutory data
      delete (input as Record<string, unknown>).employmentType;
      delete (input as Record<string, unknown>).dateOfJoining;
      delete (input as Record<string, unknown>).noticePeriodDays;
      delete (input as Record<string, unknown>).panNumber;
      delete (input as Record<string, unknown>).aadhaarNumber;
      delete (input as Record<string, unknown>).pfAccountNumber;
      delete (input as Record<string, unknown>).esiNumber;
      delete (input as Record<string, unknown>).uanNumber;
    }

    // Non-admin/non-manager roles cannot change structural fields
    if (!isAdmin && !isManager) {
      delete (input as Record<string, unknown>).status;
      delete (input as Record<string, unknown>).departmentId;
      delete (input as Record<string, unknown>).managerId;
      delete (input as Record<string, unknown>).designationId;
    }

    const employee = await updateEmployee(id, req.user.orgId, input, app.prisma);
    return reply.send(ok(employee));
  });

  // DELETE /employees/:id  — HR and above only (BUG-C02)
  app.delete('/employees/:id', auth, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role)) {
      throw fail('Forbidden — only HR can delete employees', 403);
    }
    const { id } = req.params as { id: string };
    await softDeleteEmployee(id, req.user.orgId, app.prisma);
    return reply.status(204).send();
  });
}
