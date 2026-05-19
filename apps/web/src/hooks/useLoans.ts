import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CLOSED' | 'CANCELLED';
export type LoanType = 'PERSONAL_LOAN' | 'SALARY_ADVANCE' | 'VEHICLE_LOAN' | 'HOME_LOAN' | 'EDUCATION_LOAN' | 'OTHER';

export interface LoanEmployee {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  avatarUrl: string | null;
}

export interface LoanRequest {
  id: string;
  employeeId: string;
  loanType: LoanType;
  amount: number;
  tenure: number | null;
  emi: number | null;
  purpose: string;
  status: LoanStatus;
  approvedAt: string | null;
  rejectedReason: string | null;
  disbursedAt: string | null;
  repaidAmount: number;
  notes: string | null;
  createdAt: string;
  employee: LoanEmployee;
  approvedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface CreateLoanInput {
  loanType: LoanType;
  amount: number;
  tenure?: number;
  purpose: string;
  notes?: string;
}

export function useLoans() {
  return useQuery<LoanRequest[]>({
    queryKey: ['loans'],
    queryFn: async () => {
      const res = await api.get('/loans');
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoanInput) => api.post('/loans', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

export function useApproveLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/loans/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

export function useRejectLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/loans/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

export function useDisburseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/loans/${id}/disburse`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

export function useCloseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/loans/${id}/close`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}

export function useCancelLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/loans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans'] }),
  });
}
