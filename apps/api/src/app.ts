import Fastify from "fastify";
import { env } from "./config/env.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { redisPlugin } from "./plugins/redis.js";
import { jwtPlugin } from "./plugins/jwt.js";
import { corsPlugin } from "./plugins/cors.js";
import { helmetPlugin } from "./plugins/helmet.js";
import { rateLimitPlugin } from "./plugins/rate-limit.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { errorHandler } from "./plugins/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { employeeRoutes } from "./modules/employees/employee.routes.js";
import { departmentRoutes } from "./modules/departments/department.routes.js";
import { shiftRoutes } from "./modules/shifts/shift.routes.js";
import { attendanceRoutes } from "./modules/attendance/attendance.routes.js";
import { leaveRoutes } from "./modules/leaves/leave.routes.js";
import { payrollRoutes } from "./modules/payroll/payroll.routes.js";
import { notificationRoutes } from "./modules/notifications/notification.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "production"
        ? true
        : {
            transport: {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "HH:MM:ss.l" },
            },
          },
    disableRequestLogging: env.NODE_ENV === "test",
  });

  // ── Plugins ────────────────────────────────────────────────
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(jwtPlugin);
  app.setErrorHandler(errorHandler);

  // ── Routes ─────────────────────────────────────────────────
  const prefix = "/api/v1";
  await app.register(healthRoutes, { prefix });
  await app.register(authRoutes, { prefix });
  await app.register(employeeRoutes, { prefix });
  await app.register(departmentRoutes, { prefix });
  await app.register(shiftRoutes, { prefix });
  await app.register(attendanceRoutes, { prefix });
  await app.register(leaveRoutes, { prefix });
  await app.register(payrollRoutes, { prefix });
  await app.register(notificationRoutes, { prefix });

  await app.ready();
  return app;
}
