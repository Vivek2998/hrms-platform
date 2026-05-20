import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response.js';

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  category: z
    .enum(['GENERAL', 'LEAVE', 'CODE_OF_CONDUCT', 'BENEFITS', 'SAFETY', 'OTHER'])
    .default('GENERAL'),
  version: z.string().optional(),
});

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'] as const;

export function hrPolicyRoutes(app: FastifyInstance) {
  // GET /hr-policies — all active policies (all authenticated roles)
  app.get('/hr-policies', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId } = req.user;
    const policies = await app.prisma.hrPolicy.findMany({
      where: { organizationId: orgId, isActive: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return reply.status(200).send(ok(policies));
  });

  // POST /hr-policies — HR only
  app.post('/hr-policies', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, sub: uploadedBy, role } = req.user;
    if (!(HR_ROLES as readonly string[]).includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const input = createSchema.parse(req.body);
    const policy = await app.prisma.hrPolicy.create({
      data: { organizationId: orgId, uploadedBy, ...input },
    });
    return reply.status(201).send(ok(policy));
  });

  // DELETE /hr-policies/:id — HR only (soft delete / archive)
  app.delete('/hr-policies/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, role } = req.user;
    if (!(HR_ROLES as readonly string[]).includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const { id } = req.params as { id: string };
    await app.prisma.hrPolicy.update({
      where: { id, organizationId: orgId },
      data: { isActive: false, deletedAt: new Date() },
    });
    return reply.status(200).send(ok({ message: 'Policy archived' }));
  });

  // POST /hr-policies/:id/acknowledge — employee acknowledges a policy
  app.post('/hr-policies/:id/acknowledge', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { orgId, sub: employeeId } = req.user;

    const policy = await app.prisma.hrPolicy.findFirst({ where: { id, organizationId: orgId, isActive: true } });
    if (!policy) return reply.status(404).send({ message: 'Policy not found' });

    await app.prisma.policyAcknowledgment.upsert({
      where: { policyId_employeeId: { policyId: id, employeeId } },
      create: { organizationId: orgId, policyId: id, employeeId },
      update: { acknowledgedAt: new Date() },
    });
    return reply.status(200).send(ok({ acknowledged: true }));
  });

  // GET /hr-policies/:id/acknowledgments — HR sees who acknowledged
  app.get('/hr-policies/:id/acknowledgments', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { orgId, role } = req.user;
    if (!(HR_ROLES as readonly string[]).includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const { id } = req.params as { id: string };
    const acks = await app.prisma.policyAcknowledgment.findMany({
      where: { organizationId: orgId, policyId: id },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, avatarUrl: true, designation: true } } },
      orderBy: { acknowledgedAt: 'desc' },
    });
    const total = await app.prisma.employee.count({ where: { organizationId: orgId, status: 'ACTIVE', deletedAt: null } });
    return reply.status(200).send(ok({ acknowledged: acks, total, pending: total - acks.length }));
  });
}
