import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { ok, fail } from '../../lib/response.js';
import { provisionOrganization } from '../../lib/provision-org.js';
import { sendEmail, empCodeDecisionEmail, orgChartDecisionEmail } from '../../lib/email.js';
import { INDUSTRY_TEMPLATES, type IndustryType } from '../../lib/industry-templates.js';
import { superAdminRateLimit } from '../../lib/rate-limits.js';
import { planCacheKey } from '../../lib/plan-guard.js';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 10,
  STARTER: 25,
  GROWTH: 100,
  ENTERPRISE: 999,
};

export function superAdminRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticateSuperAdmin] };

  // POST /super-admin/auth/login  — rate-limited: 3 attempts per 30 minutes (BUG-H01)
  app.post('/super-admin/auth/login', superAdminRateLimit, async (req, reply) => {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(req.body);

    const admin = await app.prisma.superAdmin.findUnique({ where: { email } });
    if (!admin) throw fail('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw fail('Invalid credentials', 401);

    // BUG-L01: Super admin sessions use a 4-hour token (not the default 15-minute
    // access token) because there is no refresh mechanism for super admin yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const accessToken = jwt.sign(
      { sub: admin.id, orgId: 'super', role: 'SUPER_ADMIN' },
      env.JWT_SECRET,
      { expiresIn: '4h' as any },
    );

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
        logoUrl: true,
        themeConfig: {
          select: {
            primaryColor: true,
            sidebarStyle: true,
            bgImageUrl: true,
            backgroundColor: true,
            cardColor: true,
            appliedAt: true,
          },
        },
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
      logoUrl: o.logoUrl ?? null,
      themeConfig: o.themeConfig ?? null,
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
        // Optional employee code prefix — 2–5 uppercase letters (e.g. "SSI", "TCS", "INFY")
        // Auto-derived from org name if omitted.
        employeeCodePrefix: z
          .string()
          .regex(/^[A-Z]{2,5}$/, 'Employee code prefix must be 2–5 uppercase letters')
          .optional(),
      })
      .parse(req.body);

    const existing = await app.prisma.organization.findUnique({
      where: { slug: input.slug },
    });
    if (existing) throw fail('Slug already taken — choose a different one', 409);

    const passwordHash = await bcrypt.hash(input.adminPassword, 12);

    const { org } = await provisionOrganization(app.prisma, {
      name: input.name,
      slug: input.slug,
      email: input.email,
      plan: input.plan,
      adminFirstName: input.adminFirstName,
      adminLastName: input.adminLastName,
      adminEmail: input.adminEmail,
      passwordHash,
      employeeCodePrefix: input.employeeCodePrefix,
    });

    return reply.status(201).send(ok({ id: org.id, name: org.name, slug: org.slug }));
  });

  // GET /super-admin/employee-code-requests — list all requests (default: PENDING only)
  app.get('/super-admin/employee-code-requests', auth, async (req, reply) => {
    const { status } = z
      .object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).default('PENDING') })
      .parse(req.query);

    const requests = await app.prisma.employeeCodeChangeRequest.findMany({
      where: status === 'ALL' ? {} : { status },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        currentPrefix: true,
        requestedPrefix: true,
        applyToExisting: true,
        reason: true,
        status: true,
        superAdminNote: true,
        resolvedAt: true,
        createdAt: true,
        organization: { select: { id: true, name: true, slug: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true, workEmail: true } },
      },
    });

    return reply.send(ok(requests));
  });

  // PATCH /super-admin/employee-code-requests/:id — approve or reject
  app.patch('/super-admin/employee-code-requests/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = z
      .object({
        action: z.enum(['APPROVE', 'REJECT']),
        superAdminNote: z.string().max(500).optional(),
      })
      .parse(req.body);

    const codeRequest = await app.prisma.employeeCodeChangeRequest.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, employeeCodePrefix: true } },
        requestedBy: { select: { workEmail: true, firstName: true } },
      },
    });

    if (!codeRequest) throw fail('Request not found', 404);
    if (codeRequest.status !== 'PENDING') throw fail('This request has already been resolved', 409);

    if (input.action === 'APPROVE') {
      await app.prisma.$transaction(async (tx) => {
        // 1. Update the request status
        await tx.employeeCodeChangeRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            superAdminNote: input.superAdminNote,
            resolvedAt: new Date(),
          },
        });

        // 2. Update the org prefix
        await tx.organization.update({
          where: { id: codeRequest.organizationId },
          data: { employeeCodePrefix: codeRequest.requestedPrefix },
        });

        // 3. If retroactive: rename all existing employee codes in this org
        //    Old format: {oldPrefix}-{seq}  →  New format: {newPrefix}-{seq}
        //    We replace only the prefix portion, keeping the sequence number intact.
        if (codeRequest.applyToExisting) {
          const employees = await tx.employee.findMany({
            where: { organizationId: codeRequest.organizationId, deletedAt: null },
            select: { id: true, employeeCode: true },
          });

          const updates = employees.map((emp) => {
            // Extract the numeric suffix after the last '-'
            const parts = emp.employeeCode.split('-');
            const suffix = parts[parts.length - 1] ?? emp.employeeCode;
            const newCode = `${codeRequest.requestedPrefix}-${suffix}`;
            return tx.employee.update({
              where: { id: emp.id },
              data: {
                employeeCode: newCode,
                // Preserve the old code permanently for audit trail.
                // If the employee already has a previousEmployeeCode (from a
                // prior rename), keep the oldest historical value — don't
                // overwrite it — so the full rename chain is visible.
                previousEmployeeCode: emp.employeeCode,
              },
            });
          });

          await Promise.all(updates);
        }
      });

      // Email the org admin (fire-and-forget)
      void sendEmail(
        codeRequest.requestedBy.workEmail,
        `Your Employee Code Change Request Has Been Approved — ${codeRequest.organization.name}`,
        empCodeDecisionEmail({
          adminName: codeRequest.requestedBy.firstName,
          orgName: codeRequest.organization.name,
          requestedPrefix: codeRequest.requestedPrefix,
          applyToExisting: codeRequest.applyToExisting,
          status: 'APPROVED',
          superAdminNote: input.superAdminNote,
        }),
      );
    } else {
      // REJECT
      await app.prisma.employeeCodeChangeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          superAdminNote: input.superAdminNote,
          resolvedAt: new Date(),
        },
      });

      void sendEmail(
        codeRequest.requestedBy.workEmail,
        `Your Employee Code Change Request Was Not Approved — ${codeRequest.organization.name}`,
        empCodeDecisionEmail({
          adminName: codeRequest.requestedBy.firstName,
          orgName: codeRequest.organization.name,
          requestedPrefix: codeRequest.requestedPrefix,
          applyToExisting: codeRequest.applyToExisting,
          status: 'REJECTED',
          superAdminNote: input.superAdminNote,
        }),
      );
    }

    return reply.send(ok({ message: `Request ${input.action === 'APPROVE' ? 'approved' : 'rejected'} successfully` }));
  });

  // ── Org Chart Change Requests ──────────────────────────────────────────────

  // GET /super-admin/org-chart-requests — list requests (default: PENDING only)
  app.get('/super-admin/org-chart-requests', auth, async (req, reply) => {
    const { status } = z
      .object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).default('PENDING') })
      .parse(req.query);

    const requests = await app.prisma.orgChartChangeRequest.findMany({
      where: status === 'ALL' ? {} : { status },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        currentIndustry: true,
        requestedIndustry: true,
        reason: true,
        status: true,
        superAdminNote: true,
        resolvedAt: true,
        createdAt: true,
        organization: { select: { id: true, name: true, slug: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true, workEmail: true } },
      },
    });

    return reply.send(ok(requests));
  });

  // PATCH /super-admin/org-chart-requests/:id — approve or reject
  app.patch('/super-admin/org-chart-requests/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = z.object({
      action: z.enum(['APPROVE', 'REJECT']),
      superAdminNote: z.string().max(500).optional(),
    }).parse(req.body);

    const changeReq = await app.prisma.orgChartChangeRequest.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true } },
        requestedBy: { select: { workEmail: true, firstName: true, lastName: true } },
      },
    });
    if (!changeReq) throw fail('Request not found', 404);
    if (changeReq.status !== 'PENDING') throw fail('This request has already been resolved', 409);

    if (input.action === 'APPROVE') {
      await app.prisma.$transaction(async (tx) => {
        // 1. Update the org's industryType
        await tx.organization.update({
          where: { id: changeReq.organizationId },
          data: { industryType: changeReq.requestedIndustry },
        });

        // 2. Wipe old template positions so the new template starts clean.
        //
        //    Strategy:
        //    a) Clear parentId on ALL template-keyed designations first
        //       (avoids self-FK constraint violations during delete).
        //    b) Hard-delete template designations that have no employees — these
        //       are pure "vacant" slots from the previous template.
        //    c) For any template designation that still has employees assigned,
        //       detach it from the template (null out templateKey + parentId) so
        //       it becomes a standalone custom designation and the employee
        //       doesn't lose their role.

        // a) Clear parentId links within old template designations
        await tx.designation.updateMany({
          where: {
            organizationId: changeReq.organizationId,
            templateKey: { not: null },
          },
          data: { parentId: null },
        });

        // b) Delete vacant template designations
        await tx.designation.deleteMany({
          where: {
            organizationId: changeReq.organizationId,
            templateKey: { not: null },
            employees: { none: {} },
          },
        });

        // c) Detach remaining (employee-occupied) template designations
        await tx.designation.updateMany({
          where: {
            organizationId: changeReq.organizationId,
            templateKey: { not: null },
          },
          data: { templateKey: null },
        });

        // 3. Seed the new template
        const template = INDUSTRY_TEMPLATES[changeReq.requestedIndustry as IndustryType];
        if (template) {
          const keyToId = new Map<string, string>();
          for (const pos of template) {
            // After the wipe above, no templateKey rows remain — skip the
            // "existing by templateKey" check and go straight to name-match.
            const byName = await tx.designation.findFirst({
              where: { organizationId: changeReq.organizationId, name: pos.title },
              select: { id: true },
            });
            if (byName) {
              await tx.designation.update({
                where: { id: byName.id },
                data: { templateKey: pos.key, level: pos.level, department: pos.department ?? undefined },
              });
              keyToId.set(pos.key, byName.id);
              continue;
            }
            const created = await tx.designation.create({
              data: {
                organizationId: changeReq.organizationId,
                name: pos.title,
                level: pos.level,
                department: pos.department,
                templateKey: pos.key,
              },
            });
            keyToId.set(pos.key, created.id);
          }
          // Wire up parent relationships
          for (const pos of template) {
            if (!pos.parentKey) continue;
            const pid = keyToId.get(pos.key);
            const parentId = keyToId.get(pos.parentKey);
            if (pid && parentId) {
              await tx.designation.update({ where: { id: pid }, data: { parentId } });
            }
          }
        }

        // 4. Mark request approved
        await tx.orgChartChangeRequest.update({
          where: { id },
          data: { status: 'APPROVED', superAdminNote: input.superAdminNote, resolvedAt: new Date() },
        });
      });

      void sendEmail(
        changeReq.requestedBy.workEmail,
        `Your Org Chart Template Change Request has been Approved`,
        orgChartDecisionEmail({
          adminName: `${changeReq.requestedBy.firstName} ${changeReq.requestedBy.lastName}`,
          orgName: changeReq.organization.name,
          requestedIndustry: changeReq.requestedIndustry,
          status: 'APPROVED',
          superAdminNote: input.superAdminNote,
        }),
      );
    } else {
      await app.prisma.orgChartChangeRequest.update({
        where: { id },
        data: { status: 'REJECTED', superAdminNote: input.superAdminNote, resolvedAt: new Date() },
      });

      void sendEmail(
        changeReq.requestedBy.workEmail,
        `Your Org Chart Template Change Request was Not Approved`,
        orgChartDecisionEmail({
          adminName: `${changeReq.requestedBy.firstName} ${changeReq.requestedBy.lastName}`,
          orgName: changeReq.organization.name,
          requestedIndustry: changeReq.requestedIndustry,
          status: 'REJECTED',
          superAdminNote: input.superAdminNote,
        }),
      );
    }

    return reply.send(ok({ message: `Request ${input.action === 'APPROVE' ? 'approved' : 'rejected'} successfully` }));
  });

  // PATCH /super-admin/organizations/:id — update plan or status
  app.patch('/super-admin/organizations/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = z
      .object({
        plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
        isActive: z.boolean().optional(),
        logoUrl: z.string().url().nullable().optional(),
      })
      .parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.plan) {
      updateData.plan = input.plan;
      updateData.maxEmployees = PLAN_LIMITS[input.plan];
    }
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;

    const org = await app.prisma.organization.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, plan: true, isActive: true, maxEmployees: true },
    });

    // QUALITY-01: Invalidate the plan cache so the change takes effect immediately
    if (input.plan) {
      await app.redis.del(planCacheKey(id));
    }

    return reply.send(ok(org));
  });

  // ── Theme Requests ─────────────────────────────────────────────────────────

  // GET /super-admin/theme-requests
  app.get('/super-admin/theme-requests', auth, async (req, reply) => {
    const { status } = z
      .object({ status: z.enum(['PENDING', 'IMPLEMENTED', 'REJECTED', 'ALL']).default('PENDING') })
      .parse(req.query);

    const requests = await app.prisma.orgThemeRequest.findMany({
      where: status === 'ALL' ? {} : { status },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        preferredPrimaryHex: true,
        sidebarStyle: true,
        wantsBgImage: true,
        bgImageUrl: true,
        backgroundColor: true,
        logoUrl: true,
        notes: true,
        attachmentUrls: true,
        status: true,
        superAdminNote: true,
        createdAt: true,
        resolvedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            themeConfig: {
              select: {
                primaryColor: true,
                sidebarStyle: true,
                bgImageUrl: true,
                backgroundColor: true,
                cardColor: true,
                appliedAt: true,
              },
            },
          },
        },
        requestedBy: { select: { id: true, firstName: true, lastName: true, workEmail: true } },
      },
    });

    return reply.send(ok(requests));
  });

  // PATCH /super-admin/theme-requests/:id/apply — apply theme to org
  app.patch('/super-admin/theme-requests/:id/apply', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = z.object({
      primaryColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
      primaryForeground:z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
      sidebarStyle:     z.enum(['light', 'dark', 'branded']).optional().nullable(),
      bgImageUrl:       z.string().url().optional().nullable(),
      backgroundColor:  z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
      cardColor:        z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
      logoUrl:          z.string().url().optional().nullable(),
      superAdminNote:   z.string().max(500).optional(),
    }).parse(req.body);

    const request = await app.prisma.orgThemeRequest.findUnique({
      where: { id },
      select: { id: true, organizationId: true, status: true },
    });
    if (!request) throw fail('Theme request not found', 404);
    if (request.status !== 'PENDING') throw fail('This request has already been resolved', 409);

    await app.prisma.$transaction(async (tx) => {
      // Upsert the org's theme config
      await tx.orgThemeConfig.upsert({
        where: { organizationId: request.organizationId },
        create: {
          organizationId: request.organizationId,
          primaryColor: input.primaryColor ?? null,
          primaryForeground: input.primaryForeground ?? null,
          sidebarStyle: input.sidebarStyle ?? 'light',
          bgImageUrl: input.bgImageUrl ?? null,
          backgroundColor: input.backgroundColor ?? null,
          cardColor: input.cardColor ?? null,
          appliedById: req.user.sub,
        },
        update: {
          primaryColor: input.primaryColor ?? null,
          primaryForeground: input.primaryForeground ?? null,
          sidebarStyle: input.sidebarStyle ?? 'light',
          bgImageUrl: input.bgImageUrl ?? null,
          backgroundColor: input.backgroundColor ?? null,
          cardColor: input.cardColor ?? null,
          appliedAt: new Date(),
          appliedById: req.user.sub,
        },
      });

      // If a logo was provided, update the org's main logoUrl
      if (input.logoUrl !== undefined) {
        await tx.organization.update({
          where: { id: request.organizationId },
          data: { logoUrl: input.logoUrl },
        });
      }

      // Mark request as implemented
      await tx.orgThemeRequest.update({
        where: { id },
        data: {
          status: 'IMPLEMENTED',
          superAdminNote: input.superAdminNote,
          resolvedAt: new Date(),
        },
      });
    });

    return reply.send(ok({ message: 'Theme applied successfully' }));
  });

  // PATCH /super-admin/theme-requests/:id/reject
  app.patch('/super-admin/theme-requests/:id/reject', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { superAdminNote } = z
      .object({ superAdminNote: z.string().max(500).optional() })
      .parse(req.body);

    const request = await app.prisma.orgThemeRequest.findUnique({ where: { id } });
    if (!request) throw fail('Theme request not found', 404);
    if (request.status !== 'PENDING') throw fail('This request has already been resolved', 409);

    await app.prisma.orgThemeRequest.update({
      where: { id },
      data: { status: 'REJECTED', superAdminNote, resolvedAt: new Date() },
    });

    return reply.send(ok({ message: 'Theme request rejected' }));
  });
}
