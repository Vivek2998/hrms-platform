import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface LetterOrg {
  name: string;
  address: string;
  email: string;
  phone: string;
  logoUrl: string | null;
}

export interface ExperienceLetter {
  type: 'EXPERIENCE';
  issuedDate: string;
  employee: {
    name: string; code: string; designation: string;
    department: string; dateOfJoining: string | null; gender: string | null;
  };
  organization: LetterOrg;
}

export interface SalaryCertificate {
  type: 'SALARY_CERTIFICATE';
  issuedDate: string;
  employee: {
    name: string; code: string; designation: string;
    department: string; dateOfJoining: string | null;
  };
  salary: { ctc: number; gross: number; basic: number; netPay: number } | null;
  organization: LetterOrg;
}

export async function fetchExperienceLetter(employeeId: string): Promise<ExperienceLetter> {
  const res = await apiClient.get<ApiResponse<ExperienceLetter>>(`/letters/experience/${employeeId}`);
  return res.data.data;
}

export async function fetchSalaryCertificate(employeeId: string): Promise<SalaryCertificate> {
  const res = await apiClient.get<ApiResponse<SalaryCertificate>>(`/letters/salary-certificate/${employeeId}`);
  return res.data.data;
}
