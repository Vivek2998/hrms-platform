-- ============================================================
-- HRMS Platform — Row-Level Security Policies
-- Tenant isolation: every row filtered by current_setting('app.current_org_id')
-- The API sets this via: SET LOCAL app.current_org_id = '<uuid>'
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- Helper: current org ID from session-local config
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION current_org_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_org_id', TRUE), '')
$$ LANGUAGE sql STABLE;

-- ─────────────────────────────────────────────────────────────
-- departments
-- ─────────────────────────────────────────────────────────────
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments FORCE ROW LEVEL SECURITY;

CREATE POLICY dept_org_isolation ON departments
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- teams
-- ─────────────────────────────────────────────────────────────
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams FORCE ROW LEVEL SECURITY;

CREATE POLICY teams_org_isolation ON teams
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- employees
-- ─────────────────────────────────────────────────────────────
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees FORCE ROW LEVEL SECURITY;

CREATE POLICY employees_org_isolation ON employees
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- shifts
-- ─────────────────────────────────────────────────────────────
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts FORCE ROW LEVEL SECURITY;

CREATE POLICY shifts_org_isolation ON shifts
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- shift_assignments
-- ─────────────────────────────────────────────────────────────
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments FORCE ROW LEVEL SECURITY;

CREATE POLICY shift_assignments_org_isolation ON shift_assignments
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- attendance_records
-- ─────────────────────────────────────────────────────────────
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records FORCE ROW LEVEL SECURITY;

CREATE POLICY attendance_records_org_isolation ON attendance_records
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- leave_types
-- ─────────────────────────────────────────────────────────────
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types FORCE ROW LEVEL SECURITY;

CREATE POLICY leave_types_org_isolation ON leave_types
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- leave_balances
-- ─────────────────────────────────────────────────────────────
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances FORCE ROW LEVEL SECURITY;

CREATE POLICY leave_balances_org_isolation ON leave_balances
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- leave_requests
-- ─────────────────────────────────────────────────────────────
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests FORCE ROW LEVEL SECURITY;

CREATE POLICY leave_requests_org_isolation ON leave_requests
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- leave_approvals
-- ─────────────────────────────────────────────────────────────
ALTER TABLE leave_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_approvals FORCE ROW LEVEL SECURITY;

CREATE POLICY leave_approvals_org_isolation ON leave_approvals
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- salary_components
-- ─────────────────────────────────────────────────────────────
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components FORCE ROW LEVEL SECURITY;

CREATE POLICY salary_components_org_isolation ON salary_components
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- salary_revisions
-- ─────────────────────────────────────────────────────────────
ALTER TABLE salary_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_revisions FORCE ROW LEVEL SECURITY;

CREATE POLICY salary_revisions_org_isolation ON salary_revisions
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- payroll_runs
-- ─────────────────────────────────────────────────────────────
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs FORCE ROW LEVEL SECURITY;

CREATE POLICY payroll_runs_org_isolation ON payroll_runs
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- payslips
-- ─────────────────────────────────────────────────────────────
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips FORCE ROW LEVEL SECURITY;

CREATE POLICY payslips_org_isolation ON payslips
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- holidays
-- ─────────────────────────────────────────────────────────────
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays FORCE ROW LEVEL SECURITY;

CREATE POLICY holidays_org_isolation ON holidays
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- announcements
-- ─────────────────────────────────────────────────────────────
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements FORCE ROW LEVEL SECURITY;

CREATE POLICY announcements_org_isolation ON announcements
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- documents
-- ─────────────────────────────────────────────────────────────
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

CREATE POLICY documents_org_isolation ON documents
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

CREATE POLICY notifications_org_isolation ON notifications
  USING ("organizationId" = current_org_id())
  WITH CHECK ("organizationId" = current_org_id());

-- ─────────────────────────────────────────────────────────────
-- organizations — not tenant-scoped (is the root table)
-- No RLS needed here; access controlled at application layer
-- ─────────────────────────────────────────────────────────────
