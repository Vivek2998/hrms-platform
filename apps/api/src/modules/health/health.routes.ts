import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    let dbOk = false;
    let redisOk = false;

    try {
      await app.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      /* health check sets flag */
    }

    try {
      await app.redis.ping();
      redisOk = true;
    } catch {
      /* health check sets flag */
    }

    const allOk = dbOk && redisOk;
    return reply.status(allOk ? 200 : 503).send({
      success: allOk,
      data: {
        status: allOk ? 'ok' : 'degraded',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        checks: { database: dbOk ? 'ok' : 'error', redis: redisOk ? 'ok' : 'error' },
      },
      error: allOk ? null : 'One or more health checks failed',
    });
  });
}
