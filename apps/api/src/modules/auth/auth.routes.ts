import type { FastifyInstance } from 'fastify';
import { randomBytes, createHash } from 'node:crypto';
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
import { sendEmail, passwordResetEmail } from '../../lib/email.js';
import { env } from '../../config/env.js';
import { authRateLimit } from '../../lib/rate-limits.js';

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
  adminPassword: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
  // Optional employee code prefix — 2 to 5 uppercase letters.
  // Examples: "SSI" → SSI-1, SSI-473 | "TCS" → TCS-1001 | "INFY" → INFY-42
  // If omitted, auto-derived from the organisation name at provisioning time.
  employeeCodePrefix: z
    .string()
    .regex(/^[A-Z]{2,5}$/, 'Employee code prefix must be 2–5 uppercase letters (e.g. SSI, TCS, INFY)')
    .optional(),
  // ── Branding — collected at signup, all optional ─────────────────────────
  logoUrl: z.string().url('Must be a valid URL').optional(),
  industryType: z
    .enum(['IT_SOFTWARE', 'MANUFACTURING', 'HEALTHCARE', 'FINANCIAL_SERVICES', 'RETAIL', 'EDUCATIONAL', 'SERVICE_BASED', 'GENERAL'])
    .optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour e.g. #3B82F6')
    .optional(),
  sidebarStyle: z.enum(['light', 'dark', 'branded']).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
});

export function authRoutes(app: FastifyInstance) {
  // POST /auth/register — public self-serve organisation registration
  // Rate-limited: 5 attempts / 15 min per IP+email
  app.post('/auth/register', authRateLimit, async (req, reply) => {
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
      employeeCodePrefix: input.employeeCodePrefix,
      logoUrl:      input.logoUrl,
      industryType: input.industryType,
      primaryColor: input.primaryColor,
      sidebarStyle: input.sidebarStyle,
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
          orgLogoUrl: org.logoUrl ?? null,
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
  // Rate-limited: 5 attempts / 15 min per IP+email
  app.post('/auth/login', authRateLimit, async (req, reply) => {
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

  // POST /auth/forgot-password — generate reset token + send email
  // Rate-limited: 5 attempts / 15 min per IP+email to prevent abuse
  app.post('/auth/forgot-password', authRateLimit, async (req, reply) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    const employee = await app.prisma.employee.findFirst({
      where: { workEmail: email, deletedAt: null },
    });

    // Always return 200 to avoid email enumeration — do NOT leak whether email exists
    if (!employee) {
      return reply
        .status(200)
        .send(ok({ message: 'If that email exists, a reset link has been sent.' }));
    }

    // Invalidate any existing unused tokens for this employee
    await app.prisma.passwordResetToken.updateMany({
      where: { employeeId: employee.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate a secure random token; store only the SHA-256 hash in DB (SEC-06)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await app.prisma.passwordResetToken.create({
      data: { employeeId: employee.id, token: tokenHash, expiresAt },
    });

    // Build the reset URL with the RAW token (not the hash) — user needs the raw token
    const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;
    void sendEmail(
      employee.workEmail,
      'Reset Your HRMS Password',
      passwordResetEmail(employee.firstName, resetUrl),
    );

    // NEVER include the token in the response — SEC-01 fix
    return reply
      .status(200)
      .send(ok({ message: 'If that email exists, a reset link has been sent.' }));
  });

  // POST /auth/reset-password — consume token and update password
  // Rate-limited: 5 attempts / 15 min per IP to prevent token guessing
  app.post('/auth/reset-password', authRateLimit, async (req, reply) => {
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Hash the incoming raw token and look up the hash in DB (SEC-06 fix)
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const record = await app.prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
    });

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
