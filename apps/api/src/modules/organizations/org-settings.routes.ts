import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';
import { sendEmail, empCodeRequestToSuperAdminEmail } from '../../lib/email.js';

const INDUSTRY_TYPES = [
  'IT_SOFTWARE', 'MANUFACTURING', 'HEALTHCARE', 'FINANCIAL_SERVICES',
  'RETAIL', 'EDUCATIONAL', 'SERVICE_BASED', 'GENERAL',
] as const;

const requestChangeSchema = z.object({
  requestedPrefix: z
    .string()
    .regex(/^[A-Z]{2,5}$/, 'Prefix must be 2–5 uppercase letters (e.g. SSI, SSIPL, TCS)'),
  applyToExisting: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

export function orgSettingsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── GET /organizations/settings/general ─────────────────────
  app.get('/organizations/settings/general', auth, async (req, reply) => {
    const org = await app.prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: {
        id: true, name: true, slug: true, logoUrl: true, website: true,
        email: true, phone: true, timezone: true, currency: true,
        industryType: true,
        employeeCodePrefix: true,
      },
    });
    if (!org) throw fail('Organization not found', 404);
    return reply.send(ok(org));
  });

  // ── PATCH /organizations/settings/general ───────────────────
  app.patch('/organizations/settings/general', auth, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ORG_ADMIN'].includes(req.user.role)) throw fail('Forbidden', 403);
    const input = z.object({
      industryType: z.enum(INDUSTRY_TYPES).optional(),
      timezone: z.string().optional(),
      currency: z.string().optional(),
      website: z.string().url().optional().nullable(),
      phone: z.string().optional().nullable(),
      logoUrl: z.string().url().optional().nullable(),
    }).parse(req.body);
    const updated = await app.prisma.organization.update({
      where: { id: req.user.orgId },
      data: input,
      select: { id: true, industryType: true, timezone: true, logoUrl: true },
    });
    return reply.send(ok(updated));
  });

  // ── GET /organizations/settings/employee-code ─────────────────────────────
  // Returns the current prefix, format example, and any pending request.
  // Accessible to ORG_ADMIN and HR roles (HR managers sometimes need visibility).
  app.get('/organizations/settings/employee-code', auth, async (req, reply) => {
    const org = await app.prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: {
        employeeCodePrefix: true,
        employeeSequence: true,
        employeeCodeRequests: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            requestedPrefix: true,
            applyToExisting: true,
            reason: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!org) throw fail('Organization not found', 404);

    return reply.send(
      ok({
        currentPrefix: org.employeeCodePrefix,
        formatExample: `${org.employeeCodePrefix}-${org.employeeSequence || 1}`,
        pendingRequest: org.employeeCodeRequests[0] ?? null,
      }),
    );
  });

  // ── POST /organizations/settings/employee-code/request ────────────────────
  // Org admin submits a change request. Only 1 PENDING request allowed at a time.
  // Only ORG_ADMIN role can submit.
  app.post('/organizations/settings/employee-code/request', auth, async (req, reply) => {
    if (req.user.role !== 'ORG_ADMIN') {
      throw fail('Only Organisation Admins can request employee code changes', 403);
    }

    const input = requestChangeSchema.parse(req.body);

    const org = await app.prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: { id: true, name: true, employeeCodePrefix: true },
    });
    if (!org) throw fail('Organization not found', 404);

    if (input.requestedPrefix === org.employeeCodePrefix) {
      throw fail('The requested prefix is the same as the current prefix — no change needed', 400);
    }

    // Only 1 PENDING request allowed at a time
    const existing = await app.prisma.employeeCodeChangeRequest.findFirst({
      where: { organizationId: org.id, status: 'PENDING' },
    });
    if (existing) {
      throw fail(
        'You already have a pending request. Please wait for the super admin to review it before submitting a new one.',
        409,
      );
    }

    const requestingAdmin = await app.prisma.employee.findUnique({
      where: { id: req.user.sub },
      select: { firstName: true, lastName: true, workEmail: true },
    });

    const request = await app.prisma.employeeCodeChangeRequest.create({
      data: {
        organizationId: org.id,
        requestedById: req.user.sub,
        currentPrefix: org.employeeCodePrefix,
        requestedPrefix: input.requestedPrefix,
        applyToExisting: input.applyToExisting,
        reason: input.reason,
      },
      select: {
        id: true,
        currentPrefix: true,
        requestedPrefix: true,
        applyToExisting: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });

    // Notify all super admins by email (fire-and-forget)
    const superAdmins = await app.prisma.superAdmin.findMany({
      select: { email: true, name: true },
    });
    for (const sa of superAdmins) {
      void sendEmail(
        sa.email,
        `[Action Required] Employee Code Change Request — ${org.name}`,
        empCodeRequestToSuperAdminEmail({
          superAdminName: sa.name,
          orgName: org.name,
          adminName: requestingAdmin
            ? `${requestingAdmin.firstName} ${requestingAdmin.lastName}`
            : 'Org Admin',
          currentPrefix: org.employeeCodePrefix,
          requestedPrefix: input.requestedPrefix,
          applyToExisting: input.applyToExisting,
          reason: input.reason,
        }),
      );
    }

    return reply.status(201).send(ok(request));
  });
}
