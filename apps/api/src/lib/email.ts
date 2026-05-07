import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
  : null;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!transport) return;
  try {
    await transport.sendMail({ from: env.SMTP_FROM, to, subject, html });
  } catch (err) {
    console.error('[email] Failed to send email:', err);
  }
}

export function leaveDecisionEmail(
  firstName: string,
  action: 'APPROVED' | 'REJECTED',
  fromDate: string,
  toDate: string,
  remarks?: string,
): string {
  const actionLabel = action === 'APPROVED' ? 'approved' : 'rejected';
  const color = action === 'APPROVED' ? '#16a34a' : '#dc2626';
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:${color}">Leave Request ${action === 'APPROVED' ? 'Approved' : 'Rejected'}</h2>
      <p style="color:#374151">Hi ${firstName},</p>
      <p style="color:#374151">
        Your leave request from <strong>${fromDate}</strong> to <strong>${toDate}</strong>
        has been <strong style="color:${color}">${actionLabel}</strong>.
      </p>
      ${remarks ? `<p style="color:#374151"><strong>Remarks:</strong> ${remarks}</p>` : ''}
      <p style="color:#6b7280;font-size:13px;margin-top:32px">— HRMS Platform</p>
    </div>
  `;
}
