import type { FastifyInstance } from 'fastify';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

async function getLetterData(app: FastifyInstance, employeeId: string, orgId: string) {
  const [employee, org] = await Promise.all([
    app.prisma.employee.findFirst({
      where: { id: employeeId, organizationId: orgId, deletedAt: null },
      select: {
        firstName: true, lastName: true, designation: true, employeeCode: true,
        dateOfJoining: true, gender: true,
        department: { select: { name: true } },
      },
    }),
    app.prisma.organization.findFirst({
      where: { id: orgId },
      select: { name: true, addressLine1: true, city: true, state: true, email: true, phone: true, logoUrl: true },
    }),
  ]);
  return { employee, org };
}

export function letterRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /letters/me/experience — employee downloads own experience letter
  app.get('/letters/me/experience', auth, async (req, reply) => {
    const { orgId, employeeId } = req.user as any;
    const { employee, org } = await getLetterData(app, employeeId, orgId);
    if (!employee) throw fail('Employee not found', 404);

    return reply.send(ok({
      type: 'EXPERIENCE',
      issuedDate: new Date().toISOString().slice(0, 10),
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        code: employee.employeeCode,
        designation: employee.designation ?? 'Employee',
        department: employee.department?.name ?? '',
        dateOfJoining: employee.dateOfJoining?.toISOString().slice(0, 10) ?? null,
        gender: employee.gender,
      },
      organization: {
        name: org?.name ?? '',
        address: [org?.addressLine1, org?.city, org?.state].filter(Boolean).join(', '),
        email: org?.email ?? '',
        phone: org?.phone ?? '',
        logoUrl: org?.logoUrl ?? null,
      },
    }));
  });

  // GET /letters/me/salary-certificate — employee downloads own salary certificate
  app.get('/letters/me/salary-certificate', auth, async (req, reply) => {
    const { orgId, employeeId } = req.user as any;
    const { employee, org } = await getLetterData(app, employeeId, orgId);
    if (!employee) throw fail('Employee not found', 404);

    const revision = await app.prisma.salaryRevision.findFirst({
      where: { employeeId, organizationId: orgId },
      orderBy: { effectiveFrom: 'desc' },
    });

    return reply.send(ok({
      type: 'SALARY_CERTIFICATE',
      issuedDate: new Date().toISOString().slice(0, 10),
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        code: employee.employeeCode,
        designation: employee.designation ?? 'Employee',
        department: employee.department?.name ?? '',
        dateOfJoining: employee.dateOfJoining?.toISOString().slice(0, 10) ?? null,
      },
      salary: revision
        ? { ctc: revision.ctc, gross: revision.gross, basic: revision.basic, netPay: revision.netPay }
        : null,
      organization: {
        name: org?.name ?? '',
        address: [org?.addressLine1, org?.city, org?.state].filter(Boolean).join(', '),
        email: org?.email ?? '',
        phone: org?.phone ?? '',
        logoUrl: org?.logoUrl ?? null,
      },
    }));
  });

  // GET /letters/experience/:employeeId
  app.get('/letters/experience/:employeeId', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { employeeId } = req.params as { employeeId: string };

    const [employee, org] = await Promise.all([
      app.prisma.employee.findFirst({
        where: { id: employeeId, organizationId: req.user.orgId, deletedAt: null },
        select: {
          firstName: true, lastName: true, designation: true, employeeCode: true,
          dateOfJoining: true, gender: true,
          department: { select: { name: true } },
        },
      }),
      app.prisma.organization.findFirst({
        where: { id: req.user.orgId },
        select: { name: true, addressLine1: true, city: true, state: true, email: true, phone: true, logoUrl: true },
      }),
    ]);

    if (!employee) throw fail('Employee not found', 404);

    return reply.send(ok({
      type: 'EXPERIENCE',
      issuedDate: new Date().toISOString().slice(0, 10),
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        code: employee.employeeCode,
        designation: employee.designation ?? 'Employee',
        department: employee.department?.name ?? '',
        dateOfJoining: employee.dateOfJoining?.toISOString().slice(0, 10) ?? null,
        gender: employee.gender,
      },
      organization: {
        name: org?.name ?? '',
        address: [org?.addressLine1, org?.city, org?.state].filter(Boolean).join(', '),
        email: org?.email ?? '',
        phone: org?.phone ?? '',
        logoUrl: org?.logoUrl ?? null,
      },
    }));
  });

  // GET /letters/salary-certificate/:employeeId
  app.get('/letters/salary-certificate/:employeeId', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { employeeId } = req.params as { employeeId: string };

    const [employee, org] = await Promise.all([
      app.prisma.employee.findFirst({
        where: { id: employeeId, organizationId: req.user.orgId, deletedAt: null },
        select: {
          firstName: true, lastName: true, designation: true, employeeCode: true,
          dateOfJoining: true,
          department: { select: { name: true } },
        },
      }),
      app.prisma.organization.findFirst({
        where: { id: req.user.orgId },
        select: { name: true, addressLine1: true, city: true, state: true, email: true, phone: true, logoUrl: true },
      }),
    ]);

    if (!employee) throw fail('Employee not found', 404);

    const revision = await app.prisma.salaryRevision.findFirst({
      where: { employeeId, organizationId: req.user.orgId },
      orderBy: { effectiveFrom: 'desc' },
    });

    return reply.send(ok({
      type: 'SALARY_CERTIFICATE',
      issuedDate: new Date().toISOString().slice(0, 10),
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        code: employee.employeeCode,
        designation: employee.designation ?? 'Employee',
        department: employee.department?.name ?? '',
        dateOfJoining: employee.dateOfJoining?.toISOString().slice(0, 10) ?? null,
      },
      salary: revision
        ? { ctc: revision.ctc, gross: revision.gross, basic: revision.basic, netPay: revision.netPay }
        : null,
      organization: {
        name: org?.name ?? '',
        address: [org?.addressLine1, org?.city, org?.state].filter(Boolean).join(', '),
        email: org?.email ?? '',
        phone: org?.phone ?? '',
        logoUrl: org?.logoUrl ?? null,
      },
    }));
  });
}
