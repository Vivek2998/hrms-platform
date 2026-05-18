import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response.js';

const createSchema = z.object({
  requestedTo: z.string().uuid(),
  documentName: z.string().min(2).max(200),
  documentUrl: z.string().url(),
  documentId: z.string().uuid().optional(),
  message: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

const signSchema = z.object({
  signatureImageUrl: z.string().url(),
});

const declineSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

const employeeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  designation: true,
  avatarUrl: true,
  employeeCode: true,
};

export function eSignatureRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /esignatures/my-requests  — requests I created
  app.get('/esignatures/my-requests', auth, async (req, reply) => {
    const requests = await app.prisma.eSignatureRequest.findMany({
      where: { organizationId: req.user.orgId, requestedBy: req.user.sub },
      include: {
        requester: { select: employeeSelect },
        signer: { select: employeeSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(requests));
  });

  // GET /esignatures/pending  — requests pending MY signature
  app.get('/esignatures/pending', auth, async (req, reply) => {
    const requests = await app.prisma.eSignatureRequest.findMany({
      where: {
        organizationId: req.user.orgId,
        requestedTo: req.user.sub,
        status: 'PENDING',
      },
      include: {
        requester: { select: employeeSelect },
        signer: { select: employeeSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(ok(requests));
  });

  // GET /esignatures  — all (HR/Admin only)
  app.get('/esignatures', auth, async (req, reply) => {
    const { role, orgId } = req.user;
    if (!['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    const requests = await app.prisma.eSignatureRequest.findMany({
      where: { organizationId: orgId },
      include: {
        requester: { select: employeeSelect },
        signer: { select: employeeSelect },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return reply.send(ok(requests));
  });

  // POST /esignatures  — create a signature request
  app.post('/esignatures', auth, async (req, reply) => {
    const input = createSchema.parse(req.body);

    const signer = await app.prisma.employee.findFirst({
      where: { id: input.requestedTo, organizationId: req.user.orgId },
    });
    if (!signer) return reply.status(404).send({ message: 'Signer not found' });

    const request = await app.prisma.eSignatureRequest.create({
      data: {
        organizationId: req.user.orgId,
        requestedBy: req.user.sub,
        requestedTo: input.requestedTo,
        documentName: input.documentName,
        documentUrl: input.documentUrl,
        documentId: input.documentId,
        message: input.message,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
      include: {
        requester: { select: employeeSelect },
        signer: { select: employeeSelect },
      },
    });

    return reply.status(201).send(ok(request));
  });

  // PATCH /esignatures/:id/sign  — signer signs the document
  app.patch('/esignatures/:id/sign', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { signatureImageUrl } = signSchema.parse(req.body);

    const request = await app.prisma.eSignatureRequest.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!request) return reply.status(404).send({ message: 'Not found' });
    if (request.requestedTo !== req.user.sub) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    if (request.status !== 'PENDING') {
      return reply.status(400).send({ message: 'Request is not pending' });
    }

    const updated = await app.prisma.eSignatureRequest.update({
      where: { id },
      data: { status: 'SIGNED', signedAt: new Date(), signatureImageUrl },
      include: {
        requester: { select: employeeSelect },
        signer: { select: employeeSelect },
      },
    });

    return reply.send(ok(updated));
  });

  // PATCH /esignatures/:id/decline  — signer declines
  app.patch('/esignatures/:id/decline', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { reason } = declineSchema.parse(req.body ?? {});

    const request = await app.prisma.eSignatureRequest.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!request) return reply.status(404).send({ message: 'Not found' });
    if (request.requestedTo !== req.user.sub) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
    if (request.status !== 'PENDING') {
      return reply.status(400).send({ message: 'Request is not pending' });
    }

    const updated = await app.prisma.eSignatureRequest.update({
      where: { id },
      data: { status: 'DECLINED', declinedAt: new Date(), declineReason: reason },
      include: {
        requester: { select: employeeSelect },
        signer: { select: employeeSelect },
      },
    });

    return reply.send(ok(updated));
  });

  // DELETE /esignatures/:id  — requester or HR/Admin can cancel
  app.delete('/esignatures/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };
    const request = await app.prisma.eSignatureRequest.findFirst({
      where: { id, organizationId: req.user.orgId },
    });
    if (!request) return reply.status(404).send({ message: 'Not found' });

    const isOwner = request.requestedBy === req.user.sub;
    const isAdmin = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(req.user.role);
    if (!isOwner && !isAdmin) return reply.status(403).send({ message: 'Forbidden' });

    await app.prisma.eSignatureRequest.delete({ where: { id } });
    return reply.send(ok(null));
  });
}
