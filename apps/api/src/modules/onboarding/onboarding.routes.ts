import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedRole: z.enum(['HR', 'IT', 'FINANCE', 'MANAGER', 'EMPLOYEE']).default('HR'),
  dueAfterDays: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

const createTemplateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  tasks: z.array(taskSchema).min(1),
});

const createAssignmentSchema = z.object({
  employeeId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export function onboardingRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── Templates ──────────────────────────────────────────────

  // GET /onboarding/templates
  app.get('/onboarding/templates', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as typeof HR_ROLES[number])) throw fail('Forbidden', 403);

    const templates = await app.prisma.onboardingTemplate.findMany({
      where: { organizationId: req.user.orgId, isActive: true },
      include: { _count: { select: { tasks: true, assignments: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(ok(templates));
  });

  // POST /onboarding/templates
  app.post('/onboarding/templates', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as typeof HR_ROLES[number])) throw fail('Forbidden', 403);
    const input = createTemplateSchema.parse(req.body);

    const template = await app.prisma.onboardingTemplate.create({
      data: {
        organizationId: req.user.orgId,
        name: input.name,
        ...(input.description ? { description: input.description } : {}),
        tasks: {
          create: input.tasks.map((t) => ({
            title: t.title,
            ...(t.description ? { description: t.description } : {}),
            assignedRole: t.assignedRole,
            dueAfterDays: t.dueAfterDays,
            isRequired: t.isRequired,
            displayOrder: t.displayOrder,
          })),
        },
      },
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
    });

    return reply.status(201).send(ok(template));
  });

  // GET /onboarding/templates/:id
  app.get('/onboarding/templates/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as typeof HR_ROLES[number])) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };

    const template = await app.prisma.onboardingTemplate.findFirst({
      where: { id, organizationId: req.user.orgId },
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!template) throw fail('Template not found', 404);

    return reply.send(ok(template));
  });

  // DELETE /onboarding/templates/:id — soft delete
  app.delete('/onboarding/templates/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as typeof HR_ROLES[number])) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };

    const updated = await app.prisma.onboardingTemplate.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { isActive: false },
    });
    if (updated.count === 0) throw fail('Template not found', 404);

    return reply.send(ok({ id }));
  });

  // ── Assignments ────────────────────────────────────────────

  // GET /onboarding/assignments — HR: all org; employee: own
  app.get('/onboarding/assignments', auth, async (req, reply) => {
    const isHR = HR_ROLES.includes(req.user.role as typeof HR_ROLES[number]);

    const assignments = await app.prisma.onboardingAssignment.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(isHR ? {} : { employeeId: req.user.sub }),
      },
      include: {
        template: { select: { id: true, name: true } },
        employee: { select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with completed task count
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const completedCount = await app.prisma.onboardingAssignmentTask.count({
          where: { assignmentId: a.id, status: 'COMPLETED' },
        });
        return { ...a, completedTasks: completedCount };
      }),
    );

    return reply.send(ok(enriched));
  });

  // POST /onboarding/assignments — HR assigns template to employee
  app.post('/onboarding/assignments', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as typeof HR_ROLES[number])) throw fail('Forbidden', 403);
    const input = createAssignmentSchema.parse(req.body);

    const template = await app.prisma.onboardingTemplate.findFirst({
      where: { id: input.templateId, organizationId: req.user.orgId, isActive: true },
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!template) throw fail('Template not found', 404);

    const employee = await app.prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId: req.user.orgId },
    });
    if (!employee) throw fail('Employee not found', 404);

    const startDate = new Date();

    const assignment = await app.prisma.onboardingAssignment.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        templateId: input.templateId,
        tasks: {
          create: template.tasks.map((t) => {
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + t.dueAfterDays);
            return {
              taskId: t.id,
              title: t.title,
              assignedRole: t.assignedRole,
              dueDate,
            };
          }),
        },
      },
      include: {
        tasks: { orderBy: { createdAt: 'asc' } },
        employee: { select: { id: true, firstName: true, lastName: true } },
        template: { select: { id: true, name: true } },
      },
    });

    return reply.status(201).send(ok(assignment));
  });

  // GET /onboarding/assignments/:id
  app.get('/onboarding/assignments/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const isHR = HR_ROLES.includes(req.user.role as typeof HR_ROLES[number]);

    const assignment = await app.prisma.onboardingAssignment.findFirst({
      where: {
        id,
        organizationId: req.user.orgId,
        ...(isHR ? {} : { employeeId: req.user.sub }),
      },
      include: {
        tasks: { orderBy: { dueDate: 'asc' } },
        employee: { select: { id: true, firstName: true, lastName: true, designation: true } },
        template: { select: { id: true, name: true } },
      },
    });
    if (!assignment) throw fail('Assignment not found', 404);

    return reply.send(ok(assignment));
  });

  // PATCH /onboarding/assignments/:id/tasks/:taskId — update task status
  app.patch('/onboarding/assignments/:id/tasks/:taskId', auth, async (req, reply) => {
    const { id, taskId } = req.params as { id: string; taskId: string };
    const { status, notes } = z
      .object({
        status: z.enum(['PENDING', 'COMPLETED', 'SKIPPED']),
        notes: z.string().optional(),
      })
      .parse(req.body);

    const assignment = await app.prisma.onboardingAssignment.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!assignment) throw fail('Assignment not found', 404);

    const task = await app.prisma.onboardingAssignmentTask.update({
      where: { id: taskId },
      data: {
        status,
        ...(notes ? { notes } : {}),
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    // Auto-complete assignment if all required tasks are done/skipped
    const allTasks = await app.prisma.onboardingAssignmentTask.findMany({
      where: { assignmentId: id },
    });
    const allDone = allTasks.every((t) => t.status !== 'PENDING');
    if (allDone && assignment.status !== 'COMPLETED') {
      await app.prisma.onboardingAssignment.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    return reply.send(ok(task));
  });
}
