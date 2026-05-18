import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response.js';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const courseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().url().optional(),
  category: z.string().max(100).default('General'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  durationMinutes: z.coerce.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
  externalUrl: z.string().url().optional(),
});

const progressSchema = z.object({
  progressPct: z.coerce.number().int().min(0).max(100),
});

const employeeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  designation: true,
  avatarUrl: true,
  employeeCode: true,
};

export function lmsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /lms/courses  — all published courses visible to the org
  app.get('/lms/courses', auth, async (req, reply) => {
    const query = z
      .object({
        category: z.string().optional(),
        level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
        search: z.string().optional(),
      })
      .parse(req.query);

    const isAdmin = (ADMIN_ROLES as readonly string[]).includes(req.user.role);

    const courses = await app.prisma.learningCourse.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(isAdmin ? {} : { status: 'PUBLISHED' }),
        ...(query.category && { category: query.category }),
        ...(query.level && { level: query.level }),
        ...(query.search && {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        createdBy: { select: employeeSelect },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach employee's own enrollment if any
    const enrollments = await app.prisma.courseEnrollment.findMany({
      where: { organizationId: req.user.orgId, employeeId: req.user.sub },
      select: { courseId: true, status: true, progressPct: true },
    });
    const enrollMap = new Map(enrollments.map((e) => [e.courseId, e]));

    const result = courses.map((c) => ({
      ...c,
      myEnrollment: enrollMap.get(c.id) ?? null,
    }));

    return reply.send(ok(result));
  });

  // GET /lms/my-courses  — courses the employee is enrolled in
  app.get('/lms/my-courses', auth, async (req, reply) => {
    const enrollments = await app.prisma.courseEnrollment.findMany({
      where: { organizationId: req.user.orgId, employeeId: req.user.sub },
      include: {
        course: {
          include: { createdBy: { select: employeeSelect } },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
    return reply.send(ok(enrollments));
  });

  // POST /lms/courses  — HR/Admin creates a course
  app.post('/lms/courses', auth, async (req, reply) => {
    if (!(ADMIN_ROLES as readonly string[]).includes(req.user.role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const input = courseSchema.parse(req.body);
    const course = await app.prisma.learningCourse.create({
      data: {
        organizationId: req.user.orgId,
        createdById: req.user.sub,
        ...input,
        status: 'PUBLISHED',
      },
      include: {
        createdBy: { select: employeeSelect },
        _count: { select: { enrollments: true } },
      },
    });
    return reply.status(201).send(ok(course));
  });

  // PATCH /lms/courses/:id  — HR/Admin updates a course
  app.patch('/lms/courses/:id', auth, async (req, reply) => {
    if (!(ADMIN_ROLES as readonly string[]).includes(req.user.role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const { id } = req.params as { id: string };
    const input = courseSchema.partial().parse(req.body);
    const course = await app.prisma.learningCourse.update({
      where: { id },
      data: input,
      include: { createdBy: { select: employeeSelect }, _count: { select: { enrollments: true } } },
    });
    return reply.send(ok(course));
  });

  // DELETE /lms/courses/:id  — HR/Admin deletes
  app.delete('/lms/courses/:id', auth, async (req, reply) => {
    if (!(ADMIN_ROLES as readonly string[]).includes(req.user.role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const { id } = req.params as { id: string };
    await app.prisma.learningCourse.delete({ where: { id } });
    return reply.send(ok(null));
  });

  // POST /lms/courses/:id/enroll  — employee self-enrolls
  app.post('/lms/courses/:id/enroll', auth, async (req, reply) => {
    const { id: courseId } = req.params as { id: string };
    const course = await app.prisma.learningCourse.findFirst({
      where: { id: courseId, organizationId: req.user.orgId, status: 'PUBLISHED' },
    });
    if (!course) return reply.status(404).send({ message: 'Course not found' });

    const enrollment = await app.prisma.courseEnrollment.upsert({
      where: { courseId_employeeId: { courseId, employeeId: req.user.sub } },
      create: {
        organizationId: req.user.orgId,
        courseId,
        employeeId: req.user.sub,
        status: 'ENROLLED',
      },
      update: { status: 'ENROLLED' },
    });
    return reply.status(201).send(ok(enrollment));
  });

  // PATCH /lms/courses/:id/progress  — update progress %
  app.patch('/lms/courses/:id/progress', auth, async (req, reply) => {
    const { id: courseId } = req.params as { id: string };
    const { progressPct } = progressSchema.parse(req.body);

    const enrollment = await app.prisma.courseEnrollment.findFirst({
      where: { courseId, employeeId: req.user.sub, organizationId: req.user.orgId },
    });
    if (!enrollment) return reply.status(404).send({ message: 'Not enrolled' });

    const updated = await app.prisma.courseEnrollment.update({
      where: { courseId_employeeId: { courseId, employeeId: req.user.sub } },
      data: {
        progressPct,
        status: progressPct >= 100 ? 'COMPLETED' : progressPct > 0 ? 'IN_PROGRESS' : 'ENROLLED',
        completedAt: progressPct >= 100 ? new Date() : null,
      },
    });
    return reply.send(ok(updated));
  });
}
