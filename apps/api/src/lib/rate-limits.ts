import type { FastifyRequest } from 'fastify';

const IS_DEV = process.env['NODE_ENV'] !== 'production';

const rateLimitErrorBuilder = (_req: FastifyRequest, context: { ttl: number }) => ({
  success: false,
  data: null,
  error: `Too many attempts — please try again in ${Math.ceil(context.ttl / 1000)} seconds`,
});

// 5 attempts per 15 minutes in production; 100 per 15 minutes in dev/test
export const authRateLimit = {
  config: {
    rateLimit: {
      max: IS_DEV ? 100 : 5,
      timeWindow: '15 minutes',
      errorResponseBuilder: rateLimitErrorBuilder,
      keyGenerator: (req: FastifyRequest) => {
        const body = req.body as Record<string, unknown> | undefined;
        // /auth/login and /auth/forgot-password use 'email'; /auth/register uses 'adminEmail'
        const email = (body?.['email'] ?? body?.['adminEmail']) as string | undefined;
        return email ? `auth:${req.ip}:${email.toLowerCase()}` : `auth:${req.ip}`;
      },
    },
  },
};

// Stricter limit for super admin: 3 attempts per 30 minutes in prod; 100 in dev/test
export const superAdminRateLimit = {
  config: {
    rateLimit: {
      max: IS_DEV ? 100 : 3,
      timeWindow: '30 minutes',
      errorResponseBuilder: rateLimitErrorBuilder,
      keyGenerator: (req: FastifyRequest) => `superauth:${req.ip}`,
    },
  },
};
