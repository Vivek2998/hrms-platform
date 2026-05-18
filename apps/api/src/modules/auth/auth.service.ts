import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import type { FastifyRedis } from '@fastify/redis';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { fail } from '../../lib/response.js';
import type { LoginInput, ChangePasswordInput } from './auth.schema.js';

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function loginService(input: LoginInput, prisma: PrismaClient, redis: FastifyRedis) {
  const employee = await prisma.employee.findFirst({
    where: {
      workEmail: input.email,
      deletedAt: null,
      status: { not: 'TERMINATED' },
    },
    include: { organization: { select: { id: true, name: true, logoUrl: true, isActive: true, plan: true } } },
  });

  if (!employee) throw fail('Invalid email or password', 401);
  if (!employee.organization.isActive) throw fail('Organisation is inactive', 403);

  const valid = await bcrypt.compare(input.password, employee.passwordHash);
  if (!valid) throw fail('Invalid email or password', 401);

  const payload = {
    sub: employee.id,
    orgId: employee.organizationId,
    role: employee.role,
    orgPlan: employee.organization.plan,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store refresh token hash in Redis for revocation support
  const hash = await bcrypt.hash(refreshToken, 8);
  await redis.setex(`refresh:${employee.id}`, REFRESH_TOKEN_TTL_SECONDS, hash);

  await prisma.employee.update({
    where: { id: employee.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    employee: {
      id: employee.id,
      organizationId: employee.organizationId,
      orgName: employee.organization.name,
      orgLogoUrl: employee.organization.logoUrl ?? null,
      orgPlan: employee.organization.plan,
      role: employee.role,
      firstName: employee.firstName,
      lastName: employee.lastName,
      workEmail: employee.workEmail,
      employeeCode: employee.employeeCode,
      avatarUrl: employee.avatarUrl ?? null,
      mustChangePassword: employee.passwordChangedAt === null,
    },
  };
}

export async function refreshService(token: string, prisma: PrismaClient, redis: FastifyRedis) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw fail('Invalid or expired refresh token', 401);
  }

  const stored = await redis.get(`refresh:${payload.sub}`);
  if (!stored) throw fail('Session expired — please log in again', 401);

  const valid = await bcrypt.compare(token, stored);
  if (!valid) throw fail('Invalid refresh token', 401);

  const employee = await prisma.employee.findUnique({
    where: { id: payload.sub, deletedAt: null },
  });
  if (!employee) throw fail('Employee not found', 401);

  const newPayload = { sub: employee.id, orgId: employee.organizationId, role: employee.role };
  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken(newPayload);

  const hash = await bcrypt.hash(refreshToken, 8);
  await redis.setex(`refresh:${employee.id}`, REFRESH_TOKEN_TTL_SECONDS, hash);

  return { accessToken, refreshToken };
}

export async function logoutService(employeeId: string, redis: FastifyRedis) {
  await redis.del(`refresh:${employeeId}`);
}

export async function changePasswordService(
  employeeId: string,
  input: ChangePasswordInput,
  prisma: PrismaClient,
) {
  const employee = await prisma.employee.findUniqueOrThrow({
    where: { id: employeeId },
  });

  const valid = await bcrypt.compare(input.currentPassword, employee.passwordHash);
  if (!valid) throw fail('Current password is incorrect', 400);

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.employee.update({
    where: { id: employeeId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
}
