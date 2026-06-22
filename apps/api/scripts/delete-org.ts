import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ORG_ID = '5c79ec52-b4a2-4f44-9870-866a85fd9dc6';

async function del(table: string, where: string) {
  const n = await prisma.$executeRawUnsafe(`DELETE FROM ${table} WHERE ${where}`);
  if (n > 0) console.log(`  ${table}: ${n} deleted`);
}

const o = `'${ORG_ID}'`;
const byOrg = `"organizationId" = ${o}`;
// Resolves employee IDs at query time — no JS array needed
const empSub = `(SELECT id FROM employees WHERE "organizationId" = ${o})`;

async function main() {
  const org = await prisma.organization.findUnique({ where: { id: ORG_ID } });
  if (!org) { console.log('Org not found — already deleted.'); return; }
  console.log(`Deleting: ${org.name} (${org.slug})`);

  // ── 1. Deep-linked tables (no organizationId, linked via parent sub-select) ──
  await del('password_reset_tokens', `"employeeId" IN ${empSub}`);
  await del('helpdesk_ticket_comments', `"ticketId" IN (SELECT id FROM helpdesk_tickets WHERE ${byOrg})`);
  await del('onboarding_assignment_tasks', `"assignmentId" IN (SELECT id FROM onboarding_assignments WHERE ${byOrg})`);
  await del('exit_interviews', `"assignmentId" IN (SELECT id FROM offboarding_assignments WHERE ${byOrg})`);
  await del('offboarding_assignment_tasks', `"assignmentId" IN (SELECT id FROM offboarding_assignments WHERE ${byOrg})`);
  await del('pip_goals', `"pipId" IN (SELECT id FROM performance_improvement_plans WHERE ${byOrg})`);
  await del('pip_check_ins', `"pipId" IN (SELECT id FROM performance_improvement_plans WHERE ${byOrg})`);
  await del('esop_exercises', `"grantId" IN (SELECT id FROM esop_grants WHERE ${byOrg})`);
  await del('biometric_device_logs', `"deviceId" IN (SELECT id FROM biometric_devices WHERE ${byOrg})`);
  await del('bulk_candidates', `"driveId" IN (SELECT id FROM hiring_drives WHERE ${byOrg})`);
  await del('posh_case_updates', `"caseId" IN (SELECT id FROM posh_cases WHERE ${byOrg})`);
  await del('survey_answers', `"responseId" IN (SELECT id FROM survey_responses WHERE "employeeId" IN ${empSub})`);
  await del('survey_responses', `"employeeId" IN ${empSub}`);
  await del('chat_messages', `"sessionId" IN (SELECT id FROM chat_sessions WHERE ${byOrg})`);
  await del('successor_nominations', `"employeeId" IN ${empSub}`);
  await del('interview_schedules', `"applicationId" IN (SELECT id FROM job_applications WHERE "jobId" IN (SELECT id FROM job_postings WHERE ${byOrg}))`);
  await del('job_applications', `"jobId" IN (SELECT id FROM job_postings WHERE ${byOrg})`);
  await del('onboarding_tasks', `"templateId" IN (SELECT id FROM onboarding_templates WHERE ${byOrg})`);
  await del('offboarding_tasks', `"templateId" IN (SELECT id FROM offboarding_templates WHERE ${byOrg})`);
  await del('survey_questions', `"surveyId" IN (SELECT id FROM pulse_surveys WHERE ${byOrg})`);

  // ── 2. All tables with organizationId (delete directly) ────────────────
  await del('leave_balances',           byOrg);
  await del('leave_approvals',          byOrg);
  await del('leave_requests',           byOrg);
  await del('attendance_records',       byOrg);
  await del('attendance_regularisations', byOrg);
  await del('comp_offs',                byOrg);
  await del('shift_assignments',        byOrg);
  await del('tax_declarations',         byOrg);
  await del('salary_revisions',         byOrg);
  await del('payslips',                 byOrg);
  await del('performance_goals',        byOrg);
  await del('peer_feedbacks',           byOrg);
  await del('performance_reviews',      byOrg);
  await del('onboarding_assignments',   byOrg);
  await del('offboarding_assignments',  byOrg);
  await del('fnf_settlements',          byOrg);
  await del('esignature_requests',      byOrg);
  await del('documents',                byOrg);
  await del('asset_assignments',        byOrg);
  await del('course_enrollments',       byOrg);
  await del('expense_claims',           byOrg);
  await del('travel_requests',          byOrg);
  await del('loan_requests',            byOrg);
  await del('wfh_requests',             byOrg);
  await del('shift_swap_requests',      byOrg);
  await del('employee_referrals',       byOrg);
  await del('kudos',                    byOrg);
  await del('suggestion_box',           byOrg);
  await del('helpdesk_tickets',         byOrg);
  await del('chat_sessions',            byOrg);
  await del('ewa_requests',             byOrg);
  await del('attrition_scores',         byOrg);
  await del('timesheet_entries',        byOrg);
  await del('benefit_enrollments',      byOrg);
  await del('policy_acknowledgments',   byOrg);
  await del('salary_revision_proposals', byOrg);
  await del('employee_kra_assignments', byOrg);
  await del('employee_kpi_records',     byOrg);
  await del('employee_skills',          byOrg);
  await del('career_paths',             byOrg);
  await del('performance_improvement_plans', byOrg);
  await del('nine_box_assessments',     byOrg);
  await del('succession_plans',         byOrg);
  await del('esop_grants',              byOrg);
  await del('biometric_devices',        byOrg);
  await del('hiring_drives',            byOrg);
  await del('pay_equity_snapshots',     byOrg);
  await del('interview_scorecards',     byOrg);
  await del('parsed_resumes',           byOrg);
  await del('contractors',              byOrg);
  await del('posh_cases',               byOrg);
  await del('org_chart_change_requests', byOrg);
  await del('employee_code_change_requests', byOrg);
  await del('org_theme_requests',       byOrg);
  await del('org_theme_configs',        byOrg);
  await del('job_postings',             byOrg);
  await del('performance_cycles',       byOrg);
  await del('onboarding_templates',     byOrg);
  await del('offboarding_templates',    byOrg);
  await del('pulse_surveys',            byOrg);
  await del('room_bookings',            byOrg);
  await del('meeting_rooms',            byOrg);
  await del('notifications',            byOrg);
  await del('hr_policies',              byOrg);
  await del('payroll_runs',             byOrg);
  await del('salary_components',        byOrg);
  await del('leave_types',              byOrg);
  await del('holidays',                 byOrg);
  await del('announcements',            byOrg);
  await del('office_locations',         byOrg);
  await del('assets',                   byOrg);
  await del('learning_courses',         byOrg);
  await del('benefit_plans',            byOrg);
  await del('headcount_plans',          byOrg);
  await del('open_positions',           byOrg);
  await del('designations',             byOrg);
  await del('kras',                     byOrg);
  await del('kpis',                     byOrg);
  await del('skills',                   byOrg);
  await del('projects',                 byOrg);
  await del('eap_resources',            byOrg);

  // ── 3. Structure and root records ──────────────────────────────────────
  await del('teams',        byOrg);
  await del('departments',  byOrg);
  await del('shifts',       byOrg);
  await del('employees',    byOrg);
  await del('organizations', `id = ${o}`);

  console.log('\nSSinnovations deleted successfully.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
