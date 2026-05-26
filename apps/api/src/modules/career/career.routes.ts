import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';
import { INDUSTRY_TEMPLATES, type IndustryType } from '../../lib/industry-templates.js';

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
    return reply.send(ok({ seeded: count, industry, template: industry }));
  });

  // ── GET /designations/with-employees ──────────────────────
  // Full position chart: designations + which employees fill them.
  // Used exclusively by the org chart page.
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
    return reply.send(ok(designations));
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
