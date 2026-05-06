import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export interface MyPayslipSummary {
  id: string;
  month: number;
  year: number;
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: string;
  pdfUrl: string | null;
}

export interface PayslipLineItem {
  code: string;
  name: string;
  amount: number;
}

export interface MyPayslipDetail extends MyPayslipSummary {
  earnings: PayslipLineItem[];
  deductions: PayslipLineItem[];
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function useMyPayslips(year?: number) {
  return useQuery({
    queryKey: ['my-payslips', year],
    queryFn: async () => {
      const res = await apiClient.get<{ data: MyPayslipSummary[] }>('/payroll/my-payslips', {
        params: year ? { year } : {},
      });
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyPayslipDetail(id: string | null) {
  return useQuery({
    queryKey: ['my-payslips', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: MyPayslipDetail }>(`/payroll/my-payslips/${id!}`);
      return res.data.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
