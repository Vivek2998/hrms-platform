import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;
const APPROVER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN'] as const;

const componentSchema = z.object({
  code: z.string(),
  name: z.string(),
  amount: z.number(),
});

const createSchema = z.object({
  employeeId: z.string().uuid(),
  effectiveFrom: z.string(),
  proposedCtc: z.number().positive(),
  proposedBasic: z.number().positive(),
  proposedGross: z.number().positive(),
  proposedNetPay: z.number().positive(),
  components: z.array(componentSchema),
  reason: z.string().min(5),
});

const empSelect = {
  id: true, firstName: true, lastName: true,
  employeeCode: true, designation: true, avatarUrl: true,
  department: { select: { name: true } },
};

export async function salaryRevisionProposalRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /salary-revision-proposals — HR sees all; employee sees own
  app.get('/salary-revision-proposals', auth, async (req, reply) => {
    const isHR = (HR_ROLES as readonly string[]).includes(req.user.role);
    const proposals = await app.prisma.salaryRevisionProposal.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(!isHR ? { employeeId: req.user.sub } : {}),
      },
      include: {
        employee: { select: empSelect },
        proposedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(proposals));
  });

  // POST /salary-revision-proposals — HR proposes
  app.post('/salary-revision-proposals', auth, async (req, reply) => {
    if (!(HR_ROLES as readonly string[]).includes(req.user.role)) throw fail('Forbidden', 403);
    const input = createSchema.parse(req.body);

    const current = await app.prisma.salaryRevision.findFirst({
      where: { employeeId: input.employeeId, organizationId: req.user.orgId },
      orderBy: { effectiveFrom: 'desc' },
    });

    const proposal = await app.prisma.salaryRevisionProposal.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        proposedById: req.user.sub,
        effectiveFrom: new Date(input.effectiveFrom),
        currentCtc: current?.ctc ?? 0,
        proposedCtc: input.proposedCtc,
        currentBasic: current?.basic ?? 0,
        proposedBasic: input.proposedBasic,
        currentGross: current?.gross ?? 0,
        proposedGross: input.proposedGross,
        currentNetPay: current?.netPay ?? 0,
        proposedNetPay: input.proposedNetPay,
        components: input.components,
        reason: input.reason,
      },
      include: {
        employee: { select: empSelect },
        proposedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return reply.status(201).send(ok(proposal));
  });

  // PATCH /salary-revision-proposals/:id/approve
  app.patch('/salary-revision-proposals/:id/approve', auth, async (req, reply) => {
    if (!(APPROVER_ROLES as readonly string[]).includes(req.user.role as typeof APPROVER_ROLES[number])) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };

    const proposal = await app.prisma.salaryRevisionProposal.findFirst({
      where: { id, organizationId: req.user.orgId, status: 'PENDING' },
    });
    if (!proposal) throw fail('Proposal not found or already processed', 404);

    await app.prisma.$transaction([
      app.prisma.salaryRevisionProposal.update({
        where: { id },
        data: { status: 'APPROVED', approvedById: req.user.sub, approvedAt: new Date() },
      }),
      app.prisma.salaryRevision.create({
        data: {
          organizationId: req.user.orgId,
          employeeId: proposal.employeeId,
          effectiveFrom: proposal.effectiveFrom,
          ctc: proposal.proposedCtc,
          basic: proposal.proposedBasic,
          gross: proposal.proposedGross,
          netPay: proposal.proposedNetPay,
          components: proposal.components as any,
          reason: proposal.reason,
          approvedBy: req.user.sub,
        },
      }),
    ]);
    return reply.send(ok({ id, status: 'APPROVED' }));
  });

  // PATCH /salary-revision-proposals/:id/reject
  app.patch('/salary-revision-proposals/:id/reject', auth, async (req, reply) => {
    if (!(APPROVER_ROLES as readonly string[]).includes(req.user.role as typeof APPROVER_ROLES[number])) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);

    const proposal = await app.prisma.salaryRevisionProposal.findFirst({
      where: { id, organizationId: req.user.orgId, status: 'PENDING' },
    });
    if (!proposal) throw fail('Proposal not found or already processed', 404);

    await app.prisma.salaryRevisionProposal.update({
      where: { id },
      data: { status: 'REJECTED', approvedById: req.user.sub, approvedAt: new Date(), rejectedReason: reason },
    });
    return reply.send(ok({ id, status: 'REJECTED' }));
  });
}
