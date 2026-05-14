import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

// ── Salary Components ──────────────────────────────────────

export interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: 'EARNING' | 'DEDUCTION' | 'STATUTORY';
  isFixedAmount: boolean;
  defaultPercent?: number | null;
  defaultAmount?: number | null;
  isTaxable: boolean;
  isActive: boolean;
  displayOrder: number;
}

interface ComponentInput {
  name: string;
  code: string;
  type: 'EARNING' | 'DEDUCTION' | 'STATUTORY';
  isFixedAmount: boolean;
  defaultPercent?: number;
  defaultAmount?: number;
  isTaxable: boolean;
  displayOrder?: number;
}

export const componentKeys = { all: ['salary-components'] as const };

export function useSalaryComponents() {
  return useQuery({
    queryKey: componentKeys.all,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SalaryComponent[]>>('/salary-components');
      return res.data.data ?? [];
    },
  });
}

export function useCreateSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ComponentInput) => {
      const res = await apiClient.post<ApiResponse<SalaryComponent>>('/salary-components', input);
      return res.data.data;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: componentKeys.all }); toast.success('Component created'); },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Failed to create component');
    },
  });
}

export function useUpdateSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ComponentInput & { id: string }) => {
      const res = await apiClient.patch<ApiResponse<SalaryComponent>>(`/salary-components/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: componentKeys.all }); toast.success('Component updated'); },
    onError: () => toast.error('Failed to update component'),
  });
}

export function useDeleteSalaryComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/salary-components/${id}`); },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: componentKeys.all }); toast.success('Component removed'); },
    onError: () => toast.error('Failed to remove component'),
  });
}

// ── Salary Revisions ───────────────────────────────────────

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
