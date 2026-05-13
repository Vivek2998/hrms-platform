import type { FastifyRequest, FastifyReply } from 'fastify';
import type { OrgPlan } from '@hrms/shared-types';

const PLAN_RANK: Record<OrgPlan, number> = {
  FREE: 0,
  STARTER: 1,
  GROWTH: 2,
  ENTERPRISE: 3,
};

export function requirePlan(minPlan: OrgPlan) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const plan = (req.user as { orgPlan?: OrgPlan } | undefined)?.orgPlan;
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
