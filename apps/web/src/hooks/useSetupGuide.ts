import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import type { UserRole } from '@hrms/shared-types';

export type GuideStepId =
  | 'add-employee'
  | 'configure-leave-types'
  | 'setup-departments'
  | 'post-announcement'
  | 'run-payroll'
  | 'complete-profile'
  | 'apply-leave'
  | 'check-payslips'
  | 'explore-kudos'
  | 'check-approvals';

export interface GuideStep {
  id: GuideStepId;
  label: string;
  description: string;
  to: string;
}

const HR_STEPS: GuideStep[] = [
  { id: 'add-employee',          label: 'Add your first employee',        description: 'Start building your team',           to: '/employees' },
  { id: 'configure-leave-types', label: 'Configure leave types',          description: 'Set up annual, casual, sick leave',   to: '/leaves' },
  { id: 'setup-departments',     label: 'Set up departments',             description: 'Organise your org structure',         to: '/departments' },
  { id: 'post-announcement',     label: 'Post a company announcement',    description: 'Reach the whole company instantly',   to: '/announcements' },
  { id: 'run-payroll',           label: 'Run your first payroll',         description: 'Process salaries end-to-end',         to: '/payroll' },
];

const MANAGER_STEPS: GuideStep[] = [
  { id: 'complete-profile', label: 'Complete your profile',     description: 'Add a photo and personal details', to: '/settings' },
  { id: 'apply-leave',      label: 'Apply for leave',           description: 'Request time off in seconds',      to: '/my-leaves' },
  { id: 'check-approvals',  label: 'Review the approval inbox', description: 'Handle pending requests',          to: '/approval-inbox' },
  { id: 'check-payslips',   label: 'View your payslips',        description: 'Access monthly salary breakdowns', to: '/my-payslips' },
];

const EMPLOYEE_STEPS: GuideStep[] = [
  { id: 'complete-profile', label: 'Complete your profile',        description: 'Add a photo and personal details', to: '/settings' },
  { id: 'apply-leave',      label: 'Apply for leave',              description: 'Request time off in seconds',      to: '/my-leaves' },
  { id: 'check-payslips',   label: 'View your payslips',           description: 'Access monthly salary breakdowns', to: '/my-payslips' },
  { id: 'explore-kudos',    label: 'Explore the recognition wall', description: 'Give kudos to a colleague',        to: '/kudos' },
];

export function getGuideSteps(role: UserRole | undefined): GuideStep[] {
  if (!role) return EMPLOYEE_STEPS;
  if (['SUPER_ADMIN', 'ORG_ADMIN', 'HR'].includes(role)) return HR_STEPS;
  if (role === 'MANAGER') return MANAGER_STEPS;
  return EMPLOYEE_STEPS;
}

interface GuideState {
  tourDone: boolean;
  dismissed: boolean;
  completedSteps: GuideStepId[];
}

const DEFAULT: GuideState = { tourDone: false, dismissed: false, completedSteps: [] };

function key(userId: string) { return `hrms_setup_guide_${userId}`; }

function load(userId: string): GuideState {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<GuideState>) } : DEFAULT;
  } catch { return DEFAULT; }
}

function persist(userId: string, state: GuideState) {
  localStorage.setItem(key(userId), JSON.stringify(state));
}

export function useSetupGuide() {
  const userId = useAuthStore((s) => s.user?.id);
  const [state, setState] = useState<GuideState>(() => (userId ? load(userId) : DEFAULT));

  useEffect(() => {
    if (userId) setState(load(userId));
  }, [userId]);

  const update = useCallback(
    (patch: Partial<GuideState>) => {
      if (!userId) return;
      setState((prev) => {
        const next = { ...prev, ...patch };
        persist(userId, next);
        return next;
      });
    },
    [userId],
  );

  const markStepDone = useCallback(
    (stepId: GuideStepId) => {
      if (!userId) return;
      setState((prev) => {
        if (prev.completedSteps.includes(stepId)) return prev;
        const next = { ...prev, completedSteps: [...prev.completedSteps, stepId] };
        persist(userId, next);
        return next;
      });
    },
    [userId],
  );

  const markTourDone = useCallback(() => update({ tourDone: true }), [update]);
  const dismiss      = useCallback(() => update({ dismissed: true }), [update]);
  const reopen       = useCallback(() => update({ dismissed: false }), [update]);

  return { state, markStepDone, markTourDone, dismiss, reopen };
}
