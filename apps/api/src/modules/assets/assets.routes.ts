import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const assetSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['LAPTOP','DESKTOP','PHONE','TABLET','MONITOR','KEYBOARD','MOUSE','HEADSET','CHAIR','DESK','ID_CARD','ACCESS_CARD','OTHER']).optional().default('OTHER'),
  serialNumber: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().positive().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export async function assetRoutes(app: FastifyInstance) {
  const hrRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

  // ── GET /assets ─────────────────────────────────────────────
  app.get('/assets', { preHandler: [app.authenticate] }, async (req, reply) => {
    const isHr = hrRoles.includes(req.user.role);

    if (isHr) {
      const assets = await app.prisma.asset.findMany({
        where: { organizationId: req.user.orgId },
        include: {
          assignments: {
            where: { returnedAt: null },
            include: {
              employee: {
                select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true },
              },
            },
            take: 1,
            orderBy: { assignedAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send({ data: assets });
    }

    // Employee — my assigned assets only
    const assignments = await app.prisma.assetAssignment.findMany({
      where: { organizationId: req.user.orgId, employeeId: req.user.sub, returnedAt: null },
      include: { asset: true },
      orderBy: { assignedAt: 'desc' },
    });
    return reply.send({ data: assignments.map(a => ({ ...a.asset, assignedAt: a.assignedAt, condition: a.condition })) });
  });

  // ── POST /assets ─────────────────────────────────────────────
  app.post('/assets', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!hrRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const body = assetSchema.parse(req.body);
    const asset = await app.prisma.asset.create({
      data: {
        organizationId: req.user.orgId,
        ...body,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
      },
    });
    return reply.status(201).send({ data: asset });
  });

  // ── PATCH /assets/:id ────────────────────────────────────────
  app.patch('/assets/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!hrRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const body = assetSchema.partial().parse(req.body);
    const asset = await app.prisma.asset.updateMany({
      where: { id, organizationId: req.user.orgId },
      data: {
        ...body,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        warrantyExpiry: body.warrantyExpiry ? new Date(body.warrantyExpiry) : undefined,
      },
    });
    if (asset.count === 0) return reply.status(404).send({ error: 'Not found' });
    return reply.send({ id });
  });

  // ── DELETE /assets/:id ───────────────────────────────────────
  app.delete('/assets/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!hrRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    await app.prisma.asset.deleteMany({ where: { id, organizationId: req.user.orgId } });
    return reply.send({ id });
  });

  // ── POST /assets/:id/assign ──────────────────────────────────
  app.post('/assets/:id/assign', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!hrRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const { employeeId, notes, condition } = z.object({
      employeeId: z.string().uuid(),
      notes: z.string().optional(),
      condition: z.string().optional(),
    }).parse(req.body);

    const asset = await app.prisma.asset.findFirst({ where: { id, organizationId: req.user.orgId } });
    if (!asset) return reply.status(404).send({ error: 'Asset not found' });
    if (asset.status === 'ASSIGNED') return reply.status(409).send({ error: 'Asset already assigned' });

    const [assignment] = await app.prisma.$transaction([
      app.prisma.assetAssignment.create({
        data: { organizationId: req.user.orgId, assetId: id, employeeId, notes, condition },
      }),
      app.prisma.asset.update({ where: { id }, data: { status: 'ASSIGNED' } }),
    ]);
    return reply.status(201).send({ data: assignment });
  });

  // ── POST /assets/:id/return ──────────────────────────────────
  app.post('/assets/:id/return', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!hrRoles.includes(req.user.role)) return reply.status(403).send({ error: 'Forbidden' });

    const { id } = req.params as any;
    const { condition, notes } = z.object({
      condition: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body ?? {});

    const activeAssignment = await app.prisma.assetAssignment.findFirst({
      where: { assetId: id, organizationId: req.user.orgId, returnedAt: null },
      orderBy: { assignedAt: 'desc' },
    });
    if (!activeAssignment) return reply.status(404).send({ error: 'No active assignment' });

    await app.prisma.$transaction([
      app.prisma.assetAssignment.update({
        where: { id: activeAssignment.id },
        data: { returnedAt: new Date(), condition, notes },
      }),
      app.prisma.asset.update({ where: { id }, data: { status: 'AVAILABLE' } }),
    ]);
    return reply.send({ id });
  });
}
