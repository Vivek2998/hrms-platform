import type { FastifyRequest, FastifyReply } from 'fastify';
import type { OrgPlan } from '@hrms/shared-types';
import type { PrismaClient } from '@prisma/client';

const PLAN_RANK: Record<OrgPlan, number> = {
  FREE: 0,
  STARTER: 1,
  GROWTH: 2,
  ENTERPRISE: 3,
};

export function requirePlan(minPlan: OrgPlan) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const orgId = (req.user as { orgId?: string } | undefined)?.orgId;
    if (!orgId) {
      return reply.status(401).send({ success: false, data: null, error: 'Unauthorized' });
    }

    // Live DB lookup so plan upgrades/downgrades take effect immediately without re-login
    const prisma = (req.server as unknown as { prisma: PrismaClient }).prisma;
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });

    const plan = org?.plan as OrgPlan | undefined;
    const rank = plan != null ? (PLAN_RANK[plan] ?? -1) : -1;
    if (rank < PLAN_RANK[minPlan]) {
      return reply.status(402).send({
        success: false,
        data: null,
        error: `This feature requires the ${minPlan} plan or higher. Please upgrade your subscription.`,
      });
    }
  };
}
