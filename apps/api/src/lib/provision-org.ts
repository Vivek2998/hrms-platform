import type { PrismaClient } from '@prisma/client';

export interface ProvisionInput {
  name: string;
  slug: string;
  email: string;
  plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  passwordHash: string;
}

const PLAN_LIMITS: Record<string, number> = {
  FREE: 10,
  STARTER: 25,
  GROWTH: 100,
  ENTERPRISE: 999,
};

export async function provisionOrganization(prisma: PrismaClient, input: ProvisionInput) {
  const plan = input.plan ?? 'FREE';
  const maxEmployees = PLAN_LIMITS[plan] ?? 10;

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: input.name, slug: input.slug, email: input.email, plan, maxEmployees },
    });

    const admin = await tx.employee.create({
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
        passwordHash: input.passwordHash,
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

    for (const lt of [
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
    ]) {
      await tx.leaveType.create({ data: { organizationId: org.id, ...lt } });
    }

    for (const c of [
      { name: 'Basic Salary', code: 'BASIC', type: 'EARNING' as const, defaultPercent: 40, isTaxable: true, displayOrder: 1 },
      { name: 'HRA', code: 'HRA', type: 'EARNING' as const, defaultPercent: 20, isTaxable: false, displayOrder: 2 },
      { name: 'Special Allowance', code: 'SPEC_ALLOW', type: 'EARNING' as const, defaultPercent: 20, isTaxable: true, displayOrder: 3 },
      { name: 'Provident Fund (Employee)', code: 'PF_EMP', type: 'DEDUCTION' as const, isTaxable: false, displayOrder: 10 },
      { name: 'ESI (Employee)', code: 'ESI_EMP', type: 'DEDUCTION' as const, isTaxable: false, displayOrder: 11 },
      { name: 'Professional Tax', code: 'PT', type: 'DEDUCTION' as const, isTaxable: false, displayOrder: 12 },
      { name: 'TDS', code: 'TDS', type: 'DEDUCTION' as const, isTaxable: false, displayOrder: 13 },
    ]) {
      await tx.salaryComponent.create({ data: { organizationId: org.id, ...c } });
    }

    return { org, admin };
  });
}
