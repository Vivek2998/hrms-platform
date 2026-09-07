import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';

export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyRateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    redis: app.redis,
    errorResponseBuilder: (_req, context) => ({
      success: false,
      data: null,
      error: `Too many requests — please try again in ${Math.ceil((context as { ttl: number }).ttl / 1000)} seconds`,
    }),
  });
});
