import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, fail } from '../../lib/response.js';

const HR_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR'];

const requestSchema = z.object({
  preferredPrimaryHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color e.g. #3B82F6')
    .optional(),
  sidebarStyle: z.enum(['light', 'dark', 'branded']).optional(),
  wantsBgImage: z.boolean().optional().default(false),
  bgImageUrl: z.string().url().optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .optional(),
  logoUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  attachmentUrls: z.array(z.string().url()).max(10).optional().default([]),
});

export function orgThemeRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  // GET /org/theme — returns current applied theme + pending request (if any)
  app.get('/org/theme', auth, async (req, reply) => {
    const { orgId } = req.user;

    const [themeConfig, pendingRequest] = await Promise.all([
      app.prisma.orgThemeConfig.findUnique({
        where: { organizationId: orgId },
      }),
      app.prisma.orgThemeRequest.findFirst({
        where: { organizationId: orgId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          preferredPrimaryHex: true,
          sidebarStyle: true,
          wantsBgImage: true,
          bgImageUrl: true,
          backgroundColor: true,
          logoUrl: true,
          notes: true,
          attachmentUrls: true,
          status: true,
          superAdminNote: true,
          createdAt: true,
          requestedBy: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return reply.send(ok({ themeConfig, pendingRequest }));
  });

  // PATCH /org/theme/background — set bg image directly (initial setup, no super-admin gate)
  app.patch('/org/theme/background', auth, async (req, reply) => {
    if (!HR_ROLES.includes(req.user.role)) throw fail('Forbidden', 403);
    const { bgImageUrl } = z.object({ bgImageUrl: z.string().url().nullable() }).parse(req.body);
    await app.prisma.orgThemeConfig.upsert({
      where: { organizationId: req.user.orgId },
      create: { organizationId: req.user.orgId, bgImageUrl: bgImageUrl ?? undefined, appliedById: req.user.sub },
      update: { bgImageUrl },
    });
    return reply.send(ok({ bgImageUrl }));
  });

  // POST /org/theme/request — org admin submits a theme change request
  app.post('/org/theme/request', auth, async (req, reply) => {
    const { orgId, sub: employeeId, role } = req.user;

    if (!HR_ROLES.includes(role)) throw fail('Only Org Admins can request a theme change', 403);

    // Only one PENDING request at a time
    const existing = await app.prisma.orgThemeRequest.findFirst({
      where: { organizationId: orgId, status: 'PENDING' },
    });
    if (existing) throw fail('You already have a pending theme request. Wait for it to be resolved before submitting a new one.', 409);

    const input = requestSchema.parse(req.body);

    const request = await app.prisma.orgThemeRequest.create({
      data: {
        organizationId: orgId,
        requestedById: employeeId,
        preferredPrimaryHex: input.preferredPrimaryHex,
        sidebarStyle: input.sidebarStyle,
        wantsBgImage: input.wantsBgImage ?? false,
        bgImageUrl: input.bgImageUrl,
        backgroundColor: input.backgroundColor,
        logoUrl: input.logoUrl,
        notes: input.notes,
        attachmentUrls: input.attachmentUrls ?? [],
      },
    });

    return reply.status(201).send(ok(request));
  });
}
