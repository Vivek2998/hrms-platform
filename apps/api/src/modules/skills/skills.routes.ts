import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;
const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;

const empSelect = {
  id: true, firstName: true, lastName: true, employeeCode: true,
  designation: true, avatarUrl: true,
  department: { select: { name: true } },
};

const skillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['TECHNICAL', 'SOFT_SKILL', 'DOMAIN', 'CERTIFICATION', 'LANGUAGE', 'TOOL']).default('TECHNICAL'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const employeeSkillSchema = z.object({
  skillId: z.string().uuid(),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('BEGINNER'),
  yearsOfExperience: z.number().min(0).optional(),
  lastUsedYear: z.number().int().optional(),
  certificationUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export async function skillsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── SKILL CATALOG (HR manages) ───────────────────────────────

  app.get('/skills', auth, async (req, reply) => {
    const { category } = req.query as { category?: string };
    const skills = await app.prisma.skill.findMany({
      where: {
        organizationId: req.user.orgId,
        isActive: true,
        ...(category ? { category } : {}),
      },
      include: {
        _count: { select: { employeeSkills: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return reply.send(ok(skills));
  });

  app.post('/skills', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = skillSchema.parse(req.body);
    const skill = await app.prisma.skill.create({
      data: { organizationId: req.user.orgId, ...input },
    });
    return reply.status(201).send(ok(skill));
  });

  app.patch('/skills/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = skillSchema.partial().parse(req.body);
    await app.prisma.skill.updateMany({ where: { id, organizationId: req.user.orgId }, data: input });
    return reply.send(ok({ id }));
  });

  app.delete('/skills/:id', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.skill.updateMany({ where: { id, organizationId: req.user.orgId }, data: { isActive: false } });
    return reply.send(ok(null));
  });

  // ── MY SKILLS (employee manages their own) ───────────────────

  app.get('/skills/my-skills', auth, async (req, reply) => {
    const skills = await app.prisma.employeeSkill.findMany({
      where: { employeeId: req.user.sub, organizationId: req.user.orgId },
      include: {
        skill: true,
        verifiedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(skills));
  });

  app.post('/skills/my-skills', auth, async (req, reply) => {
    const input = employeeSkillSchema.parse(req.body);
    const skill = await app.prisma.skill.findFirst({
      where: { id: input.skillId, organizationId: req.user.orgId },
    });
    if (!skill) throw fail('Skill not found', 404);

    const empSkill = await app.prisma.employeeSkill.upsert({
      where: { employeeId_skillId: { employeeId: req.user.sub, skillId: input.skillId } },
      create: {
        organizationId: req.user.orgId,
        employeeId: req.user.sub,
        ...input,
        certificationUrl: input.certificationUrl || undefined,
      },
      update: {
        proficiency: input.proficiency,
        yearsOfExperience: input.yearsOfExperience,
        lastUsedYear: input.lastUsedYear,
        certificationUrl: input.certificationUrl || undefined,
        notes: input.notes,
        // Reset verification on update
        isVerified: false,
        verifiedById: null,
        verifiedAt: null,
      },
      include: { skill: true },
    });
    return reply.status(201).send(ok(empSkill));
  });

  app.delete('/skills/my-skills/:skillId', auth, async (req, reply) => {
    const { skillId } = req.params as { skillId: string };
    await app.prisma.employeeSkill.deleteMany({
      where: { employeeId: req.user.sub, skillId, organizationId: req.user.orgId },
    });
    return reply.send(ok(null));
  });

  // ── EMPLOYEE SKILLS (HR/Manager can view any employee) ───────

  app.get('/skills/employees/:employeeId', auth, async (req, reply) => {
    const { employeeId } = req.params as { employeeId: string };
    const isManager = (MANAGER_ROLES as readonly string[]).includes(req.user.role);
    if (!isManager && employeeId !== req.user.sub) throw fail('Forbidden', 403);

    const skills = await app.prisma.employeeSkill.findMany({
      where: { employeeId, organizationId: req.user.orgId },
      include: {
        skill: true,
        verifiedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ skill: { category: 'asc' } }, { proficiency: 'desc' }],
    });
    return reply.send(ok(skills));
  });

  // PATCH /skills/verify/:employeeId/:skillId — manager/HR verifies a skill
  app.patch('/skills/verify/:employeeId/:skillId', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const { employeeId, skillId } = req.params as { employeeId: string; skillId: string };

    await app.prisma.employeeSkill.updateMany({
      where: { employeeId, skillId, organizationId: req.user.orgId },
      data: { isVerified: true, verifiedById: req.user.sub, verifiedAt: new Date() },
    });
    return reply.send(ok({ employeeId, skillId, verified: true }));
  });

  // ── SKILLS MATRIX (HR only — full org view) ──────────────────

  // GET /skills/matrix — all employees with their skills
  app.get('/skills/matrix', auth, async (req, reply) => {
    if (!(MANAGER_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);

    const { skillId, category, search } = req.query as {
      skillId?: string; category?: string; search?: string;
    };

    // Get employees that have at least one skill
    const employeeSkills = await app.prisma.employeeSkill.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(skillId ? { skillId } : {}),
        ...(category ? { skill: { category } } : {}),
      },
      include: {
        skill: true,
        employee: { select: empSelect },
      },
      orderBy: [{ employee: { firstName: 'asc' } }, { skill: { category: 'asc' } }],
    });

    // Group by employee
    const byEmployee = new Map<string, { employee: any; skills: any[] }>();
    for (const es of employeeSkills) {
      if (!byEmployee.has(es.employeeId)) {
        byEmployee.set(es.employeeId, { employee: es.employee, skills: [] });
      }
      byEmployee.get(es.employeeId)!.skills.push({
        skillId: es.skillId,
        skillName: es.skill.name,
        category: es.skill.category,
        proficiency: es.proficiency,
        yearsOfExperience: es.yearsOfExperience,
        isVerified: es.isVerified,
      });
    }

    let rows = Array.from(byEmployee.values());

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.employee.firstName.toLowerCase().includes(q) ||
        r.employee.lastName.toLowerCase().includes(q) ||
        r.employee.employeeCode.toLowerCase().includes(q) ||
        (r.employee.department?.name ?? '').toLowerCase().includes(q),
      );
    }

    return reply.send(ok(rows));
  });

  // GET /skills/search?skillId=&proficiency= — find employees with a specific skill
  app.get('/skills/search', auth, async (req, reply) => {
    const { skillId, proficiency } = req.query as { skillId?: string; proficiency?: string };
    if (!skillId) throw fail('skillId required', 400);

    const results = await app.prisma.employeeSkill.findMany({
      where: {
        organizationId: req.user.orgId,
        skillId,
        ...(proficiency ? { proficiency } : {}),
      },
      include: {
        employee: { select: empSelect },
        skill: true,
      },
      orderBy: { proficiency: 'desc' },
    });

    return reply.send(ok(results));
  });

  // GET /skills/summary — quick stats
  app.get('/skills/summary', auth, async (req, reply) => {
    const orgId = req.user.orgId;
    const [totalSkills, totalTagged, verifiedCount] = await Promise.all([
      app.prisma.skill.count({ where: { organizationId: orgId, isActive: true } }),
      app.prisma.employeeSkill.count({ where: { organizationId: orgId } }),
      app.prisma.employeeSkill.count({ where: { organizationId: orgId, isVerified: true } }),
    ]);
    return reply.send(ok({ totalSkills, totalTagged, verifiedCount }));
  });
}
