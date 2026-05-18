import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(10).max(5000).default(100),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const adminRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

export function officeLocationRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /office-locations — all active locations for the org (any role, mobile needs this)
  app.get('/office-locations', auth, async (req, reply) => {
    const locations = await app.prisma.officeLocation.findMany({
      where: { organizationId: req.user.orgId },
      include: { _count: { select: { employees: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send(ok(locations));
  });

  // POST /office-locations
  app.post('/office-locations', auth, async (req, reply) => {
    if (!adminRoles.includes(req.user.role as never)) throw fail('Forbidden', 403);
    const input = createSchema.parse(req.body);
    const location = await app.prisma.officeLocation.create({
      data: { ...input, organizationId: req.user.orgId },
    });
    return reply.status(201).send(ok(location));
  });

  // PATCH /office-locations/:id
  app.patch('/office-locations/:id', auth, async (req, reply) => {
    if (!adminRoles.includes(req.user.role as never)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const input = updateSchema.parse(req.body);
    const existing = await app.prisma.officeLocation.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!existing) throw fail('Office location not found', 404);
    const updated = await app.prisma.officeLocation.update({ where: { id }, data: input });
    return reply.send(ok(updated));
  });

  // DELETE /office-locations/:id — unassigns all employees first
  app.delete('/office-locations/:id', auth, async (req, reply) => {
    if (!adminRoles.includes(req.user.role as never)) throw fail('Forbidden', 403);
    const { id } = req.params as { id: string };
    const existing = await app.prisma.officeLocation.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!existing) throw fail('Office location not found', 404);
    await app.prisma.$transaction([
      app.prisma.employee.updateMany({
        where: { officeLocationId: id },
        data: { officeLocationId: null },
      }),
      app.prisma.officeLocation.delete({ where: { id } }),
    ]);
    return reply.status(204).send();
  });

  // PATCH /office-locations/assign/:employeeId — assign an employee to a location
  app.patch('/office-locations/assign/:employeeId', auth, async (req, reply) => {
    if (!adminRoles.includes(req.user.role as never)) throw fail('Forbidden', 403);
    const { employeeId } = req.params as { employeeId: string };
    const { locationId } = z.object({ locationId: z.string().uuid().nullable() }).parse(req.body);

    const employee = await app.prisma.employee.findFirst({
      where: { id: employeeId, organizationId: req.user.orgId },
      select: { id: true, role: true },
    });
    if (!employee) throw fail('Employee not found', 404);

    // Role hierarchy: SUPER_ADMIN→all, ORG_ADMIN→HR+EMPLOYEE (not self), HR→EMPLOYEE (not self)
    const actorRole = req.user.role;
    const targetRole = employee.role;
    const isAllowed =
      actorRole === 'SUPER_ADMIN' ||
      (actorRole === 'ORG_ADMIN' &&
        employeeId !== req.user.sub &&
        (targetRole === 'HR' || targetRole === 'EMPLOYEE')) ||
      (actorRole === 'HR' &&
        employeeId !== req.user.sub &&
        targetRole === 'EMPLOYEE');

    if (!isAllowed) throw fail('You cannot assign office locations for this employee', 403);

    if (locationId !== null) {
      const location = await app.prisma.officeLocation.findFirst({
        where: { id: locationId, organizationId: req.user.orgId },
      });
      if (!location) throw fail('Office location not found', 404);
    }

    const updated = await app.prisma.employee.update({
      where: { id: employeeId },
      data: { officeLocationId: locationId },
      select: { id: true, officeLocationId: true, officeLocation: true },
    });
    return reply.send(ok(updated));
  });
}
