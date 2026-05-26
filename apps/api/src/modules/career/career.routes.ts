import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';
import { INDUSTRY_TEMPLATES, type IndustryType } from '../../lib/industry-templates.js';
import { sendEmail, orgChartRequestToSuperAdminEmail, orgChartDecisionEmail } from '../../lib/email.js';

const INDUSTRY_TYPES = [
  'IT_SOFTWARE', 'MANUFACTURING', 'HEALTHCARE', 'FINANCIAL_SERVICES',
  'RETAIL', 'EDUCATIONAL', 'SERVICE_BASED', 'GENERAL',
] as const;

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const designationSchema = z.object({
  name: z.string().min(2),
  level: z.number().int().min(1).max(20),
  department: z.string().optional(),
  description: z.string().optional(),
  skills: z.array(z.string()).default([]),
  parentId: z.string().uuid().optional().nullable(),
  templateKey: z.string().optional().nullable(),
});

const pathSchema = z.object({
  fromDesignationId: z.string().uuid(),
  toDesignationId: z.string().uuid(),
  typicalYears: z.number().int().positive().optional(),
  skillsRequired: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// AUTO-MATCH HELPER
// Fuzzy-matches an employee's free-text designation string against
// the list of seeded positions.  Returns the best matching position
// ID, or null if nothing is close enough.
//
// Algorithm:
//   1. Exact case-insensitive match → instant win
//   2. Token-level F1 score (precision × recall harmonic mean)
//      Tiebreaker: prefer the position with the higher `level`
//      value (more junior/specific role) so e.g. "Engineer" maps
//      to "Software Engineer" (level 7) rather than a broad lead.
//   Minimum threshold: F1 ≥ 0.35
// ─────────────────────────────────────────────────────────────
function autoMatchDesignation(
  empDesig: string,
  positions: { id: string; name: string; level: number }[],
): string | null {
  const emp = empDesig.toLowerCase().trim();
  if (!emp) return null;

  // Step 1: exact match
  const exact = positions.find((p) => p.name.toLowerCase().trim() === emp);
  if (exact) return exact.id;

  // Step 2: token F1
  const empTokens = emp.split(/\W+/).filter((w) => w.length > 1);
  if (empTokens.length === 0) return null;

  let best: { id: string; score: number; level: number } | null = null;
  for (const pos of positions) {
    const posTokens = pos.name.toLowerCase().split(/\W+/).filter((w) => w.length > 1);
    if (posTokens.length === 0) continue;
    const hits = empTokens.filter((t) => posTokens.includes(t)).length;
    if (hits === 0) continue;
    const prec = hits / posTokens.length;
    const rec  = hits / empTokens.length;
    const f1   = (2 * prec * rec) / (prec + rec);
    if (!best || f1 > best.score || (f1 === best.score && pos.level > best.level)) {
      best = { id: pos.id, score: f1, level: pos.level };
    }
  }
  return best && best.score >= 0.35 ? best.id : null;
}

export async function careerRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /designations — returns org's designations with hierarchy (parent included)
  app.get('/designations', auth, async (req, reply) => {
    const designations = await app.prisma.designation.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });
    return reply.send(ok(designations));
  });

  // POST /designations — HR creates
  app.post('/designations', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = designationSchema.parse(req.body);
    const d = await app.prisma.designation.create({
      data: {
        organizationId: req.user.orgId,
        name: input.name,
        level: input.level,
        ...(input.department ? { department: input.department } : {}),
        ...(input.description ? { description: input.description } : {}),
        skills: input.skills,
        ...(input.parentId ? { parentId: input.parentId } : {}),
        ...(input.templateKey ? { templateKey: input.templateKey } : {}),
      },
    });
    return reply.status(201).send(ok(d));
  });

  // PATCH /designations/:id
  app.patch('/designations/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = designationSchema.partial().parse(req.body);
    await app.prisma.designation.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: input,
    });
    return reply.send(ok({ id }));
  });

  // DELETE /designations/:id
  app.delete('/designations/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    // Detach any employees linked to this designation before deleting
    await app.prisma.employee.updateMany({
      where: { organizationId: req.user.orgId, designationId: id },
      data: { designationId: null },
    });
    await app.prisma.designation.deleteMany({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok(null));
  });

  // ── POST /designations/seed ─────────────────────────────────
  // Populates (or re-populates) the org's designation hierarchy from the
  // selected industry template. Safe to call multiple times — upserts by
  // (organizationId, name).  Skips positions that already exist by name.
  app.post('/designations/seed', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);

    const org = await app.prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: { industryType: true },
    });
    if (!org) throw fail('Organization not found', 404);

    const industry = org.industryType as IndustryType;
    const template = INDUSTRY_TEMPLATES[industry];
    if (!template) throw fail(`No template for industry type: ${industry}`, 400);

    // Build positions level-by-level so parents always exist before children.
    // The template is already ordered by level (roots first), so we can
    // insert in template order while building a key→id map.
    const keyToId = new Map<string, string>();

    // First pass: upsert all positions without parentId
    for (const pos of template) {
      const existing = await app.prisma.designation.findFirst({
        where: { organizationId: req.user.orgId, templateKey: pos.key },
        select: { id: true },
      });

      if (existing) {
        keyToId.set(pos.key, existing.id);
        continue;
      }

      // Check if a designation with the same name exists (manually created)
      const byName = await app.prisma.designation.findFirst({
        where: { organizationId: req.user.orgId, name: pos.title },
        select: { id: true },
      });

      if (byName) {
        // Link the template key to the existing record
        await app.prisma.designation.update({
          where: { id: byName.id },
          data: { templateKey: pos.key, level: pos.level, department: pos.department ?? undefined },
        });
        keyToId.set(pos.key, byName.id);
        continue;
      }

      // Create new
      const created = await app.prisma.designation.create({
        data: {
          organizationId: req.user.orgId,
          name: pos.title,
          level: pos.level,
          department: pos.department,
          templateKey: pos.key,
        },
      });
      keyToId.set(pos.key, created.id);
    }

    // Second pass: set parentIds now that all IDs are known
    for (const pos of template) {
      if (!pos.parentKey) continue;
      const id = keyToId.get(pos.key);
      const parentId = keyToId.get(pos.parentKey);
      if (id && parentId) {
        await app.prisma.designation.update({
          where: { id },
          data: { parentId },
        });
      }
    }

    const count = keyToId.size;

    // ── Auto-link pass ──────────────────────────────────────────
    // After seeding, find all active employees whose designationId is
    // not yet set and try to match their free-text designation against
    // the now-known position list.  This covers employees hired before
    // the chart was initialised, as well as the "Integration Engineer"
    // → "Software Engineer" fuzzy-match case.
    const allPositions = await app.prisma.designation.findMany({
      where: { organizationId: req.user.orgId },
      select: { id: true, name: true, level: true },
    });

    const unlinkedEmps = await app.prisma.employee.findMany({
      where: {
        organizationId: req.user.orgId,
        designationId: null,
        designation: { not: null },
      },
      select: { id: true, designation: true },
    });

    let linked = 0;
    for (const emp of unlinkedEmps) {
      if (!emp.designation) continue;
      const matchId = autoMatchDesignation(emp.designation, allPositions);
      if (matchId) {
        await app.prisma.employee.update({ where: { id: emp.id }, data: { designationId: matchId } });
        linked++;
      }
    }

    return reply.send(ok({ seeded: count, linked, industry, template: industry }));
  });

  // ── GET /designations/with-employees ──────────────────────
  // Full position chart: designations + which employees fill them.
  // Employees linked via FK (designationId) are always included.
  // Employees with no FK but a free-text designation that fuzzy-matches
  // a position are soft-matched and included automatically — this handles
  // employees hired before the chart was initialised (e.g. "Integration
  // Engineer" → "Software Engineer") and newly hired employees before
  // the nightly FK sync runs.
  app.get('/designations/with-employees', auth, async (req, reply) => {
    const designations = await app.prisma.designation.findMany({
      where: { organizationId: req.user.orgId },
      include: {
        employees: {
          where: { status: 'ACTIVE', deletedAt: null },
          select: {
            id: true, firstName: true, lastName: true,
            avatarUrl: true, employeeCode: true,
          },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    // Soft-match: pick up employees that have free-text designation but no FK
    const positionList = designations.map((d) => ({ id: d.id, name: d.name, level: d.level }));

    const unlinked = await app.prisma.employee.findMany({
      where: {
        organizationId: req.user.orgId,
        status: 'ACTIVE',
        deletedAt: null,
        designationId: null,
        designation: { not: null },
      },
      select: {
        id: true, firstName: true, lastName: true,
        avatarUrl: true, employeeCode: true, designation: true,
      },
    });

    // Build designationId → soft-matched employees map
    const softMap = new Map<string, { id: string; firstName: string; lastName: string; avatarUrl: string | null; employeeCode: string }[]>();
    for (const emp of unlinked) {
      if (!emp.designation) continue;
      const matchId = autoMatchDesignation(emp.designation, positionList);
      if (!matchId) continue;
      if (!softMap.has(matchId)) softMap.set(matchId, []);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { designation: _d, ...rest } = emp;
      softMap.get(matchId)!.push(rest);
    }

    // Merge into result (FK-linked first, then soft-matched)
    const result = designations.map((d) => ({
      ...d,
      employees: [...d.employees, ...(softMap.get(d.id) ?? [])],
    }));

    return reply.send(ok(result));
  });

  // ── Org Chart Change Requests ─────────────────────────────────────────────

  // POST /designations/change-request — ORG_ADMIN submits a template change request
  app.post('/designations/change-request', auth, async (req, reply) => {
    if (req.user.role !== 'ORG_ADMIN') throw fail('Only Organisation Admins can request template changes', 403);

    const input = z.object({
      industryType: z.enum(INDUSTRY_TYPES),
      reason: z.string().max(500).optional(),
    }).parse(req.body);

    const org = await app.prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: { id: true, name: true, industryType: true },
    });
    if (!org) throw fail('Organization not found', 404);
    if (input.industryType === org.industryType) {
      throw fail('The requested template is the same as the current one — no change needed', 400);
    }

    const existing = await app.prisma.orgChartChangeRequest.findFirst({
      where: { organizationId: org.id, status: 'PENDING' },
    });
    if (existing) throw fail('A pending request already exists. Wait for the Super Admin to review it first.', 409);

    const requester = await app.prisma.employee.findUnique({
      where: { id: req.user.sub },
      select: { firstName: true, lastName: true, workEmail: true },
    });

    const request = await app.prisma.orgChartChangeRequest.create({
      data: {
        organizationId: org.id,
        requestedById: req.user.sub,
        currentIndustry: org.industryType,
        requestedIndustry: input.industryType,
        reason: input.reason,
      },
    });

    // Notify super admins by email (fire-and-forget)
    const superAdmins = await app.prisma.superAdmin.findMany({ select: { email: true, name: true } });
    for (const sa of superAdmins) {
      void sendEmail(
        sa.email,
        `[Action Required] Org Chart Template Change Request — ${org.name}`,
        orgChartRequestToSuperAdminEmail({
          superAdminName: sa.name,
          orgName: org.name,
          adminName: requester ? `${requester.firstName} ${requester.lastName}` : 'Org Admin',
          currentIndustry: org.industryType,
          requestedIndustry: input.industryType,
          reason: input.reason,
        }),
      );
    }

    return reply.status(201).send(ok(request));
  });

  // GET /designations/change-request/pending — returns this org's pending request (if any)
  app.get('/designations/change-request/pending', auth, async (req, reply) => {
    const request = await app.prisma.orgChartChangeRequest.findFirst({
      where: { organizationId: req.user.orgId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, currentIndustry: true, requestedIndustry: true,
        reason: true, status: true, createdAt: true,
        requestedBy: { select: { firstName: true, lastName: true } },
      },
    });
    return reply.send(ok(request ?? null));
  });

  // POST /designations/change-request/:id/approve — SUPER_ADMIN approves + seeds new template
  app.post('/designations/change-request/:id/approve', auth, async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') throw fail('Forbidden', 403);

    const { id } = req.params as { id: string };
    const input = z.object({ superAdminNote: z.string().max(500).optional() }).parse(req.body ?? {});

    const changeReq = await app.prisma.orgChartChangeRequest.findFirst({
      where: { id, organizationId: req.user.orgId },
      include: {
        requestedBy: { select: { firstName: true, lastName: true, workEmail: true } },
      },
    });
    if (!changeReq) throw fail('Request not found', 404);
    if (changeReq.status !== 'PENDING') throw fail('Request is no longer pending', 409);

    const org = await app.prisma.organization.findUnique({
      where: { id: req.user.orgId },
      select: { name: true },
    });

    // 1. Update org industry type
    await app.prisma.organization.update({
      where: { id: req.user.orgId },
      data: { industryType: changeReq.requestedIndustry },
    });

    // 2. Seed the new template (same logic as /designations/seed)
    const template = INDUSTRY_TEMPLATES[changeReq.requestedIndustry as IndustryType];
    if (template) {
      const keyToId = new Map<string, string>();
      for (const pos of template) {
        const existing = await app.prisma.designation.findFirst({
          where: { organizationId: req.user.orgId, templateKey: pos.key },
          select: { id: true },
        });
        if (existing) { keyToId.set(pos.key, existing.id); continue; }
        const byName = await app.prisma.designation.findFirst({
          where: { organizationId: req.user.orgId, name: pos.title },
          select: { id: true },
        });
        if (byName) {
          await app.prisma.designation.update({ where: { id: byName.id }, data: { templateKey: pos.key, level: pos.level, department: pos.department ?? undefined } });
          keyToId.set(pos.key, byName.id);
          continue;
        }
        const created = await app.prisma.designation.create({
          data: { organizationId: req.user.orgId, name: pos.title, level: pos.level, department: pos.department, templateKey: pos.key },
        });
        keyToId.set(pos.key, created.id);
      }
      for (const pos of template) {
        if (!pos.parentKey) continue;
        const pid = keyToId.get(pos.key);
        const parentId = keyToId.get(pos.parentKey);
        if (pid && parentId) await app.prisma.designation.update({ where: { id: pid }, data: { parentId } });
      }
    }

    // 3. Mark request resolved
    await app.prisma.orgChartChangeRequest.update({
      where: { id },
      data: { status: 'APPROVED', superAdminNote: input.superAdminNote, resolvedAt: new Date() },
    });

    // 4. Notify org admin by email
    if (changeReq.requestedBy.workEmail) {
      void sendEmail(
        changeReq.requestedBy.workEmail,
        `Your Org Chart Template Change Request has been Approved`,
        orgChartDecisionEmail({
          adminName: `${changeReq.requestedBy.firstName} ${changeReq.requestedBy.lastName}`,
          orgName: org?.name ?? '',
          requestedIndustry: changeReq.requestedIndustry,
          status: 'APPROVED',
          superAdminNote: input.superAdminNote,
        }),
      );
    }

    return reply.send(ok({ approved: true }));
  });

  // POST /designations/change-request/:id/reject — SUPER_ADMIN rejects
  app.post('/designations/change-request/:id/reject', auth, async (req, reply) => {
    if (req.user.role !== 'SUPER_ADMIN') throw fail('Forbidden', 403);

    const { id } = req.params as { id: string };
    const input = z.object({ superAdminNote: z.string().max(500).optional() }).parse(req.body ?? {});

    const changeReq = await app.prisma.orgChartChangeRequest.findFirst({
      where: { id, organizationId: req.user.orgId },
      include: {
        requestedBy: { select: { firstName: true, lastName: true, workEmail: true } },
        organization: { select: { name: true } },
      },
    });
    if (!changeReq) throw fail('Request not found', 404);
    if (changeReq.status !== 'PENDING') throw fail('Request is no longer pending', 409);

    await app.prisma.orgChartChangeRequest.update({
      where: { id },
      data: { status: 'REJECTED', superAdminNote: input.superAdminNote, resolvedAt: new Date() },
    });

    if (changeReq.requestedBy.workEmail) {
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

    return reply.send(ok({ rejected: true }));
  });

  // ── Career Paths ───────────────────────────────────────────

  app.get('/career-paths', auth, async (req, reply) => {
    const paths = await app.prisma.careerPath.findMany({
      where: { organizationId: req.user.orgId },
      include: { fromDesignation: true, toDesignation: true },
      orderBy: [{ fromDesignation: { level: 'asc' } }],
    });
    return reply.send(ok(paths));
  });

  app.get('/career-paths/from/:designationId', auth, async (req, reply) => {
    const { designationId } = req.params as { designationId: string };
    const paths = await app.prisma.careerPath.findMany({
      where: { organizationId: req.user.orgId, fromDesignationId: designationId },
      include: { toDesignation: true },
    });
    return reply.send(ok(paths));
  });

  app.post('/career-paths', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = pathSchema.parse(req.body);
    const path = await app.prisma.careerPath.create({
      data: { organizationId: req.user.orgId, ...input },
      include: { fromDesignation: true, toDesignation: true },
    });
    return reply.status(201).send(ok(path));
  });

  app.delete('/career-paths/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.careerPath.deleteMany({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok(null));
  });
}
