import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const documentBodySchema = z.object({
  employeeId: z.string().uuid(),
  type: z.enum([
    'OFFER_LETTER',
    'APPOINTMENT_LETTER',
    'ID_PROOF',
    'ADDRESS_PROOF',
    'EDUCATIONAL',
    'PAYSLIP',
    'FORM_16',
    'EXPERIENCE_LETTER',
    'RELIEVING_LETTER',
    'OTHER',
  ]),
  name: z.string().min(1).max(200),
  url: z.string().url(),
  size: z.number().int().optional(),
  mimeType: z.string().optional(),
});

export function documentRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /documents?employeeId=:id
  app.get('/documents', auth, async (req, reply) => {
    const { employeeId } = req.query as { employeeId?: string };

    const docs = await app.prisma.document.findMany({
      where: {
        organizationId: req.user.orgId,
        ...(employeeId && { employeeId }),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(ok(docs));
  });

  // POST /documents — store document metadata after Cloudinary upload
  app.post('/documents', auth, async (req, reply) => {
    const input = documentBodySchema.parse(req.body);

    // Verify the employee belongs to this org
    const employee = await app.prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId: req.user.orgId, deletedAt: null },
    });
    if (!employee) throw fail('Employee not found', 404);

    const doc = await app.prisma.document.create({
      data: {
        organizationId: req.user.orgId,
        employeeId: input.employeeId,
        type: input.type,
        name: input.name,
        url: input.url,
        size: input.size,
        mimeType: input.mimeType,
        uploadedBy: req.user.sub,
      },
    });

    return reply.status(201).send(ok(doc));
  });

  // DELETE /documents/:id  (soft delete)
  app.delete('/documents/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string };

    const doc = await app.prisma.document.findFirst({
      where: { id, organizationId: req.user.orgId, deletedAt: null },
    });
    if (!doc) throw fail('Document not found', 404);

    await app.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return reply.send(ok({ message: 'Document deleted' }));
  });
}
