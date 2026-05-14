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
        id: true, firstName: true, lastName: true, phone: true,
        dateOfBirth: true, bloodGroup: true, maritalStatus: true,
        presentAddress: true, permanentAddress: true, emergencyContact: true,
        bankAccountNumber: true, bankIfsc: true, bankName: true, bankBranch: true,
      },
    });
    if (!employee) throw fail('Employee not found', 404);
    return reply.send(ok(employee));
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
    return reply.send(ok(updated));
  });

  // GET /employees
  app.get('/employees', auth, async (req, reply) => {
    const query = employeeListSchema.parse(req.query);
    const result = await listEmployees(req.user.orgId, query, app.prisma);
    return reply.send(result);
  });

  // GET /employees/:id
  app.get('/employees/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const employee = await getEmployee(id, req.user.orgId, app.prisma);
    return reply.send(ok(employee));
  });

  // POST /employees
  app.post('/employees', auth, async (req, reply) => {
    const input = createEmployeeSchema.parse(req.body);
    const employee = await createEmployee(req.user.orgId, input, app.prisma);
    return reply.status(201).send(ok(employee));
  });

  // PATCH /employees/:id
  app.patch('/employees/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = updateEmployeeSchema.parse(req.body);
    const adminRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
    if (!adminRoles.includes(req.user.role)) {
      delete input.workEmail;
    }
    const employee = await updateEmployee(id, req.user.orgId, input, app.prisma);
    return reply.send(ok(employee));
  });

  // DELETE /employees/:id  (soft delete)
  app.delete('/employees/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    await softDeleteEmployee(id, req.user.orgId, app.prisma);
    return reply.status(204).send();
  });
}
