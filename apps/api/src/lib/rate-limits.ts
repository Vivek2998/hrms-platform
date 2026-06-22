import type { FastifyRequest } from 'fastify';

// 5 attempts per 15 minutes, keyed by IP + email to prevent per-account brute force
export const authRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes',
      keyGenerator: (req: FastifyRequest) => {
        const body = req.body as Record<string, unknown> | undefined;
        // /auth/login and /auth/forgot-password use 'email'; /auth/register uses 'adminEmail'
        const email = (body?.['email'] ?? body?.['adminEmail']) as string | undefined;
        return email ? `auth:${req.ip}:${email.toLowerCase()}` : `auth:${req.ip}`;
      },
    },
  },
};

// Stricter limit for super admin: 3 attempts per 30 minutes, IP-keyed only
export const superAdminRateLimit = {
  config: {
    rateLimit: {
      max: 3,
      timeWindow: '30 minutes',
      keyGenerator: (req: FastifyRequest) => `superauth:${req.ip}`,
    },
  },
};
