import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signAccessToken } from '../../lib/jwt.js';
import { ok, fail } from '../../lib/response.js';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 10,
  STARTER: 25,
  GROWTH: 100,
  ENTERPRISE: 999,
};

export function superAdminRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticateSuperAdmin] };

  // POST /super-admin/auth/login
  app.post('/super-admin/auth/login', async (req, reply) => {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(req.body);

    const admin = await app.prisma.superAdmin.findUnique({ where: { email } });
    if (!admin) throw fail('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw fail('Invalid credentials', 401);

    const accessToken = signAccessToken({
      sub: admin.id,
      orgId: 'super',
      role: 'SUPER_ADMIN',
    });

    return reply.send(
      ok({ accessToken, admin: { id: admin.id, name: admin.name, email: admin.email } }),
    );
  });

  // GET /super-admin/auth/me
  app.get('/super-admin/auth/me', auth, async (req, reply) => {
    const admin = await app.prisma.superAdmin.findUnique({
      where: { id: req.user.sub },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!admin) throw fail('Not found', 404);
    return reply.send(ok(admin));
  });

  // GET /super-admin/organizations
  app.get('/super-admin/organizations', auth, async (_req, reply) => {
    const orgs = await app.prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        plan: true,
        maxEmployees: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { employees: { where: { deletedAt: null, status: 'ACTIVE' } } },
        },
      },
    });

    const result = orgs.map((o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      email: o.email,
      plan: o.plan,
      maxEmployees: o.maxEmployees,
      isActive: o.isActive,
      createdAt: o.createdAt,
      employeeCount: o._count.employees,
    }));

    return reply.send(ok(result));
  });

  // POST /super-admin/organizations — create org + default setup
  app.post('/super-admin/organizations', auth, async (req, reply) => {
    const input = z
      .object({
        name: z.string().min(2),
        slug: z
          .string()
          .min(2)
          .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
        email: z.string().email(),
        plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).default('FREE'),
        adminFirstName: z.string().min(1),
        adminLastName: z.string().min(1),
        adminEmail: z.string().email(),
        adminPassword: z.string().min(8),
      })
      .parse(req.body);

    const existing = await app.prisma.organization.findUnique({
      where: { slug: input.slug },
    });
    if (existing) throw fail('Slug already taken — choose a different one', 409);

    const passwordHash = await bcrypt.hash(input.adminPassword, 12);
    const maxEmployees = PLAN_LIMITS[input.plan] ?? 10;

    const org = await app.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
          email: input.email,
          plan: input.plan,
          maxEmployees,
        },
      });

      await tx.employee.create({
        data: {
          organizationId: org.id,
          employeeCode: 'EMP001',
          firstName: input.adminFirstName,
          lastName: input.adminLastName,
          email: input.adminEmail,
          workEmail: input.adminEmail,
          role: 'ORG_ADMIN',
          status: 'ACTIVE',
          employmentType: 'FULL_TIME',
          passwordHash,
          dateOfJoining: new Date(),
        },
      });

      await tx.shift.create({
        data: {
          organizationId: org.id,
          name: 'General Shift',
          code: 'GEN',
          startTime: '09:00',
          endTime: '18:00',
          graceMinutes: 15,
          halfDayAfterMinutes: 270,
          absentAfterMinutes: 480,
          breakDurationMinutes: 60,
          weeklyOffDays: [0, 6],
        },
      });

      const leaveTypes = [
        { name: 'Casual Leave', code: 'CL', daysAllowed: 12, isPaid: true },
        { name: 'Sick Leave', code: 'SL', daysAllowed: 12, isPaid: true },
        {
          name: 'Earned Leave',
          code: 'EL',
          daysAllowed: 21,
          isPaid: true,
          isCarryForward: true,
          maxCarryForward: 30,
          isEncashable: true,
        },
        { name: 'Leave Without Pay', code: 'LWP', daysAllowed: 365, isPaid: false },
      ];
      for (const lt of leaveTypes) {
        await tx.leaveType.create({ data: { organizationId: org.id, ...lt } });
      }

      const salaryComponents = [
        { name: 'Basic Salary', code: 'BASIC', type: 'EARNING', defaultPercent: 40, isTaxable: true, displayOrder: 1 },
        { name: 'HRA', code: 'HRA', type: 'EARNING', defaultPercent: 20, isTaxable: false, displayOrder: 2 },
        { name: 'Special Allowance', code: 'SPEC_ALLOW', type: 'EARNING', defaultPercent: 20, isTaxable: true, displayOrder: 3 },
        { name: 'Provident Fund (Employee)', code: 'PF_EMP', type: 'DEDUCTION', isTaxable: false, displayOrder: 10 },
        { name: 'ESI (Employee)', code: 'ESI_EMP', type: 'DEDUCTION', isTaxable: false, displayOrder: 11 },
        { name: 'Professional Tax', code: 'PT', type: 'DEDUCTION', isTaxable: false, displayOrder: 12 },
        { name: 'TDS', code: 'TDS', type: 'DEDUCTION', isTaxable: false, displayOrder: 13 },
      ];
      for (const c of salaryComponents) {
        await tx.salaryComponent.create({ data: { organizationId: org.id, ...c } });
      }

      return org;
    });

    return reply.status(201).send(ok({ id: org.id, name: org.name, slug: org.slug }));
  });

  // PATCH /super-admin/organizations/:id — update plan or status
  app.patch('/super-admin/organizations/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = z
      .object({
        plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.plan) {
      updateData.plan = input.plan;
      updateData.maxEmployees = PLAN_LIMITS[input.plan];
    }

    const org = await app.prisma.organization.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, plan: true, isActive: true, maxEmployees: true },
    });

    return reply.send(ok(org));
  });
}
