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
  /** Optional employee code prefix (e.g. "SSI" → SSI-1, SSI-473).
   *  If omitted, auto-derived from the organisation name. */
  employeeCodePrefix?: string;
  // ── Branding (collected at signup, all optional) ──────────────────────────
  logoUrl?: string;
  industryType?: string;
  primaryColor?: string;
  sidebarStyle?: string;
}

const PLAN_LIMITS: Record<string, number> = {
  FREE: 10,
  STARTER: 25,
  GROWTH: 100,
  ENTERPRISE: 999,
};

/**
 * Derive a 2–5 letter uppercase prefix from an org name.
 *
 * Rules (in order):
 *   Multi-word  → first letter of each word, capped at 5  ("Super Software India" → "SSI")
 *   Single word → first 4 letters                         ("Infosys" → "INFO", "IBM" → "IBM")
 *
 * Strip non-alpha chars first so "H.D.F.C Bank" → "HB" (multi-word) and
 * numbers/symbols don't pollute the prefix.
 */
function derivePrefix(orgName: string): string {
  const cleaned = orgName.toUpperCase().replace(/[^A-Z\s]/g, '').trim();
  const words   = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    const initials = words.map((w) => w[0]).join('').slice(0, 5);
    return initials.length >= 2 ? initials : (words[0] ?? 'EMP').slice(0, 4);
  }

  return (words[0] ?? 'EMP').slice(0, 4);
}

export async function provisionOrganization(prisma: PrismaClient, input: ProvisionInput) {
  const plan       = input.plan ?? 'FREE';
  const maxEmployees = PLAN_LIMITS[plan] ?? 10;

  // Determine the employee code prefix:
  //   1. Use what the admin explicitly provided (validated by caller to /^[A-Z]{2,5}$/)
  //   2. Otherwise auto-derive from the organisation name
  const employeeCodePrefix = (input.employeeCodePrefix ?? derivePrefix(input.name)).toUpperCase();
  const adminCode          = `${employeeCodePrefix}-1`;

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        email: input.email,
        plan,
        maxEmployees,
        employeeCodePrefix,
        employeeSequence: 1,
        ...(input.logoUrl     && { logoUrl:      input.logoUrl }),
        ...(input.industryType && { industryType: input.industryType }),
      },
    });

    const admin = await tx.employee.create({
      data: {
        organizationId: org.id,
        employeeCode:   adminCode,         // e.g. SSI-1, TCS-1, EMP-1
        firstName:      input.adminFirstName,
        lastName:       input.adminLastName,
        displayName:    `${input.adminFirstName} ${input.adminLastName}`,
        email:          input.adminEmail,
        workEmail:      input.adminEmail,
        role:           'ORG_ADMIN',
        status:         'ACTIVE',
        employmentType: 'FULL_TIME',
        passwordHash:   input.passwordHash,
        dateOfJoining:  new Date(),
      },
    });

    await tx.shift.create({
      data: {
        organizationId:      org.id,
        name:                'General Shift',
        code:                'GEN',
        startTime:           '09:00',
        endTime:             '18:00',
        graceMinutes:        15,
        halfDayAfterMinutes: 270,
        absentAfterMinutes:  480,
        breakDurationMinutes: 60,
        weeklyOffDays:       [0, 6],
      },
    });

    for (const lt of [
      { name: 'Casual Leave',        code: 'CL',  daysAllowed: 12,  isPaid: true },
      { name: 'Sick Leave',          code: 'SL',  daysAllowed: 12,  isPaid: true },
      {
        name: 'Earned Leave', code: 'EL', daysAllowed: 21, isPaid: true,
        isCarryForward: true, maxCarryForward: 30, isEncashable: true,
      },
      { name: 'Leave Without Pay',   code: 'LWP', daysAllowed: 365, isPaid: false },
    ]) {
      await tx.leaveType.create({ data: { organizationId: org.id, ...lt } });
    }

    for (const c of [
      { name: 'Basic Salary',                   code: 'BASIC',      type: 'EARNING'   as const, defaultPercent: 40, isTaxable: true,  displayOrder: 1  },
      { name: 'HRA',                            code: 'HRA',        type: 'EARNING'   as const, defaultPercent: 20, isTaxable: false, displayOrder: 2  },
      { name: 'Special Allowance',              code: 'SPEC_ALLOW', type: 'EARNING'   as const, defaultPercent: 20, isTaxable: true,  displayOrder: 3  },
      { name: 'Provident Fund (Employee)',      code: 'PF_EMP',     type: 'DEDUCTION' as const,                     isTaxable: false, displayOrder: 10 },
      { name: 'ESI (Employee)',                 code: 'ESI_EMP',    type: 'DEDUCTION' as const,                     isTaxable: false, displayOrder: 11 },
      { name: 'Professional Tax',               code: 'PT',         type: 'DEDUCTION' as const,                     isTaxable: false, displayOrder: 12 },
      { name: 'TDS',                            code: 'TDS',        type: 'DEDUCTION' as const,                     isTaxable: false, displayOrder: 13 },
    ]) {
      await tx.salaryComponent.create({ data: { organizationId: org.id, ...c } });
    }

    // If a primary colour was provided at signup, apply the theme immediately —
    // no super-admin approval needed for the initial setup.
    if (input.primaryColor) {
      await tx.orgThemeConfig.create({
        data: {
          organizationId: org.id,
          primaryColor:   input.primaryColor,
          sidebarStyle:   input.sidebarStyle ?? 'light',
          appliedById:    admin.id,
        },
      });
    } else if (input.sidebarStyle && input.sidebarStyle !== 'light') {
      await tx.orgThemeConfig.create({
        data: {
          organizationId: org.id,
          sidebarStyle:   input.sidebarStyle,
          appliedById:    admin.id,
        },
      });
    }

    return { org, admin };
  });
}
