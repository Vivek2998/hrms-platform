import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;
type HrRole = (typeof HR_ROLES)[number];

const jobSchema = z.object({
  title: z.string().min(2),
  departmentId: z.string().uuid().optional(),
  location: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).default('FULL_TIME'),
  description: z.string().min(10),
  requirements: z.string().optional(),
  minSalary: z.number().positive().optional(),
  maxSalary: z.number().positive().optional(),
  openings: z.number().int().min(1).default(1),
  closingDate: z.string().optional(),
});

const applicationSchema = z.object({
  candidateName: z.string().min(2),
  candidateEmail: z.string().email(),
  candidatePhone: z.string().optional(),
  resumeUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  source: z.string().optional(),
  referredBy: z.string().uuid().optional(),
});

const interviewSchema = z.object({
  interviewerIds: z.array(z.string().uuid()).min(1),
  scheduledAt: z.string(),
  durationMinutes: z.number().int().default(60),
  mode: z.enum(['VIDEO', 'IN_PERSON', 'PHONE']).default('VIDEO'),
  meetingLink: z.string().optional(),
  venue: z.string().optional(),
  round: z.number().int().default(1),
});

export function recruitmentRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // ── Jobs ──────────────────────────────────────────────────

  app.get('/recruitment/jobs', auth, async (req, reply) => {
    const isHR = HR_ROLES.includes(req.user.role as HrRole);
    const qs = z.object({ status: z.enum(['OPEN', 'FILLED', 'CLOSED']).optional() }).parse(req.query);
    const jobs = await app.prisma.jobPosting.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(isHR ? (qs.status ? { status: qs.status } : {}) : { status: 'OPEN' }),
      },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(jobs));
  });

  app.post('/recruitment/jobs', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const input = jobSchema.parse(req.body);
    const job = await app.prisma.jobPosting.create({
      data: {
        organizationId: req.user.orgId,
        title: input.title,
        ...(input.location ? { location: input.location } : {}),
        employmentType: input.employmentType as any,
        description: input.description,
        ...(input.requirements ? { requirements: input.requirements } : {}),
        ...(input.minSalary !== undefined ? { minSalary: input.minSalary } : {}),
        ...(input.maxSalary !== undefined ? { maxSalary: input.maxSalary } : {}),
        openings: input.openings,
        ...(input.closingDate ? { closingDate: new Date(input.closingDate) } : {}),
      },
    });
    return reply.status(201).send(ok(job));
  });

  app.patch('/recruitment/jobs/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = jobSchema.partial().extend({
      status: z.enum(['OPEN', 'FILLED', 'CLOSED']).optional(),
    }).parse(req.body);
    const { departmentId: _departmentId, ...jobInput } = input;
    const updated = await app.prisma.jobPosting.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: {
        ...jobInput,
        ...(input.employmentType ? { employmentType: input.employmentType as any } : {}),
        ...(input.closingDate ? { closingDate: new Date(input.closingDate) } : {}),
      },
    });
    if (updated.count === 0) throw fail('Job not found', 404);
    return reply.send(ok({ id }));
  });

  app.delete('/recruitment/jobs/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    await app.prisma.jobPosting.deleteMany({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok({ id }));
  });

  // ── Applications ───────────────────────────────────────────

  app.get('/recruitment/applications', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const qs = req.query as { jobId?: string; stage?: string };
    const applications = await app.prisma.jobApplication.findMany({
      where: {
        job: { organizationId: req.user.orgId },
        ...(qs.jobId ? { jobId: qs.jobId } : {}),
        ...(qs.stage ? { stage: qs.stage as any } : {}),
      },
      include: {
        job: { select: { id: true, title: true } },
        _count: { select: { interviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(applications));
  });

  app.post('/recruitment/jobs/:jobId/apply', auth, async (req, reply) => {
    const { jobId } = req.params as { jobId: string };
    const job = await app.prisma.jobPosting.findFirst({
      where: { id: jobId, organizationId: req.user.orgId, status: 'OPEN' },
    });
    if (!job) throw fail('Job not found or not open', 404);
    const input = applicationSchema.parse(req.body);
    const application = await app.prisma.jobApplication.create({
      data: {
        jobId,
        candidateName: input.candidateName,
        candidateEmail: input.candidateEmail,
        ...(input.candidatePhone ? { candidatePhone: input.candidatePhone } : {}),
        ...(input.resumeUrl ? { resumeUrl: input.resumeUrl } : {}),
        ...(input.coverLetter ? { coverLetter: input.coverLetter } : {}),
        ...(input.source ? { source: input.source } : {}),
      },
    });
    return reply.status(201).send(ok(application));
  });

  app.patch('/recruitment/applications/:id/stage', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = z.object({
      stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']),
      notes: z.string().optional(),
      rejectionReason: z.string().optional(),
    }).parse(req.body);
    const updated = await app.prisma.jobApplication.updateMany({
      where: { id, job: { organizationId: req.user.orgId } },
      data: {
        stage: input.stage as any,
        ...(input.rejectionReason ? { rejectionReason: input.rejectionReason } : {}),
      },
    });
    if (updated.count === 0) throw fail('Application not found', 404);
    return reply.send(ok({ id }));
  });

  // ── Interviews ─────────────────────────────────────────────

  app.get('/recruitment/applications/:id/interviews', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id: applicationId } = req.params as { id: string };
    const interviews = await app.prisma.interviewSchedule.findMany({
      where: { applicationId, application: { job: { organizationId: req.user.orgId } } },
      orderBy: { scheduledAt: 'asc' },
    });
    return reply.send(ok(interviews));
  });

  app.post('/recruitment/applications/:id/interviews', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id: applicationId } = req.params as { id: string };
    const input = interviewSchema.parse(req.body);
    const application = await app.prisma.jobApplication.findFirst({
      where: { id: applicationId, job: { organizationId: req.user.orgId } },
      select: { id: true },
    });
    if (!application) throw fail('Application not found', 404);
    const interviewers = await app.prisma.employee.findMany({
      where: { id: { in: input.interviewerIds }, organizationId: req.user.orgId },
      select: { firstName: true, lastName: true },
    });
    const notes = [`Round ${String(input.round)}`, input.meetingLink, input.venue].filter(Boolean).join(' · ');
    const interview = await app.prisma.interviewSchedule.create({
      data: {
        applicationId,
        scheduledAt: new Date(input.scheduledAt),
        durationMins: input.durationMinutes,
        mode: input.mode,
        ...(interviewers.length
          ? { interviewerName: interviewers.map((e) => `${e.firstName} ${e.lastName}`).join(', ') }
          : {}),
        notes,
      },
    });
    return reply.status(201).send(ok(interview));
  });

  app.patch('/recruitment/interviews/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as HrRole)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = z.object({
      status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
      feedback: z.string().optional(),
      rating: z.number().int().min(1).max(5).optional(),
    }).parse(req.body);
    const { rating: _rating, ...interviewInput } = input;
    const updated = await app.prisma.interviewSchedule.updateMany({
      where: { id, application: { job: { organizationId: req.user.orgId } } },
      data: interviewInput,
    });
    if (updated.count === 0) throw fail('Interview not found', 404);
    return reply.send(ok({ id }));
  });
}
