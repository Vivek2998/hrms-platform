import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

const deviceSchema = z.object({
  name: z.string().min(2),
  vendor: z.enum(['ZKTECO', 'ESSL', 'OTHER']),
  serialNumber: z.string().optional(),
  ipAddress: z.string().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

const webhookSchema = z.object({
  deviceId: z.string(),
  employeeId: z.string().optional(),
  eventType: z.enum(['PUNCH_IN', 'PUNCH_OUT', 'UNKNOWN']),
  deviceTime: z.string(),
  raw: z.any().optional(),
});

export async function biometricDevicesRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get('/biometric-devices', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const data = await app.prisma.biometricDevice.findMany({
      where: { organizationId: req.user.orgId },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(data));
  });

  app.post('/biometric-devices', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = deviceSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const device = await app.prisma.biometricDevice.create({
      data: { organizationId: req.user.orgId, ...body.data },
    });
    return reply.status(201).send(ok(device));
  });

  app.patch('/biometric-devices/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const body = deviceSchema.partial().safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { id } = req.params as any;
    const device = await app.prisma.biometricDevice.update({
      where: { id, organizationId: req.user.orgId },
      data: body.data,
    });
    return reply.send(ok(device));
  });

  app.delete('/biometric-devices/:id', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { id } = req.params as any;
    await app.prisma.biometricDevice.delete({ where: { id, organizationId: req.user.orgId } });
    return reply.send(ok(null));
  });

  // Webhook: device pushes punch events (no auth — device-initiated)
  app.post('/biometric-devices/webhook', async (req, reply) => {
    const body = webhookSchema.safeParse(req.body);
    if (!body.success) throw fail(body.error.message, 400);
    const { deviceId, employeeId, eventType, deviceTime, raw } = body.data;
    const device = await app.prisma.biometricDevice.findUnique({ where: { id: deviceId } });
    if (!device) throw fail('Device not found', 404);
    const log = await app.prisma.biometricDeviceLog.create({
      data: { deviceId, employeeId, eventType, deviceTime: new Date(deviceTime), raw: raw ?? undefined },
    });
    await app.prisma.biometricDevice.update({ where: { id: deviceId }, data: { lastSyncAt: new Date() } });
    return reply.status(201).send(ok(log));
  });

  app.get('/biometric-devices/:id/logs', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role as any)) throw fail('Forbidden', 403);
    const { id } = req.params as any;
    const logs = await app.prisma.biometricDeviceLog.findMany({
      where: { deviceId: id },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    });
    return reply.send(ok(logs));
  });
}
