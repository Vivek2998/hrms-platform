import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export function passwordResetEmail(firstName: string, resetUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#4f46e5">Reset Your HRMS Password</h2>
      <p style="color:#374151">Hi ${firstName},</p>
      <p style="color:#374151">
        Someone requested a password reset for your HRMS account.
        Click the button below to reset your password.
        This link expires in <strong>1 hour</strong>.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;
                text-decoration:none;border-radius:6px;margin:16px 0;font-weight:600">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:13px;margin-top:8px">
        Or copy this link into your browser:<br/>
        <span style="color:#4f46e5;word-break:break-all">${resetUrl}</span>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">
        If you did not request a password reset, ignore this email — your password will not change.<br/>
        — HRMS Platform
      </p>
    </div>
  `;
}

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
