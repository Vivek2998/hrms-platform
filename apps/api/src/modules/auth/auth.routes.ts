import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { loginSchema, refreshSchema, changePasswordSchema } from './auth.schema.js';
import {
  loginService,
  refreshService,
  logoutService,
  changePasswordService,
} from './auth.service.js';
import { ok, fail } from '../../lib/response.js';
import { signAccessToken, signRefreshToken } from '../../lib/jwt.js';
import { provisionOrganization } from '../../lib/provision-org.js';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

const registerSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  email: z.string().email(),
  adminFirstName: z.string().min(1),
  adminLastName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export function authRoutes(app: FastifyInstance) {
  // POST /auth/register — public self-serve organisation registration
  app.post('/auth/register', async (req, reply) => {
    const input = registerSchema.parse(req.body);

    const [slugTaken, emailTaken] = await Promise.all([
      app.prisma.organization.findUnique({ where: { slug: input.slug } }),
      app.prisma.employee.findFirst({ where: { workEmail: input.adminEmail, deletedAt: null } }),
    ]);
    if (slugTaken) throw fail('This URL slug is already taken — try a different one', 409);
    if (emailTaken) throw fail('An account with this email already exists', 409);

    const passwordHash = await bcrypt.hash(input.adminPassword, 12);
    const { org, admin } = await provisionOrganization(app.prisma, {
      name: input.name,
      slug: input.slug,
      email: input.email,
      adminFirstName: input.adminFirstName,
      adminLastName: input.adminLastName,
      adminEmail: input.adminEmail,
      passwordHash,
    });

    const jwtPayload = { sub: admin.id, orgId: org.id, role: admin.role, orgPlan: org.plan };
    const accessToken = signAccessToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);
    const tokenHash = await bcrypt.hash(refreshToken, 8);
    await app.redis.setex(`refresh:${admin.id}`, REFRESH_TOKEN_TTL, tokenHash);

    return reply.status(201).send(
      ok({
        accessToken,
        refreshToken,
        employee: {
          id: admin.id,
          organizationId: org.id,
          orgName: org.name,
          orgPlan: org.plan,
          role: admin.role,
          firstName: admin.firstName,
          lastName: admin.lastName,
          workEmail: admin.workEmail,
          employeeCode: admin.employeeCode,
          avatarUrl: null,
          mustChangePassword: false,
        },
      }),
    );
  });

  // POST /auth/login
  app.post('/auth/login', async (req, reply) => {
    const input = loginSchema.parse(req.body);
    const data = await loginService(input, app.prisma, app.redis);
    return reply.status(200).send(ok(data));
  });

  // POST /auth/refresh
  app.post('/auth/refresh', async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const data = await refreshService(refreshToken, app.prisma, app.redis);
    return reply.status(200).send(ok(data));
  });

  // POST /auth/logout  (requires auth)
  app.post('/auth/logout', { preHandler: [app.authenticate] }, async (req, reply) => {
    await logoutService(req.user.sub, app.redis);
    return reply.status(200).send(ok({ message: 'Logged out successfully' }));
  });

  // POST /auth/change-password  (requires auth)
  app.post('/auth/change-password', { preHandler: [app.authenticate] }, async (req, reply) => {
    const input = changePasswordSchema.parse(req.body);
    await changePasswordService(req.user.sub, input, app.prisma);
    return reply.status(200).send(ok({ message: 'Password changed successfully' }));
  });

  // POST /auth/forgot-password — generate reset token
  app.post('/auth/forgot-password', async (req, reply) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const employee = await app.prisma.employee.findFirst({
      where: { workEmail: email, deletedAt: null },
    });
    // Always return 200 to avoid email enumeration
    if (!employee) return reply.status(200).send(ok({ message: 'If that email exists, a reset link has been sent.' }));

    // Invalidate any existing unused tokens
    await app.prisma.passwordResetToken.updateMany({
      where: { employeeId: employee.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await app.prisma.passwordResetToken.create({
      data: { employeeId: employee.id, token, expiresAt },
    });

    // In production: send email with reset link
    // For development: return the token directly
    return reply.status(200).send(ok({ message: 'Reset link generated.', token }));
  });

  // POST /auth/reset-password — consume token and update password
  app.post('/auth/reset-password', async (req, reply) => {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const record = await app.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw fail('Invalid or expired reset token', 400);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await app.prisma.$transaction([
      app.prisma.employee.update({
        where: { id: record.employeeId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      app.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return reply.status(200).send(ok({ message: 'Password reset successfully.' }));
  });

  // GET /auth/me  (requires auth)
  app.get('/auth/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const employee = await app.prisma.employee.findUniqueOrThrow({
      where: { id: req.user.sub, deletedAt: null },
      include: { organization: { select: { id: true, name: true, plan: true } } },
    });
    return reply.status(200).send(
      ok({
        id: employee.id,
        orgId: employee.organizationId,
        orgName: employee.organization.name,
        orgPlan: employee.organization.plan,
        role: employee.role,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.workEmail,
        avatarUrl: employee.avatarUrl,
      }),
    );
  });
}
