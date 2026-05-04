import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, PayrollRun } from '@hrms/shared-types';

interface CreateRunInput {
  month: number;
  year: number;
}

export const payrollKeys = {
  all: ['payroll'] as const,
  runs: (params?: { page?: number; limit?: number }) => ['payroll', 'runs', params] as const,
};

export function usePayrollRuns(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: payrollKeys.runs(params),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PayrollRun[]>>('/payroll/runs', { params });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return { data: res.data.data, meta: res.data.meta! };
    },
  });
}

export function useCreatePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRunInput) => {
      const res = await apiClient.post<ApiResponse<PayrollRun>>('/payroll/runs', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.all });
      toast.success('Payroll run created');
    },
    onError: () => {
      toast.error('Failed to create payroll run');
    },
  });
}

export function useProcessPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<ApiResponse<PayrollRun>>(`/payroll/runs/${id}/process`);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: payrollKeys.all });
      toast.success('Payroll processed successfully');
    },
    onError: () => {
      toast.error('Failed to process payroll run');
    },
  });
}
