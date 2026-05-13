import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HRMS database...');

  // Default super admin
  const superAdminHash = await bcrypt.hash('SuperAdmin@123', 12);
  await prisma.superAdmin.upsert({
    where: { email: 'superadmin@hrms.io' },
    update: {},
    create: {
      email: 'superadmin@hrms.io',
      name: 'Super Admin',
      passwordHash: superAdminHash,
    },
  });
  console.log('✅ Super Admin: superadmin@hrms.io / SuperAdmin@123');

  // Super admin org
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      name: 'Demo Corporation Pvt Ltd',
      slug: 'demo-corp',
      email: 'admin@democorp.in',
      phone: '+91-9800000000',
      city: 'Bangalore',
      state: 'KA',
      gstin: '29AABCD1234F1Z5',
      pan: 'AABCD1234F',
      timezone: 'Asia/Kolkata',
      pfEnabled: true,
      esiEnabled: true,
      ptEnabled: true,
      ptState: 'KA',
    },
  });

  console.log(`✅ Organization: ${org.name}`);

  // Admin employee
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.employee.upsert({
    where: { organizationId_workEmail: { organizationId: org.id, workEmail: 'admin@democorp.in' } },
    update: {},
    create: {
      organizationId: org.id,
      employeeCode: 'EMP001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@democorp.in',
      workEmail: 'admin@democorp.in',
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
      employmentType: 'FULL_TIME',
      passwordHash,
      dateOfJoining: new Date('2024-01-01'),
    },
  });

  console.log(`✅ Admin employee: ${admin.workEmail}`);

  // Default shifts
  const generalShift = await prisma.shift.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'GEN' } },
    update: {},
    create: {
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

  console.log(`✅ Shift: ${generalShift.name}`);

  // Default leave types
  const leaveTypes = [
    { name: 'Casual Leave', code: 'CL', daysAllowed: 12, isPaid: true, isEncashable: false },
    { name: 'Sick Leave', code: 'SL', daysAllowed: 12, isPaid: true, isEncashable: false },
    {
      name: 'Earned Leave',
      code: 'EL',
      daysAllowed: 21,
      isPaid: true,
      isCarryForward: true,
      maxCarryForward: 30,
      isEncashable: true,
    },
    { name: 'Maternity Leave', code: 'ML', daysAllowed: 182, isPaid: true, isEncashable: false },
    { name: 'Paternity Leave', code: 'PL', daysAllowed: 15, isPaid: true, isEncashable: false },
    {
      name: 'Leave Without Pay',
      code: 'LWP',
      daysAllowed: 365,
      isPaid: false,
      isEncashable: false,
    },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { organizationId_code: { organizationId: org.id, code: lt.code } },
      update: {},
      create: { organizationId: org.id, ...lt },
    });
  }

  console.log(`✅ Leave types: ${leaveTypes.map((l) => l.code).join(', ')}`);

  // Default salary components
  const components = [
    {
      name: 'Basic Salary',
      code: 'BASIC',
      type: 'EARNING',
      defaultPercent: 40,
      isTaxable: true,
      displayOrder: 1,
    },
    {
      name: 'HRA',
      code: 'HRA',
      type: 'EARNING',
      defaultPercent: 20,
      isTaxable: false,
      displayOrder: 2,
    },
    {
      name: 'Special Allowance',
      code: 'SPEC_ALLOW',
      type: 'EARNING',
      defaultPercent: 20,
      isTaxable: true,
      displayOrder: 3,
    },
    {
      name: 'LTA',
      code: 'LTA',
      type: 'EARNING',
      defaultPercent: 10,
      isTaxable: false,
      displayOrder: 4,
    },
    {
      name: 'Medical Allowance',
      code: 'MED_ALLOW',
      type: 'EARNING',
      isFixedAmount: true,
      defaultAmount: 1250,
      isTaxable: false,
      displayOrder: 5,
    },
    {
      name: 'Provident Fund (Employee)',
      code: 'PF_EMP',
      type: 'DEDUCTION',
      isTaxable: false,
      displayOrder: 10,
    },
    {
      name: 'ESI (Employee)',
      code: 'ESI_EMP',
      type: 'DEDUCTION',
      isTaxable: false,
      displayOrder: 11,
    },
    { name: 'Professional Tax', code: 'PT', type: 'DEDUCTION', isTaxable: false, displayOrder: 12 },
    { name: 'TDS', code: 'TDS', type: 'DEDUCTION', isTaxable: false, displayOrder: 13 },
    {
      name: 'Provident Fund (Employer)',
      code: 'PF_EMP_ER',
      type: 'STATUTORY',
      isTaxable: false,
      displayOrder: 20,
    },
    {
      name: 'ESI (Employer)',
      code: 'ESI_EMP_ER',
      type: 'STATUTORY',
      isTaxable: false,
      displayOrder: 21,
    },
  ];

  for (const comp of components) {
    await prisma.salaryComponent.upsert({
      where: { organizationId_code: { organizationId: org.id, code: comp.code } },
      update: {},
      create: { organizationId: org.id, ...comp },
    });
  }

  console.log(`✅ Salary components: ${String(components.length)} created`);

  console.log('\n🎉 Seed complete!');
  console.log('   Login: admin@democorp.in / Admin@1234');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
