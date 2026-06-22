import type { FastifyRequest, FastifyReply } from 'fastify';
import type { OrgPlan } from '@hrms/shared-types';
import type { PrismaClient } from '@prisma/client';

const PLAN_RANK: Record<OrgPlan, number> = {
  FREE: 0,
  STARTER: 1,
  GROWTH: 2,
  ENTERPRISE: 3,
};

// QUALITY-01: Cache TTL for org plan in Redis (5 minutes).
// Means a plan downgrade takes effect within 5 minutes without requiring re-login.
// Invalidate the cache key whenever a plan is changed via super-admin.
const PLAN_CACHE_TTL = 300;

// Set of all valid plan values — used to reject corrupted/tampered cache entries.
const VALID_PLANS = new Set<string>(Object.keys(PLAN_RANK));

export function planCacheKey(orgId: string) {
  return `org:plan:${orgId}`;
}

export function requirePlan(minPlan: OrgPlan) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const orgId = (req.user as { orgId?: string } | undefined)?.orgId;
    if (!orgId) {
      return reply.status(401).send({ success: false, data: null, error: 'Unauthorized' });
    }

    const server = req.server as unknown as {
      prisma: PrismaClient;
      redis: { get: (key: string) => Promise<string | null>; setex: (key: string, seconds: number, value: string) => Promise<unknown>; del: (key: string) => Promise<unknown> };
    };
    const cacheKey = planCacheKey(orgId);

    // QUALITY-01: Try Redis cache first; fall back to DB on miss.
    // Always validate the cached string is a known plan — a corrupted or
    // tampered Redis value must never grant or deny access incorrectly.
    let plan: OrgPlan | null = null;
    const cached = await server.redis.get(cacheKey);
    if (cached && VALID_PLANS.has(cached)) {
      plan = cached as OrgPlan;
    } else {
      // Cache miss (or invalid cached value) — go to the DB.
      if (cached && !VALID_PLANS.has(cached)) {
        // Evict the bad entry so the next request re-warms it correctly.
        await server.redis.del(cacheKey);
      }
      const org = await server.prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true },
      });
      if (!org) {
        // Org was deleted after the JWT was issued — treat as unauthenticated.
        return reply.status(401).send({ success: false, data: null, error: 'Unauthorized' });
      }
      plan = (org.plan as OrgPlan) ?? null;
      if (plan) {
        await server.redis.setex(cacheKey, PLAN_CACHE_TTL, plan);
      }
    }

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
