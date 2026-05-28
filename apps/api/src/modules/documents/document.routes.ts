import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

// ── Role constants ─────────────────────────────────────────────────────────────
const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN'];
const APPROVER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'];

// ── Approval hierarchy ──────────────────────────────────────────────────────────
//   Admin upload  → auto-approved (top of chain)
//   HR upload     → pending, only Admin can approve
//   Employee/Manager upload → pending, HR or Admin can approve
function canApprove(approverRole: string, uploaderRole: string): boolean {
  if (ADMIN_ROLES.includes(approverRole)) return true; // Admin approves everything
  if (approverRole === 'HR' && (uploaderRole === 'EMPLOYEE' || uploaderRole === 'MANAGER')) return true;
  return false;
}

// ── Schema ─────────────────────────────────────────────────────────────────────
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

// ── Routes ─────────────────────────────────────────────────────────────────────
export function documentRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /documents?employeeId=:id
  // Returns documents enriched with uploaderRole for frontend hierarchy checks
  app.get('/documents', auth, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const { employeeId } = req.query as { employeeId?: string };

    // Non-privileged roles can only query their own documents
    let targetEmployeeId: string | undefined = employeeId;
    if (!APPROVER_ROLES.includes(role)) {
      targetEmployeeId = userId;
    } else if (role === 'MANAGER') {
      // Managers see only their own documents (not others' via this endpoint)
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

    // Enrich with uploader role so the frontend can enforce the hierarchy
    const uploaderIds = [...new Set(docs.map((d) => d.uploadedBy))];
    const uploaders = await app.prisma.employee.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, role: true },
    });
    const roleMap = Object.fromEntries(uploaders.map((u) => [u.id, u.role]));
    const enriched = docs.map((d) => ({
      ...d,
      uploaderRole: roleMap[d.uploadedBy] ?? 'EMPLOYEE',
    }));

    return reply.send(ok(enriched));
  });

  // POST /documents
  // Admin uploads → APPROVED; HR uploads → PENDING (Admin must approve);
  // Employee/Manager uploads → PENDING (HR or Admin must approve)
  app.post('/documents', auth, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const input = documentBodySchema.parse(req.body);

    // Verify employee belongs to this org
    const employee = await app.prisma.employee.findFirst({
      where: { id: input.employeeId, organizationId: orgId, deletedAt: null },
    });
    if (!employee) throw fail('Employee not found', 404);

    // Non-HR roles can only upload documents for themselves
    if (!ADMIN_ROLES.includes(role) && role !== 'HR' && input.employeeId !== userId) {
      return reply.status(403).send({ message: 'You can only upload documents for yourself' });
    }

    // Auto-approve only for Admin; HR and below go to PENDING_APPROVAL
    const status = ADMIN_ROLES.includes(role) ? 'APPROVED' : 'PENDING_APPROVAL';

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

    return reply.status(201).send(ok({ ...doc, uploaderRole: role }));
  });

  // PATCH /documents/:id/approve
  // Hierarchy enforced: Admin approves HR docs; HR approves Employee/Manager docs
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

    // Look up the uploader's role to enforce the hierarchy
    const uploader = await app.prisma.employee.findUnique({
      where: { id: doc.uploadedBy },
      select: { role: true },
    });
    const uploaderRole = uploader?.role ?? 'EMPLOYEE';

    if (!canApprove(role, uploaderRole)) {
      return reply.status(403).send({
        message: uploaderRole === 'HR'
          ? 'Only an Admin can approve documents uploaded by HR'
          : 'You do not have authority to approve this document',
      });
    }

    const updated = await app.prisma.document.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    return reply.send(ok({ ...updated, uploaderRole }));
  });

  // PATCH /documents/:id/reject — same hierarchy rules as approve
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

    const uploader = await app.prisma.employee.findUnique({
      where: { id: doc.uploadedBy },
      select: { role: true },
    });
    const uploaderRole = uploader?.role ?? 'EMPLOYEE';

    if (!canApprove(role, uploaderRole)) {
      return reply.status(403).send({
        message: uploaderRole === 'HR'
          ? 'Only an Admin can approve/reject documents uploaded by HR'
          : 'You do not have authority to reject this document',
      });
    }

    const updated = await app.prisma.document.update({
      where: { id },
      data: { status: 'REJECTED', notes },
    });

    return reply.send(ok({ ...updated, uploaderRole }));
  });

  // DELETE /documents/:id (soft delete)
  // Admin can delete any; HR can delete Employee/Manager docs; employees delete own PENDING only
  app.delete('/documents/:id', auth, async (req, reply) => {
    const { orgId, sub: userId, role } = req.user;
    const { id } = req.params as { id: string };

    const doc = await app.prisma.document.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
    });
    if (!doc) throw fail('Document not found', 404);

    if (ADMIN_ROLES.includes(role)) {
      // Admin can delete anything
    } else if (role === 'HR') {
      // HR can delete Employee/Manager documents only (not Admin docs, not peer HR docs)
      const uploader = await app.prisma.employee.findUnique({
        where: { id: doc.uploadedBy },
        select: { role: true },
      });
      const uploaderRole = uploader?.role ?? 'EMPLOYEE';
      if (!canApprove(role, uploaderRole)) {
        return reply.status(403).send({ message: 'You cannot delete documents uploaded by Admin or HR' });
      }
    } else {
      // Employees/Managers: own PENDING docs only
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
