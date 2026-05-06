import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface SalaryRevision {
  id: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  ctc: number;
  basic: number;
  gross: number;
  netPay: number;
  components: { code: string; name: string; amount: number }[];
  reason?: string | null;
  createdAt: string;
}

interface CreateRevisionInput {
  employeeId: string;
  effectiveFrom: string;
  ctc: number;
  reason?: string;
}

export const salaryKeys = {
  all: ['salary'] as const,
  revisions: (employeeId: string) => ['salary', 'revisions', employeeId] as const,
};

export function useSalaryRevisions(employeeId: string) {
  return useQuery({
    queryKey: salaryKeys.revisions(employeeId),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SalaryRevision[]>>('/salary-revisions', {
        params: { employeeId, limit: 10 },
      });
      return res.data.data;
    },
    enabled: !!employeeId,
  });
}

export function useCreateSalaryRevision(employeeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRevisionInput) => {
      const res = await apiClient.post<ApiResponse<SalaryRevision>>('/salary-revisions', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: salaryKeys.revisions(employeeId) });
      toast.success('Salary revision saved');
    },
    onError: () => {
      toast.error('Failed to save salary revision');
    },
  });
}
