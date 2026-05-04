import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import type { EmailJobData } from './queues.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

function buildEmailHtml(data: EmailJobData): { subject: string; html: string } {
  switch (data.type) {
    case 'WELCOME':
      return {
        subject: 'Welcome to HRMS Platform — Your Account is Ready',
        html: `
          <h2>Welcome, ${data.firstName}!</h2>
          <p>Your HRMS account has been created. Use these credentials to sign in:</p>
          <p><strong>Email:</strong> ${data.to}</p>
          <p><strong>Temporary Password:</strong> ${data.tempPassword}</p>
          <p>Please change your password after first login.</p>
        `,
      };
    case 'PAYSLIP':
      return {
        subject: `Your Payslip for ${String(data.month)}/${String(data.year)} is Ready`,
        html: `
          <h2>Hi ${data.firstName},</h2>
          <p>Your payslip for ${String(data.month)}/${String(data.year)} is now available.</p>
          <p><a href="${data.pdfUrl}">Download Payslip</a></p>
        `,
      };
    case 'LEAVE_STATUS':
      return {
        subject: `Leave Request ${data.status}`,
        html: `
          <h2>Hi ${data.firstName},</h2>
          <p>Your ${data.leaveType} leave request has been <strong>${data.status}</strong>.</p>
          ${data.remarks ? `<p>Remarks: ${data.remarks}</p>` : ''}
        `,
      };
  }
}

export const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job) => {
    const { subject, html } = buildEmailHtml(job.data);
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: job.data.to,
      subject,
      html,
    });
    void job.log(`Email sent: ${subject} → ${job.data.to}`);
  },
  {
    connection: { url: env.REDIS_URL },
    concurrency: 5,
  },
);

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id ?? 'unknown'} failed:`, err.message);
});
