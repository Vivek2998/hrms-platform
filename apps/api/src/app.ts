import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { env } from './config/env.js';
import { prismaPlugin } from './plugins/prisma.js';
import { redisPlugin } from './plugins/redis.js';
import { jwtPlugin } from './plugins/jwt.js';
import { corsPlugin } from './plugins/cors.js';
import { helmetPlugin } from './plugins/helmet.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { errorHandler } from './plugins/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { employeeRoutes } from './modules/employees/employee.routes.js';
import { departmentRoutes } from './modules/departments/department.routes.js';
import { shiftRoutes } from './modules/shifts/shift.routes.js';
import { attendanceRoutes } from './modules/attendance/attendance.routes.js';
import { leaveRoutes } from './modules/leaves/leave.routes.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { uploadRoutes } from './modules/upload/upload.routes.js';
import { documentRoutes } from './modules/documents/document.routes.js';
import { salaryRoutes } from './modules/salary/salary.routes.js';
import { holidayRoutes } from './modules/holidays/holiday.routes.js';
import { regularisationRoutes } from './modules/regularisation/regularisation.routes.js';
import { compOffRoutes } from './modules/comp-off/comp-off.routes.js';
import { taxDeclarationRoutes } from './modules/tax-declaration/tax-declaration.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { suggestionRoutes } from './modules/suggestions/suggestion.routes.js';
import { hrPolicyRoutes } from './modules/hr-policy/hr-policy.routes.js';
import { helpDeskRoutes } from './modules/helpdesk/helpdesk.routes.js';
import { surveyRoutes } from './modules/surveys/survey.routes.js';
import { onboardingRoutes } from './modules/onboarding/onboarding.routes.js';
import { performanceRoutes } from './modules/performance/performance.routes.js';
import { recruitmentRoutes } from './modules/recruitment/recruitment.routes.js';
import { offboardingRoutes } from './modules/offboarding/offboarding.routes.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
import { announcementRoutes } from './modules/announcements/announcement.routes.js';
import { reportRoutes } from './modules/reports/report.routes.js';
import { letterRoutes } from './modules/letters/letter.routes.js';
import { superAdminRoutes } from './modules/super-admin/super-admin.routes.js';
import { officeLocationRoutes } from './modules/office-locations/office-location.routes.js';
import { expenseRoutes } from './modules/expenses/expense.routes.js';
import { approvalInboxRoutes } from './modules/approval-inbox/approval-inbox.routes.js';
import { kudosRoutes } from './modules/kudos/kudos.routes.js';
import { eSignatureRoutes } from './modules/esignature/esignature.routes.js';
import { lmsRoutes } from './modules/lms/lms.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'production'
        ? true
        : {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss.l' },
            },
          },
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  // ── Plugins ────────────────────────────────────────────────
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(jwtPlugin);
  await app.register(multipart);
  app.setErrorHandler(errorHandler);

  // ── Routes ─────────────────────────────────────────────────
  const prefix = '/api/v1';
  await app.register(healthRoutes, { prefix });
  await app.register(authRoutes, { prefix });
  await app.register(employeeRoutes, { prefix });
  await app.register(departmentRoutes, { prefix });
  await app.register(shiftRoutes, { prefix });
  await app.register(attendanceRoutes, { prefix });
  await app.register(leaveRoutes, { prefix });
  await app.register(payrollRoutes, { prefix });
  await app.register(notificationRoutes, { prefix });
  await app.register(uploadRoutes, { prefix });
  await app.register(documentRoutes, { prefix });
  await app.register(salaryRoutes, { prefix });
  await app.register(holidayRoutes, { prefix });
  await app.register(regularisationRoutes, { prefix });
  await app.register(compOffRoutes, { prefix });
  await app.register(taxDeclarationRoutes, { prefix });
  await app.register(dashboardRoutes, { prefix });
  await app.register(suggestionRoutes, { prefix });
  await app.register(hrPolicyRoutes, { prefix });
  await app.register(helpDeskRoutes, { prefix });
  await app.register(surveyRoutes, { prefix });
  await app.register(onboardingRoutes, { prefix });
  await app.register(performanceRoutes, { prefix });
  await app.register(recruitmentRoutes, { prefix });
  await app.register(offboardingRoutes, { prefix });
  await app.register(analyticsRoutes, { prefix });
  await app.register(announcementRoutes, { prefix });
  await app.register(reportRoutes, { prefix });
  await app.register(letterRoutes, { prefix });
  await app.register(superAdminRoutes, { prefix });
  await app.register(officeLocationRoutes, { prefix });
  await app.register(expenseRoutes, { prefix });
  await app.register(approvalInboxRoutes, { prefix });
  await app.register(kudosRoutes, { prefix });
  await app.register(eSignatureRoutes, { prefix });
  await app.register(lmsRoutes, { prefix });

  await app.ready();
  return app;
}
