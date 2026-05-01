import { Queue } from "bullmq";
import { env } from "../config/env.js";

const connection = { url: env.REDIS_URL };

export const emailQueue = new Queue("email", { connection });
export const payrollQueue = new Queue("payroll", { connection });
export const notificationQueue = new Queue("notification", { connection });
export const pdfQueue = new Queue("pdf-generation", { connection });

export type EmailJobData =
  | { type: "WELCOME"; to: string; firstName: string; tempPassword: string }
  | { type: "PAYSLIP"; to: string; firstName: string; month: number; year: number; pdfUrl: string }
  | { type: "LEAVE_STATUS"; to: string; firstName: string; status: "APPROVED" | "REJECTED"; leaveType: string; remarks?: string };

export type PayrollJobData = {
  organizationId: string;
  payrollRunId: string;
  processedBy: string;
};

export type NotificationJobData = {
  organizationId: string;
  employeeId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};
