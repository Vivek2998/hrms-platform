import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response.js';

const APPROVER_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR', 'MANAGER'] as const;

const querySchema = z.object({
  type: z
    .enum(['LEAVE', 'EXPENSE', 'REGULARISATION', 'COMP_OFF', 'HELPDESK'])
    .optional(),
});

export function approvalInboxRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /approval-inbox  — aggregated pending items for approvers
  app.get('/approval-inbox', auth, async (req, reply) => {
    const { orgId, role } = req.user;

    if (!(APPROVER_ROLES as readonly string[]).includes(role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }

    const { type } = querySchema.parse(req.query);

    const employeeSelect = {
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    };

    const items: {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      employeeName: string;
      employeeId: string;
      createdAt: Date;
      status: string;
      metadata: Record<string, unknown>;
    }[] = [];

    // ── Leaves ────────────────────────────────────────────────
    if (!type || type === 'LEAVE') {
      const leaves = await app.prisma.leaveApplication.findMany({
        where: { organizationId: orgId, status: 'PENDING' },
        include: {
          employee: employeeSelect,
          leaveType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      for (const l of leaves) {
        items.push({
          id: l.id,
          type: 'LEAVE',
          title: `${l.leaveType.name} Leave`,
          subtitle: `${l.startDate.toISOString().slice(0, 10)} → ${l.endDate.toISOString().slice(0, 10)}`,
          employeeName: `${l.employee.firstName} ${l.employee.lastName}`,
          employeeId: l.employee.id,
          createdAt: l.createdAt,
          status: l.status,
          metadata: { reason: l.reason, leaveTypeId: l.leaveTypeId },
        });
      }
    }

    // ── Expenses ──────────────────────────────────────────────
    if (!type || type === 'EXPENSE') {
      const expenses = await app.prisma.expenseClaim.findMany({
        where: { organizationId: orgId, status: 'SUBMITTED' },
        include: { employee: employeeSelect },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      for (const e of expenses) {
        items.push({
          id: e.id,
          type: 'EXPENSE',
          title: e.title,
          subtitle: `${e.category} • ${e.currency} ${e.amount.toFixed(2)}`,
          employeeName: `${e.employee.firstName} ${e.employee.lastName}`,
          employeeId: e.employee.id,
          createdAt: e.createdAt,
          status: e.status,
          metadata: { amount: e.amount, currency: e.currency, category: e.category },
        });
      }
    }

    // ── Regularisations ───────────────────────────────────────
    if (!type || type === 'REGULARISATION') {
      const regs = await app.prisma.attendanceRegularisation.findMany({
        where: { organizationId: orgId, status: 'PENDING' },
        include: { employee: employeeSelect },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      for (const r of regs) {
        items.push({
          id: r.id,
          type: 'REGULARISATION',
          title: `Regularisation — ${r.date.toISOString().slice(0, 10)}`,
          subtitle: r.reason,
          employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
          employeeId: r.employee.id,
          createdAt: r.createdAt,
          status: r.status,
          metadata: { date: r.date },
        });
      }
    }

    // ── Comp-offs ─────────────────────────────────────────────
    if (!type || type === 'COMP_OFF') {
      const compOffs = await app.prisma.compOff.findMany({
        where: { organizationId: orgId, status: 'PENDING' },
        include: { employee: employeeSelect },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      for (const c of compOffs) {
        items.push({
          id: c.id,
          type: 'COMP_OFF',
          title: `Comp-off — worked ${c.workedDate.toISOString().slice(0, 10)}`,
          subtitle: c.reason,
          employeeName: `${c.employee.firstName} ${c.employee.lastName}`,
          employeeId: c.employee.id,
          createdAt: c.createdAt,
          status: c.status,
          metadata: { workedDate: c.workedDate, requestedDate: c.requestedDate },
        });
      }
    }

    // ── Helpdesk ──────────────────────────────────────────────
    if (!type || type === 'HELPDESK') {
      const tickets = await app.prisma.helpDeskTicket.findMany({
        where: { organizationId: orgId, status: 'OPEN' },
        include: { employee: employeeSelect },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      for (const t of tickets) {
        items.push({
          id: t.id,
          type: 'HELPDESK',
          title: t.subject,
          subtitle: `${t.category} • ${t.priority}`,
          employeeName: `${t.employee.firstName} ${t.employee.lastName}`,
          employeeId: t.employee.id,
          createdAt: t.createdAt,
          status: t.status,
          metadata: { category: t.category, priority: t.priority },
        });
      }
    }

    // Sort merged list by newest first
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return reply.send(ok(items));
  });

  // GET /approval-inbox/count  — badge count for nav
  app.get('/approval-inbox/count', auth, async (req, reply) => {
    const { orgId, role } = req.user;
    if (!(APPROVER_ROLES as readonly string[]).includes(role)) {
      return reply.send(ok({ count: 0 }));
    }

    const [leaves, expenses, regs, compOffs, tickets] = await app.prisma.$transaction([
      app.prisma.leaveApplication.count({ where: { organizationId: orgId, status: 'PENDING' } }),
      app.prisma.expenseClaim.count({ where: { organizationId: orgId, status: 'SUBMITTED' } }),
      app.prisma.attendanceRegularisation.count({ where: { organizationId: orgId, status: 'PENDING' } }),
      app.prisma.compOff.count({ where: { organizationId: orgId, status: 'PENDING' } }),
      app.prisma.helpDeskTicket.count({ where: { organizationId: orgId, status: 'OPEN' } }),
    ]);

    return reply.send(ok({ count: leaves + expenses + regs + compOffs + tickets }));
  });
}
