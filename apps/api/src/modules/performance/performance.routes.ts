import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;
const MANAGER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;
type HrRole = (typeof HR_ROLES)[number];
type ManagerRole = (typeof MANAGER_ROLES)[number];

const createCycleSchema = z.object({
  name: z.string().min(2),
  frequency: z.enum(['ANNUAL', 'HALF_YEARLY', 'QUARTERLY']),
  startDate: z.string(),
  endDate: z.string(),
});

const createGoalSchema = z.object({
  cycleId: z.string().uuid(),
  employeeId: z.string().uuid().optional(), // HR/Manager can set goals for others
  title: z.string().min(1),
  description: z.string().optional(),
  targetValue: z.string().optional(),
  weightage: z.number().min(0.1).max(10).default(1),
  dueDate: z.string().optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  targetValue: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'MISSED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  weightage: z.number().min(0.1).max(10).optional(),
  dueDate: z.string().optional(),
});

const selfReviewSchema = z.object({
  selfRating: z.number().min(1).max(5),
  selfComments: z.string().optional(),
});

const managerReviewSchema = z.object({
  managerRating: z.number().min(1).max(5),
  managerComments: z.string().optional(),
  finalRating: z.number().min(1).max(5).optional(),
});

const peerFeedbackSchema = z.object({
  cycleId: z.string().uuid(),
  toId: z.string().uuid(),
  rating: z.number().min(1).max(5).optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
});

export function performanceRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── Cycles ────────────────────────────────────────────────

  app.get('/performance/cycles', auth, async (req, reply) => {
    const isHR = HR_ROLES.includes(req.user.role as HrRole);
    const cycles = await app.prisma.performanceCycle.findMany({
      where: { organizationId: req.user.orgId, ...(isHR ? {} : { status: 'ACTIVE' }) },
      include: { _count: { select: { goals: true, reviews: true } } },
      orderBy: { startDate: 'desc' },
    });
    return reply.send(ok(cycles));
  });

  app.post('/performance/cycles', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const input = createCycleSchema.parse(req.body);
    const cycle = await app.prisma.performanceCycle.create({
      data: {
        organizationId: req.user.orgId,
        name: input.name,
        frequency: input.frequency as any,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      },
    });
    return reply.status(201).send(ok(cycle));
  });

  app.patch('/performance/cycles/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = z.object({
      status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
      name: z.string().min(2).optional(),
    }).parse(req.body);
    const updated = await app.prisma.performanceCycle.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: input,
    });
    if (updated.count === 0) throw fail('Cycle not found', 404);
    return reply.send(ok({ id }));
  });

  // ── Bulk initialize reviews for ALL active employees ───────
  app.post('/performance/cycles/:cycleId/initialize-reviews', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { cycleId } = req.params as { cycleId: string };

    const cycle = await app.prisma.performanceCycle.findFirst({
      where: { id: cycleId, organizationId: req.user.orgId },
    });
    if (!cycle) throw fail('Cycle not found', 404);

    const employees = await app.prisma.employee.findMany({
      where: { organizationId: req.user.orgId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, managerId: true },
    });

    const existing = await app.prisma.performanceReview.findMany({
      where: { cycleId, employeeId: { in: employees.map((e) => e.id) } },
      select: { employeeId: true },
    });
    const existingSet = new Set(existing.map((r) => r.employeeId));
    const toCreate = employees.filter((e) => !existingSet.has(e.id));

    if (toCreate.length > 0) {
      await app.prisma.performanceReview.createMany({
        data: toCreate.map((emp) => ({
          cycleId,
          organizationId: req.user.orgId,
          employeeId: emp.id,
          reviewerId: emp.managerId ?? req.user.sub,
        })),
        skipDuplicates: true,
      });
    }

    return reply.send(ok({ created: toCreate.length, skipped: existingSet.size, total: employees.length }));
  });

  // ── Team Overview — all employees with their perf stats ────
  app.get('/performance/cycles/:cycleId/team-overview', auth, async (req, reply) => {
    if (!MANAGER_ROLES.includes(req.user.role as ManagerRole)) throw fail('Forbidden', 403);
    const { cycleId } = req.params as { cycleId: string };

    const cycle = await app.prisma.performanceCycle.findFirst({
      where: { id: cycleId, organizationId: req.user.orgId },
      select: { id: true },
    });
    if (!cycle) throw fail('Cycle not found', 404);

    const employees = await app.prisma.employee.findMany({
      where: { organizationId: req.user.orgId, deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true, firstName: true, lastName: true, designation: true,
        avatarUrl: true, employeeCode: true,
        department: { select: { name: true } },
      },
      orderBy: [{ firstName: 'asc' }],
    });

    const empIds = employees.map((e) => e.id);

    const [goals, reviews, peerFeedbacks] = await Promise.all([
      app.prisma.performanceGoal.findMany({
        where: { cycleId, employeeId: { in: empIds } },
        select: { employeeId: true, status: true, progress: true, weightage: true },
      }),
      app.prisma.performanceReview.findMany({
        where: { cycleId, employeeId: { in: empIds } },
        select: {
          employeeId: true, status: true,
          selfRating: true, managerRating: true, finalRating: true,
          reviewer: { select: { firstName: true, lastName: true } },
        },
      }),
      app.prisma.peerFeedback.findMany({
        where: { cycleId, toId: { in: empIds } },
        select: { toId: true, rating: true },
      }),
    ]);

    const result = employees.map((emp) => {
      const empGoals = goals.filter((g) => g.employeeId === emp.id);
      const review = reviews.find((r) => r.employeeId === emp.id) ?? null;
      const empPeer = peerFeedbacks.filter((f) => f.toId === emp.id);

      const totalGoals = empGoals.length;
      const achievedGoals = empGoals.filter((g) => g.status === 'ACHIEVED').length;
      const totalWeight = empGoals.reduce((s, g) => s + g.weightage, 0);
      const weightedProgress =
        totalWeight > 0
          ? Math.round(
              empGoals.reduce((s, g) => s + g.progress * g.weightage, 0) / totalWeight,
            )
          : 0;

      const ratedPeer = empPeer.filter((f) => f.rating != null);
      const avgPeerRating =
        ratedPeer.length > 0
          ? Math.round(
              (ratedPeer.reduce((s, f) => s + (f.rating ?? 0), 0) / ratedPeer.length) * 10,
            ) / 10
          : null;

      return {
        employee: emp,
        totalGoals,
        achievedGoals,
        weightedProgress,
        review,
        peerFeedbackCount: empPeer.length,
        avgPeerRating,
      };
    });

    return reply.send(ok(result));
  });

  // ── Goals ──────────────────────────────────────────────────

  app.get('/performance/cycles/:cycleId/goals', auth, async (req, reply) => {
    const { cycleId } = req.params as { cycleId: string };
    const isManagerRole = MANAGER_ROLES.includes(req.user.role as ManagerRole);
    const qs = req.query as { employeeId?: string };

    const goals = await app.prisma.performanceGoal.findMany({
      where: {
        cycleId,
        cycle: { organizationId: req.user.orgId },
        ...(isManagerRole && qs.employeeId
          ? { employeeId: qs.employeeId }
          : !isManagerRole
          ? { employeeId: req.user.sub }
          : {}),
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(ok(goals));
  });

  app.post('/performance/goals', auth, async (req, reply) => {
    const input = createGoalSchema.parse(req.body);
    const isManagerRole = MANAGER_ROLES.includes(req.user.role as ManagerRole);
    const targetEmployeeId =
      isManagerRole && input.employeeId ? input.employeeId : req.user.sub;

    const goal = await app.prisma.performanceGoal.create({
      data: {
        cycleId: input.cycleId,
        organizationId: req.user.orgId,
        employeeId: targetEmployeeId,
        title: input.title,
        ...(input.description ? { description: input.description } : {}),
        ...(input.targetValue ? { targetValue: input.targetValue } : {}),
        weightage: input.weightage,
        ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
      },
    });
    return reply.status(201).send(ok(goal));
  });

  app.patch('/performance/goals/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const input = updateGoalSchema.parse(req.body);
    const isHR = HR_ROLES.includes(req.user.role as HrRole);

    const updated = await app.prisma.performanceGoal.updateMany({
      where: {
        id,
        ...(isHR ? {} : { employeeId: req.user.sub }),
      },
      data: {
        ...input,
        ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
      },
    });
    if (updated.count === 0) throw fail('Goal not found', 404);
    return reply.send(ok({ id }));
  });

  app.delete('/performance/goals/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const isHR = HR_ROLES.includes(req.user.role as HrRole);
    await app.prisma.performanceGoal.deleteMany({
      where: {
        id,
        ...(isHR
          ? { cycle: { organizationId: req.user.orgId } }
          : { employeeId: req.user.sub }),
      },
    });
    return reply.send(ok({ id }));
  });

  // ── Reviews ────────────────────────────────────────────────

  app.get('/performance/cycles/:cycleId/reviews', auth, async (req, reply) => {
    const { cycleId } = req.params as { cycleId: string };
    const isHR = HR_ROLES.includes(req.user.role as HrRole);
    const isManager = req.user.role === 'MANAGER';
    const reviews = await app.prisma.performanceReview.findMany({
      where: {
        cycleId,
        cycle: { organizationId: req.user.orgId },
        ...(isHR
          ? {}
          : isManager
          ? { reviewerId: req.user.sub }
          : { employeeId: req.user.sub }),
      },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true,
            avatarUrl: true, designation: true, employeeCode: true,
            department: { select: { name: true } },
          },
        },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(ok(reviews));
  });

  app.post('/performance/cycles/:cycleId/reviews', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { cycleId } = req.params as { cycleId: string };
    const input = z
      .object({ employeeId: z.string().uuid(), reviewerId: z.string().uuid() })
      .parse(req.body);
    const review = await app.prisma.performanceReview.upsert({
      where: { cycleId_employeeId: { cycleId, employeeId: input.employeeId } },
      create: {
        cycleId,
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        reviewerId: input.reviewerId,
      },
      update: { reviewerId: input.reviewerId },
    });
    return reply.status(201).send(ok(review));
  });

  app.patch('/performance/reviews/:reviewId/self', auth, async (req, reply) => {
    const { reviewId } = req.params as { reviewId: string };
    const input = selfReviewSchema.parse(req.body);
    const updated = await app.prisma.performanceReview.updateMany({
      where: { id: reviewId, employeeId: req.user.sub },
      data: { ...input, status: 'SELF_SUBMITTED', selfSubmittedAt: new Date() },
    });
    if (updated.count === 0) throw fail('Review not found', 404);
    return reply.send(ok({ reviewId }));
  });

  app.patch('/performance/reviews/:reviewId/manager', auth, async (req, reply) => {
    if (!MANAGER_ROLES.includes(req.user.role as ManagerRole)) throw fail('Forbidden', 403);
    const { reviewId } = req.params as { reviewId: string };
    const input = managerReviewSchema.parse(req.body);
    const isHR = HR_ROLES.includes(req.user.role as HrRole);

    // HR can complete any review in their org; managers only their assigned ones
    const updated = await app.prisma.performanceReview.updateMany({
      where: {
        id: reviewId,
        cycle: { organizationId: req.user.orgId },
        ...(isHR ? {} : { reviewerId: req.user.sub }),
      },
      data: {
        managerRating: input.managerRating,
        ...(input.managerComments ? { managerComments: input.managerComments } : {}),
        finalRating: input.finalRating ?? input.managerRating,
        status: 'COMPLETED',
        managerSubmittedAt: new Date(),
      },
    });
    if (updated.count === 0) throw fail('Review not found', 404);
    return reply.send(ok({ reviewId }));
  });

  // ── Peer Feedback ──────────────────────────────────────────

  app.get('/performance/peer-feedback', auth, async (req, reply) => {
    const isHR = HR_ROLES.includes(req.user.role as HrRole);
    const qs = req.query as { cycleId?: string; employeeId?: string };
    const feedbacks = await app.prisma.peerFeedback.findMany({
      where: {
        cycle: { organizationId: req.user.orgId },
        ...(qs.cycleId ? { cycleId: qs.cycleId } : {}),
        ...(isHR
          ? qs.employeeId
            ? { toId: qs.employeeId }
            : {} // HR sees all if no filter
          : { toId: req.user.sub }), // Employees only see feedback they received
      },
      include: {
        from: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        to: { select: { id: true, firstName: true, lastName: true } },
        cycle: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(feedbacks));
  });

  app.post('/performance/peer-feedback', auth, async (req, reply) => {
    const input = peerFeedbackSchema.parse(req.body);
    if (input.toId === req.user.sub) throw fail('Cannot give feedback to yourself', 400);
    const feedback = await app.prisma.peerFeedback.upsert({
      where: { cycleId_fromId_toId: { cycleId: input.cycleId, fromId: req.user.sub, toId: input.toId } },
      create: {
        cycleId: input.cycleId,
        organizationId: req.user.orgId,
        fromId: req.user.sub,
        toId: input.toId,
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.strengths ? { strengths: input.strengths } : {}),
        ...(input.improvements ? { improvements: input.improvements } : {}),
      },
      update: {
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.strengths ? { strengths: input.strengths } : {}),
        ...(input.improvements ? { improvements: input.improvements } : {}),
      },
    });
    return reply.status(201).send(ok(feedback));
  });
}
