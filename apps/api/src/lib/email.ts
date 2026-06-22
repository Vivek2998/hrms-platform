import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function passwordResetEmail(firstName: string, resetUrl: string): string {
  const safeName = escapeHtml(firstName);
  const safeUrl = escapeHtml(resetUrl);
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#4f46e5">Reset Your HRMS Password</h2>
      <p style="color:#374151">Hi ${safeName},</p>
      <p style="color:#374151">
        Someone requested a password reset for your HRMS account.
        Click the button below to reset your password.
        This link expires in <strong>1 hour</strong>.
      </p>
      <a href="${safeUrl}"
         style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;
                text-decoration:none;border-radius:6px;margin:16px 0;font-weight:600">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:13px;margin-top:8px">
        Or copy this link into your browser:<br/>
        <span style="color:#4f46e5;word-break:break-all">${safeUrl}</span>
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

// ── Employee Code Change: notification to super admin ─────────────────────────

interface EmpCodeRequestParams {
  superAdminName: string;
  orgName: string;
  adminName: string;
  currentPrefix: string;
  requestedPrefix: string;
  applyToExisting: boolean;
  reason?: string;
}

export function empCodeRequestToSuperAdminEmail(p: EmpCodeRequestParams): string {
  const safeSuperAdminName = escapeHtml(p.superAdminName);
  const safeAdminName = escapeHtml(p.adminName);
  const safeOrgName = escapeHtml(p.orgName);
  const safeCurrentPrefix = escapeHtml(p.currentPrefix);
  const safeRequestedPrefix = escapeHtml(p.requestedPrefix);
  const safeReason = p.reason ? escapeHtml(p.reason) : undefined;

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#4f46e5">Employee Code Change Request</h2>
      <p style="color:#374151">Hi ${safeSuperAdminName},</p>
      <p style="color:#374151">
        <strong>${safeAdminName}</strong> from <strong>${safeOrgName}</strong> has submitted a
        request to change their employee code prefix.
      </p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:6px 0;color:#6b7280;width:160px">Organisation</td>
            <td style="padding:6px 0;color:#111827;font-weight:600">${safeOrgName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Current Prefix</td>
            <td style="padding:6px 0;color:#111827;font-weight:600;font-family:monospace">${safeCurrentPrefix}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Requested Prefix</td>
            <td style="padding:6px 0;color:#4f46e5;font-weight:700;font-family:monospace">${safeRequestedPrefix}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Format Change</td>
            <td style="padding:6px 0;color:#111827">
              <span style="font-family:monospace;background:#fee2e2;padding:2px 6px;border-radius:4px">${safeCurrentPrefix}-473</span>
              &nbsp;→&nbsp;
              <span style="font-family:monospace;background:#dcfce7;padding:2px 6px;border-radius:4px">${safeRequestedPrefix}-473</span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Apply to Existing</td>
            <td style="padding:6px 0;color:#111827;font-weight:600">
              ${p.applyToExisting
                ? '✅ Yes — rename all existing employee codes retroactively'
                : '⬜ No — apply new prefix to future employees only'}
            </td>
          </tr>
          ${safeReason
            ? `<tr>
                <td style="padding:6px 0;color:#6b7280;vertical-align:top">Reason</td>
                <td style="padding:6px 0;color:#374151;font-style:italic">&ldquo;${safeReason}&rdquo;</td>
               </tr>`
            : ''}
        </table>
      </div>

      <p style="color:#374151">
        Please log in to the Super Admin dashboard to <strong>Approve</strong> or <strong>Reject</strong> this request.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">— HRMS Platform</p>
    </div>
  `;
}

// ── Employee Code Change: decision notification to org admin ──────────────────

interface EmpCodeDecisionParams {
  adminName: string;
  orgName: string;
  requestedPrefix: string;
  applyToExisting: boolean;
  status: 'APPROVED' | 'REJECTED';
  superAdminNote?: string;
}

export function empCodeDecisionEmail(p: EmpCodeDecisionParams): string {
  const approved = p.status === 'APPROVED';
  const color = approved ? '#16a34a' : '#dc2626';
  const label = approved ? 'Approved' : 'Not Approved';

  const safeAdminName = escapeHtml(p.adminName);
  const safeOrgName = escapeHtml(p.orgName);
  const safeRequestedPrefix = escapeHtml(p.requestedPrefix);
  const safeSuperAdminNote = p.superAdminNote ? escapeHtml(p.superAdminNote) : undefined;

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:${color}">
        Employee Code Change Request — ${label}
      </h2>
      <p style="color:#374151">Hi ${safeAdminName},</p>
      <p style="color:#374151">
        Your request to change the employee code prefix for <strong>${safeOrgName}</strong>
        has been <strong style="color:${color}">${label.toLowerCase()}</strong>
        by the platform administrator.
      </p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;font-size:14px">
        <p style="margin:0 0 8px;color:#6b7280">Requested Prefix</p>
        <p style="margin:0;font-family:monospace;font-size:18px;font-weight:700;color:#111827">${safeRequestedPrefix}</p>

        ${approved
          ? `<p style="margin:12px 0 0;color:#374151">
              ${p.applyToExisting
                ? '✅ All existing employee codes have been updated to the new prefix.'
                : '⬜ Existing employee codes are unchanged. New employees will receive the new prefix.'}
            </p>`
          : ''}
      </div>

      ${safeSuperAdminNote
        ? `<div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0;color:#854d0e;font-size:14px">
              <strong>Note from administrator:</strong><br/>${safeSuperAdminNote}
            </p>
           </div>`
        : ''}

      <p style="color:#374151;font-size:13px;margin-top:24px">
        ${approved
          ? 'Your employee directory has been updated. You can verify in the Employees section.'
          : 'If you have questions, please contact your platform administrator.'}
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">— HRMS Platform</p>
    </div>
  `;
}

// ── Org Chart Template Change: notification to super admin ───────────────────

interface OrgChartRequestParams {
  superAdminName: string;
  orgName: string;
  adminName: string;
  currentIndustry: string;
  requestedIndustry: string;
  reason?: string;
}

export function orgChartRequestToSuperAdminEmail(p: OrgChartRequestParams): string {
  const safeSuperAdminName = escapeHtml(p.superAdminName);
  const safeAdminName = escapeHtml(p.adminName);
  const safeOrgName = escapeHtml(p.orgName);
  const safeCurrentIndustry = escapeHtml(p.currentIndustry);
  const safeRequestedIndustry = escapeHtml(p.requestedIndustry);
  const safeReason = p.reason ? escapeHtml(p.reason) : undefined;

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#4f46e5">Org Chart Template Change Request</h2>
      <p style="color:#374151">Hi ${safeSuperAdminName},</p>
      <p style="color:#374151">
        <strong>${safeAdminName}</strong> from <strong>${safeOrgName}</strong> has submitted a
        request to change their organisation chart template.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr>
            <td style="padding:6px 0;color:#6b7280;width:160px">Organisation</td>
            <td style="padding:6px 0;color:#111827;font-weight:600">${safeOrgName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Current Template</td>
            <td style="padding:6px 0;color:#111827;font-weight:600">${safeCurrentIndustry}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#6b7280">Requested Template</td>
            <td style="padding:6px 0;color:#4f46e5;font-weight:700">${safeRequestedIndustry}</td>
          </tr>
          ${safeReason
            ? `<tr>
                <td style="padding:6px 0;color:#6b7280;vertical-align:top">Reason</td>
                <td style="padding:6px 0;color:#374151;font-style:italic">&ldquo;${safeReason}&rdquo;</td>
               </tr>`
            : ''}
        </table>
      </div>
      <p style="color:#374151">
        Please log in to the HRMS platform to <strong>Approve</strong> or <strong>Reject</strong> this request.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">— HRMS Platform</p>
    </div>
  `;
}

// ── Org Chart Template Change: decision notification to org admin ─────────────

interface OrgChartDecisionParams {
  adminName: string;
  orgName: string;
  requestedIndustry: string;
  status: 'APPROVED' | 'REJECTED';
  superAdminNote?: string;
}

export function orgChartDecisionEmail(p: OrgChartDecisionParams): string {
  const approved = p.status === 'APPROVED';
  const color = approved ? '#16a34a' : '#dc2626';
  const label = approved ? 'Approved' : 'Not Approved';

  const safeAdminName = escapeHtml(p.adminName);
  const safeOrgName = escapeHtml(p.orgName);
  const safeRequestedIndustry = escapeHtml(p.requestedIndustry);
  const safeSuperAdminNote = p.superAdminNote ? escapeHtml(p.superAdminNote) : undefined;

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:${color}">Org Chart Template Change — ${label}</h2>
      <p style="color:#374151">Hi ${safeAdminName},</p>
      <p style="color:#374151">
        Your request to change the organisation chart template for <strong>${safeOrgName}</strong>
        has been <strong style="color:${color}">${label.toLowerCase()}</strong>.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;font-size:14px">
        <p style="margin:0 0 6px;color:#6b7280">Requested Template</p>
        <p style="margin:0;font-size:16px;font-weight:700;color:#111827">${safeRequestedIndustry}</p>
      </div>
      ${safeSuperAdminNote
        ? `<div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px;margin:16px 0">
            <p style="margin:0;color:#854d0e;font-size:14px">
              <strong>Note from administrator:</strong><br/>${safeSuperAdminNote}
            </p>
           </div>`
        : ''}
      <p style="color:#374151;font-size:13px;margin-top:24px">
        ${approved
          ? 'Your organisation chart has been updated. Positions fill automatically as employees are hired.'
          : 'If you have questions, please contact your platform administrator.'}
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#9ca3af;font-size:12px">— HRMS Platform</p>
    </div>
  `;
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

  const safeName = escapeHtml(firstName);
  const safeFrom = escapeHtml(fromDate);
  const safeTo = escapeHtml(toDate);
  const safeRemarks = remarks ? escapeHtml(remarks) : undefined;

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:${color}">Leave Request ${action === 'APPROVED' ? 'Approved' : 'Rejected'}</h2>
      <p style="color:#374151">Hi ${safeName},</p>
      <p style="color:#374151">
        Your leave request from <strong>${safeFrom}</strong> to <strong>${safeTo}</strong>
        has been <strong style="color:${color}">${actionLabel}</strong>.
      </p>
      ${safeRemarks ? `<p style="color:#374151"><strong>Remarks:</strong> ${safeRemarks}</p>` : ''}
      <p style="color:#6b7280;font-size:13px;margin-top:32px">— HRMS Platform</p>
    </div>
  `;
}
