import type { IndiaState } from '@hrms/shared-types';

// ============================================================
// India Statutory Payroll Calculations
// FY 2025-26 rates — update when government regulations change
// Sources:
//   PF:       The Employees' Provident Funds Act, 1952
//   ESI:      Employees' State Insurance Act, 1948
//   Gratuity: Payment of Gratuity Act, 1972
//   PT:       State-specific Professional Tax Acts
// ============================================================

// ─────────────────────────────────────────────────────────────
// Provident Fund (PF / EPF)
// ─────────────────────────────────────────────────────────────

const PF_WAGE_CEILING_MONTHLY = 15_000;
const EMPLOYEE_PF_RATE = 0.12; // 12% employee contribution
const EMPLOYER_EPF_RATE = 0.0367; // 3.67% to EPF account
const EMPLOYER_EPS_RATE = 0.0833; // 8.33% to EPS (pension scheme)
const EMPLOYER_EDLI_RATE = 0.005; // 0.5% EDLI (insurance)
const EMPLOYER_ADMIN_CHARGE = 0.01; // 1% admin charge (min ₹500/month)

export interface PFResult {
  pfWage: number;
  isAboveCeiling: boolean;
  employeeEPF: number;
  employerEPF: number;
  employerEPS: number;
  employerEDLI: number;
  employerAdminCharge: number;
  totalEmployerContribution: number;
  totalCostToEmployer: number;
}

/**
 * Calculate PF contributions.
 * @param basicPlusDa - Basic salary + Dearness Allowance per month
 * @param restrictToCeiling - If true, cap PF wage at ₹15,000 (statutory default)
 */
export function calculatePF(basicPlusDa: number, restrictToCeiling = true): PFResult {
  const pfWage = restrictToCeiling ? Math.min(basicPlusDa, PF_WAGE_CEILING_MONTHLY) : basicPlusDa;

  const employeeEPF = Math.round(pfWage * EMPLOYEE_PF_RATE);
  const employerEPS = Math.round(pfWage * EMPLOYER_EPS_RATE);
  const employerEPF = Math.round(pfWage * EMPLOYER_EPF_RATE);
  const employerEDLI = Math.round(pfWage * EMPLOYER_EDLI_RATE);
  const adminCharge = Math.max(500, Math.round(pfWage * EMPLOYER_ADMIN_CHARGE));

  return {
    pfWage,
    isAboveCeiling: basicPlusDa > PF_WAGE_CEILING_MONTHLY,
    employeeEPF,
    employerEPF,
    employerEPS,
    employerEDLI,
    employerAdminCharge: adminCharge,
    totalEmployerContribution: employerEPF + employerEPS,
    totalCostToEmployer: employerEPF + employerEPS + employerEDLI + adminCharge,
  };
}

// ─────────────────────────────────────────────────────────────
// ESI — Employees' State Insurance
// ─────────────────────────────────────────────────────────────

const ESI_WAGE_CEILING_MONTHLY = 21_000;
const EMPLOYEE_ESI_RATE = 0.0075; // 0.75%
const EMPLOYER_ESI_RATE = 0.0325; // 3.25%

export interface ESIResult {
  grossSalary: number;
  isEligible: boolean;
  employeeContribution: number;
  employerContribution: number;
  totalESI: number;
}

export function calculateESI(grossSalary: number): ESIResult {
  if (grossSalary > ESI_WAGE_CEILING_MONTHLY) {
    return {
      grossSalary,
      isEligible: false,
      employeeContribution: 0,
      employerContribution: 0,
      totalESI: 0,
    };
  }

  const employee = Math.round(grossSalary * EMPLOYEE_ESI_RATE);
  const employer = Math.round(grossSalary * EMPLOYER_ESI_RATE);

  return {
    grossSalary,
    isEligible: true,
    employeeContribution: employee,
    employerContribution: employer,
    totalESI: employee + employer,
  };
}

// ─────────────────────────────────────────────────────────────
// Professional Tax (PT) — State-wise monthly slabs
// States not listed here do not levy Professional Tax
// ─────────────────────────────────────────────────────────────

interface PTSlab {
  min: number;
  max: number | null;
  monthlyAmount: number;
}

const PT_SLABS: Partial<Record<IndiaState, PTSlab[]>> = {
  KA: [
    { min: 0, max: 14_999, monthlyAmount: 0 },
    { min: 15_000, max: 29_999, monthlyAmount: 150 },
    { min: 30_000, max: null, monthlyAmount: 200 },
  ],
  MH: [
    { min: 0, max: 7_499, monthlyAmount: 0 },
    { min: 7_500, max: 9_999, monthlyAmount: 175 },
    { min: 10_000, max: null, monthlyAmount: 200 },
  ],
  TN: [
    { min: 0, max: 3_499, monthlyAmount: 0 },
    { min: 3_500, max: 4_999, monthlyAmount: 135 },
    { min: 5_000, max: 7_499, monthlyAmount: 315 },
    { min: 7_500, max: 9_999, monthlyAmount: 690 },
    { min: 10_000, max: 12_499, monthlyAmount: 1_025 },
    { min: 12_500, max: null, monthlyAmount: 1_250 },
  ],
  WB: [
    { min: 0, max: 8_500, monthlyAmount: 0 },
    { min: 8_501, max: 10_000, monthlyAmount: 90 },
    { min: 10_001, max: 15_000, monthlyAmount: 110 },
    { min: 15_001, max: 25_000, monthlyAmount: 130 },
    { min: 25_001, max: 40_000, monthlyAmount: 150 },
    { min: 40_001, max: null, monthlyAmount: 200 },
  ],
  AP: [
    { min: 0, max: 15_000, monthlyAmount: 0 },
    { min: 15_001, max: 20_000, monthlyAmount: 150 },
    { min: 20_001, max: null, monthlyAmount: 200 },
  ],
  TS: [
    { min: 0, max: 15_000, monthlyAmount: 0 },
    { min: 15_001, max: 20_000, monthlyAmount: 150 },
    { min: 20_001, max: null, monthlyAmount: 200 },
  ],
  GJ: [
    { min: 0, max: 5_999, monthlyAmount: 0 },
    { min: 6_000, max: 8_999, monthlyAmount: 80 },
    { min: 9_000, max: 11_999, monthlyAmount: 150 },
    { min: 12_000, max: null, monthlyAmount: 200 },
  ],
  MP: [
    { min: 0, max: 18_750, monthlyAmount: 0 },
    { min: 18_751, max: null, monthlyAmount: 208 },
  ],
};

export function calculateProfessionalTax(grossSalary: number, state: IndiaState): number {
  const slabs = PT_SLABS[state];
  if (!slabs) return 0;

  const slab = slabs.find((s) => grossSalary >= s.min && (s.max === null || grossSalary <= s.max));
  return slab?.monthlyAmount ?? 0;
}

// ─────────────────────────────────────────────────────────────
// Gratuity — Payment of Gratuity Act, 1972
// ─────────────────────────────────────────────────────────────

const GRATUITY_MIN_SERVICE_YEARS = 5;
const GRATUITY_DAYS_PER_YEAR = 15;
const GRATUITY_WORKING_DAYS_PER_MONTH = 26;
const GRATUITY_MAX_AMOUNT = 2_000_000; // ₹20 lakhs cap

export interface GratuityResult {
  isEligible: boolean;
  yearsOfService: number;
  monthsOfService: number;
  effectiveYears: number; // Rounded as per Act
  lastDrawnBasicPlusDA: number;
  gratuityAmount: number; // Capped at statutory maximum
  isAboveTaxFreeLimit: boolean;
}

export function calculateGratuity(
  joiningDate: Date,
  lastWorkingDate: Date,
  lastDrawnBasicPlusDA: number,
): GratuityResult {
  const totalMonths =
    (lastWorkingDate.getFullYear() - joiningDate.getFullYear()) * 12 +
    (lastWorkingDate.getMonth() - joiningDate.getMonth());

  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;
  const effectiveYears = remainingMonths >= 6 ? years + 1 : years;
  const isEligible = years >= GRATUITY_MIN_SERVICE_YEARS;

  const perDayRate = lastDrawnBasicPlusDA / GRATUITY_WORKING_DAYS_PER_MONTH;
  const rawAmount = isEligible
    ? Math.round(perDayRate * GRATUITY_DAYS_PER_YEAR * effectiveYears)
    : 0;

  const gratuityAmount = Math.min(rawAmount, GRATUITY_MAX_AMOUNT);

  return {
    isEligible,
    yearsOfService: years,
    monthsOfService: totalMonths,
    effectiveYears,
    lastDrawnBasicPlusDA,
    gratuityAmount,
    isAboveTaxFreeLimit: rawAmount > GRATUITY_MAX_AMOUNT,
  };
}

// ─────────────────────────────────────────────────────────────
// Attendance-linked salary (Loss of Pay / Pro-rata)
// ─────────────────────────────────────────────────────────────

export function calculateLOP(
  monthlySalary: number,
  workingDaysInMonth: number,
  absentDays: number,
): number {
  if (workingDaysInMonth === 0 || absentDays <= 0) return 0;
  const perDay = monthlySalary / workingDaysInMonth;
  return Math.round(perDay * Math.min(absentDays, workingDaysInMonth));
}

export function calculateProRataSalary(
  monthlySalary: number,
  workingDaysInMonth: number,
  daysWorked: number,
): number {
  if (workingDaysInMonth === 0) return 0;
  return Math.round((monthlySalary / workingDaysInMonth) * Math.max(0, daysWorked));
}

// ─────────────────────────────────────────────────────────────
// Leave Encashment
// ─────────────────────────────────────────────────────────────

export function calculateLeaveEncashment(
  monthlySalary: number,
  leaveDays: number,
  workingDaysPerMonth = 26,
): number {
  const perDayRate = monthlySalary / workingDaysPerMonth;
  return Math.round(perDayRate * leaveDays);
}
