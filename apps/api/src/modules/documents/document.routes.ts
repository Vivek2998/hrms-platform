import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];
const APPROVER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

const ALL_DOC_TYPES = [
  'OFFER_LETTER', 'APPOINTMENT_LETTER', 'PAYSLIP', 'FORM_16',
  'EXPERIENCE_LETTER', 'RELIEVING_LETTER', 'ID_PROOF', 'ADDRESS_PROOF',
  'EDUCATIONAL', 'ID_CARD', 'INSURANCE', 'NDA', 'AGREEMENT',
  'COMPANY_POLICY', 'BACKGROUND_CHECK', 'MEDICAL_CERTIFICATE', 'PF_STATEMENT', 'OTHER',
] as const;

const documentBodySchema = z.object({
  employeeId: z.string().uuid(),
  type: z.enum(ALL_DOC_TYPES),
  name: z.string().min(1).max(200),
  url: z.string().url(),
  size: z.number().int().optional(),
  mimeType: z.string().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(500).optional(),
});

const rejectBodySchema = z.object({ notes: z.string().min(1).max(500) });

export function documentRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /documents?employeeId=:id
  // HR/Admin can see any employee's docs; employees & managers can only see their own
  app.get('/documents', auth, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const { employeeId } = req.query as { employeeId?: string };

    // Determine whose docs to fetch
    let targetEmployeeId: string | undefined = employeeId;

    // Non-HR roles can only see their own documents
    if (!HR_ROLES.includes(role) && role !== 'MANAGER') {
      targetEmployeeId = userId;
    } else if (role === 'MANAGER' && employeeId !== userId) {
      // Managers can see their own + their direct reports (for approval inbox),
      // but for now restrict to HR_ROLES for other-employee access
      // Simple approach: managers can see their own docs only unless they're HR
      targetEmployeeId = userId;
    }

    const docs = await app.prisma.document.findMany({
      where: {
        organizationId: orgId,
        ...(targetEmployeeId ? { employeeId: targetEmployeeId } : {}),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send(ok(docs));
  });

  // POST /documents — store document metadata after Cloudinary upload
  // HR_ROLES → status APPROVED automatically; others → PENDING_APPROVAL
  app.post('/documents', auth, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const input = documentBodySchema.parse(req.body);

    // Verify the employee belongs to this org
    const employee = await app.prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId: orgId, deletedAt: null },
    });
    if (!employee) throw fail('Employee not found', 404);

    // Non-HR employees can only upload documents for themselves
    if (!HR_ROLES.includes(role) && input.employeeId !== userId) {
      return reply.status(403).send({ message: 'You can only upload documents for yourself' });
    }

    const isHR = HR_ROLES.includes(role);
    const status = isHR ? 'APPROVED' : 'PENDING_APPROVAL';

    const doc = await app.prisma.document.create({
      data: {
        organizationId: orgId,
        employeeId: input.employeeId,
        type: input.type,
        name: input.name,
        url: input.url,
        size: input.size,
        mimeType: input.mimeType,
        uploadedBy: userId,
        status,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        notes: input.notes,
      },
    });

    return reply.status(201).send(ok(doc));
  });

  // PATCH /documents/:id/approve — APPROVER_ROLES only
  app.patch('/documents/:id/approve', auth, async (req, reply) => {
    const { orgId, role } = req.user;
    const { id } = req.params as { id: string };

    if (!APPROVER_ROLES.includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }

    const doc = await app.prisma.document.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!doc) throw fail('Document not found', 404);

    if (doc.status !== 'PENDING_APPROVAL') {
      return reply.status(400).send({ message: 'Document is not pending approval' });
    }

    const updated = await app.prisma.document.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    return reply.send(ok(updated));
  });

  // PATCH /documents/:id/reject — APPROVER_ROLES only, requires notes
  app.patch('/documents/:id/reject', auth, async (req, reply) => {
    const { orgId, role } = req.user;
    const { id } = req.params as { id: string };

    if (!APPROVER_ROLES.includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }

    const { notes } = rejectBodySchema.parse(req.body);

    const doc = await app.prisma.document.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!doc) throw fail('Document not found', 404);

    if (doc.status !== 'PENDING_APPROVAL') {
      return reply.status(400).send({ message: 'Document is not pending approval' });
    }

    const updated = await app.prisma.document.update({
      where: { id },
      data: { status: 'REJECTED', notes },
    });

    return reply.send(ok(updated));
  });

  // DELETE /documents/:id (soft delete)
  // HR can delete any doc; employees can only delete their own PENDING_APPROVAL docs
  app.delete('/documents/:id', auth, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const { id } = req.params as { id: string };

    const doc = await app.prisma.document.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!doc) throw fail('Document not found', 404);

    const isHR = HR_ROLES.includes(role);

    if (!isHR) {
      // Employees/Managers can only delete their own documents that are still pending
      if (doc.employeeId !== userId) {
        return reply.status(403).send({ message: 'You can only delete your own documents' });
      }
      if (doc.status !== 'PENDING_APPROVAL') {
        return reply.status(403).send({ message: 'Only pending documents can be deleted by employees' });
      }
    }

    await app.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return reply.send(ok({ message: 'Document deleted' }));
  });
}
