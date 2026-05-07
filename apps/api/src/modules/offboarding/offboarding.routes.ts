import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;
type HrRole = (typeof HR_ROLES)[number];

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedRole: z.enum(['HR', 'IT', 'FINANCE', 'MANAGER', 'EMPLOYEE']).default('HR'),
  dueBeforeDays: z.number().int().min(0).default(0),
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
  lastWorkingDate: z.string(),
});

const exitInterviewSchema = z.object({
  reasonForLeaving: z.string().optional(),
  jobSatisfaction: z.number().int().min(1).max(5).optional(),
  managementRating: z.number().int().min(1).max(5).optional(),
  workEnvRating: z.number().int().min(1).max(5).optional(),
  compensationRating: z.number().int().min(1).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
  suggestions: z.string().optional(),
});

export function offboardingRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── Templates ─────────────────────────────────────────────

  app.get('/offboarding/templates', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const templates = await app.prisma.offboardingTemplate.findMany({
      where: { organizationId: req.user.orgId, isActive: true },
      include: { _count: { select: { tasks: true, assignments: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(templates));
  });

  app.post('/offboarding/templates', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const input = createTemplateSchema.parse(req.body);
    const template = await app.prisma.offboardingTemplate.create({
      data: {
        organizationId: req.user.orgId,
        name: input.name,
        ...(input.description ? { description: input.description } : {}),
        tasks: {
          create: input.tasks.map((t, i) => ({
            title: t.title,
            ...(t.description ? { description: t.description } : {}),
            assignedRole: t.assignedRole,
            dueBeforeDays: t.dueBeforeDays,
            isRequired: t.isRequired,
            displayOrder: i,
          })),
        },
      },
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
    });
    return reply.status(201).send(ok(template));
  });

  app.delete('/offboarding/templates/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const updated = await app.prisma.offboardingTemplate.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: { isActive: false },
    });
    if (updated.count === 0) throw fail('Template not found', 404);
    return reply.send(ok({ id }));
  });

  // ── Assignments ───────────────────────────────────────────

  app.get('/offboarding/assignments', auth, async (req, reply) => {
    const isHR = HR_ROLES.includes(req.user.role as HrRole);
    const assignments = await app.prisma.offboardingAssignment.findMany({
      where: { organizationId: req.user.orgId, ...(isHR ? {} : { employeeId: req.user.sub }) },
      include: {
        template: { select: { id: true, name: true } },
        employee: { select: { id: true, firstName: true, lastName: true, designation: true, avatarUrl: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const completedCount = await app.prisma.offboardingAssignmentTask.count({
          where: { assignmentId: a.id, status: { in: ['COMPLETED', 'SKIPPED'] } },
        });
        return { ...a, completedTasks: completedCount };
      }),
    );
    return reply.send(ok(enriched));
  });

  app.get('/offboarding/assignments/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const isHR = HR_ROLES.includes(req.user.role as HrRole);
    const assignment = await app.prisma.offboardingAssignment.findFirst({
      where: { id, organizationId: req.user.orgId, ...(isHR ? {} : { employeeId: req.user.sub }) },
      include: {
        tasks: { orderBy: { dueDate: 'asc' } },
        employee: { select: { id: true, firstName: true, lastName: true, designation: true } },
        template: { select: { id: true, name: true } },
      },
    });
    if (!assignment) throw fail('Assignment not found', 404);
    return reply.send(ok(assignment));
  });

  app.post('/offboarding/assignments', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const input = createAssignmentSchema.parse(req.body);
    const lastWorkingDate = new Date(input.lastWorkingDate);

    const template = await app.prisma.offboardingTemplate.findFirst({
      where: { id: input.templateId, organizationId: req.user.orgId, isActive: true },
      include: { tasks: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!template) throw fail('Template not found', 404);

    const employee = await app.prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId: req.user.orgId },
    });
    if (!employee) throw fail('Employee not found', 404);

    const assignment = await app.prisma.offboardingAssignment.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        templateId: input.templateId,
        lastWorkingDate,
        tasks: {
          create: template.tasks.map((t) => {
            const dueDate = new Date(lastWorkingDate);
            dueDate.setDate(dueDate.getDate() - t.dueBeforeDays);
            return { taskId: t.id, title: t.title, assignedRole: t.assignedRole, dueDate };
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

  app.patch('/offboarding/assignments/:id/tasks/:taskId', auth, async (req, reply) => {
    const { id, taskId } = req.params as { id: string; taskId: string };
    const { status, notes } = z.object({
      status: z.enum(['PENDING', 'COMPLETED', 'SKIPPED']),
      notes: z.string().optional(),
    }).parse(req.body);

    const assignment = await app.prisma.offboardingAssignment.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!assignment) throw fail('Assignment not found', 404);

    const task = await app.prisma.offboardingAssignmentTask.update({
      where: { id: taskId },
      data: { status, ...(notes ? { notes } : {}), completedAt: status === 'COMPLETED' ? new Date() : null },
    });

    const allTasks = await app.prisma.offboardingAssignmentTask.findMany({ where: { assignmentId: id } });
    const allDone = allTasks.every((t) => t.status !== 'PENDING');
    if (allDone && assignment.status !== 'COMPLETED') {
      await app.prisma.offboardingAssignment.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
    return reply.send(ok(task));
  });

  // ── Exit Interview ─────────────────────────────────────────

  app.get('/offboarding/assignments/:id/exit-interview', auth, async (req, reply) => {
    const { id: assignmentId } = req.params as { id: string };
    const interview = await app.prisma.exitInterview.findUnique({ where: { assignmentId } });
    return reply.send(ok(interview));
  });

  app.post('/offboarding/assignments/:id/exit-interview', auth, async (req, reply) => {
    const { id: assignmentId } = req.params as { id: string };
    const input = exitInterviewSchema.parse(req.body);
    const assignment = await app.prisma.offboardingAssignment.findFirst({
      where: { id: assignmentId, organizationId: req.user.orgId },
    });
    if (!assignment) throw fail('Assignment not found', 404);
    const interview = await app.prisma.exitInterview.upsert({
      where: { assignmentId },
      create: {
        organizationId: req.user.orgId,
        assignmentId,
        employeeId: assignment.employeeId,
        ...input,
        conductedAt: new Date(),
      },
      update: { ...input, conductedAt: new Date() },
    });
    return reply.status(201).send(ok(interview));
  });
}
