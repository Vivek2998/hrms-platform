import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const holidaySchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['NATIONAL', 'REGIONAL', 'OPTIONAL']).default('NATIONAL'),
});

export function holidayRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /holidays?year=2026
  app.get('/holidays', auth, async (req, reply) => {
    const year = Number(
      (req.query as Record<string, string>)['year'] ?? new Date().getFullYear(),
    );

    const holidays = await app.prisma.holiday.findMany({
      where: { organizationId: req.user.orgId, year },
      orderBy: { date: 'asc' },
    });

    return reply.send(ok(holidays));
  });

  // POST /holidays  (HR / Admin only)
  app.post('/holidays', auth, async (req, reply) => {
    const input = holidaySchema.parse(req.body);
    const date = new Date(input.date + 'T00:00:00.000Z');

    const holiday = await app.prisma.holiday.create({
      data: {
        organizationId: req.user.orgId,
        name: input.name,
        date,
        type: input.type,
        year: date.getUTCFullYear(),
      },
    });

    return reply.status(201).send(ok(holiday));
  });

  // DELETE /holidays/:id  (HR / Admin only)
  app.delete('/holidays/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const holiday = await app.prisma.holiday.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!holiday) throw fail('Holiday not found', 404);

    await app.prisma.holiday.delete({ where: { id } });

    return reply.send(ok({ message: 'Holiday deleted' }));
  });
}
