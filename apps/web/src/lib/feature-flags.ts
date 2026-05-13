import type { OrgPlan } from '@hrms/shared-types';

const PLAN_RANK: Record<OrgPlan, number> = {
  FREE: 0,
  STARTER: 1,
  GROWTH: 2,
  ENTERPRISE: 3,
};

// Maps feature key → minimum plan required to access it.
// Features not listed here are available on all plans.
export const FEATURE_MIN_PLAN: Record<string, OrgPlan> = {
  // STARTER features
  payroll: 'STARTER',
  'my-payslips': 'STARTER',
  'tax-declaration': 'STARTER',
  departments: 'STARTER',
  shifts: 'STARTER',
  helpdesk: 'STARTER',
  suggestions: 'STARTER',
  'hr-policies': 'STARTER',
  regularisation: 'STARTER',
  'comp-off': 'STARTER',
  // GROWTH features
  analytics: 'GROWTH',
  recruitment: 'GROWTH',
  onboarding: 'GROWTH',
  offboarding: 'GROWTH',
  performance: 'GROWTH',
  'pulse-surveys': 'GROWTH',
};

export function canAccess(orgPlan: OrgPlan, feature: string): boolean {
  const required = FEATURE_MIN_PLAN[feature];
  if (!required) return true;
  return PLAN_RANK[orgPlan] >= PLAN_RANK[required];
}

export function requiredPlan(feature: string): OrgPlan | null {
  return FEATURE_MIN_PLAN[feature] ?? null;
}

export const PLAN_LABELS: Record<OrgPlan, string> = {
  FREE: 'Free',
  STARTER: 'Starter',
  GROWTH: 'Growth',
  ENTERPRISE: 'Enterprise',
};
