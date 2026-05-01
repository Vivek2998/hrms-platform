import type { FastifyInstance } from "fastify";
import { loginSchema, refreshSchema, changePasswordSchema } from "./auth.schema.js";
import { loginService, refreshService, logoutService, changePasswordService } from "./auth.service.js";
import { ok } from "../../lib/response.js";

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/login
  app.post("/auth/login", async (req, reply) => {
    const input = loginSchema.parse(req.body);
    const data = await loginService(input, app.prisma, app.redis);
    return reply.status(200).send(ok(data));
  });

  // POST /auth/refresh
  app.post("/auth/refresh", async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    const data = await refreshService(refreshToken, app.prisma, app.redis);
    return reply.status(200).send(ok(data));
  });

  // POST /auth/logout  (requires auth)
  app.post(
    "/auth/logout",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      await logoutService(req.user.sub, app.redis);
      return reply.status(200).send(ok({ message: "Logged out successfully" }));
    },
  );

  // POST /auth/change-password  (requires auth)
  app.post(
    "/auth/change-password",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const input = changePasswordSchema.parse(req.body);
      await changePasswordService(req.user.sub, input, app.prisma);
      return reply.status(200).send(ok({ message: "Password changed successfully" }));
    },
  );

  // GET /auth/me  (requires auth)
  app.get(
    "/auth/me",
    { preHandler: [app.authenticate] },
    async (req, reply) => {
      const employee = await app.prisma.employee.findUniqueOrThrow({
        where: { id: req.user.sub, deletedAt: null },
        include: { organization: { select: { id: true, name: true } } },
      });
      return reply.status(200).send(
        ok({
          id: employee.id,
          orgId: employee.organizationId,
          orgName: employee.organization.name,
          role: employee.role,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.workEmail,
          avatarUrl: employee.avatarUrl,
        }),
      );
    },
  );
}
