import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';

export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyRateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: () => ({
      success: false,
      data: null,
      error: 'Too many requests — please slow down',
    }),
  });
});
