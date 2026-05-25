import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface EmpCodeSettings {
  currentPrefix: string;
  formatExample: string;
  pendingRequest: {
    id: string;
    requestedPrefix: string;
    applyToExisting: boolean;
    reason?: string;
    status: 'PENDING';
    createdAt: string;
  } | null;
}

export interface EmpCodeChangeRequestInput {
  requestedPrefix: string;
  applyToExisting: boolean;
  reason?: string;
}

const KEY = ['org', 'employee-code-settings'] as const;

export function useEmpCodeSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<EmpCodeSettings>>(
        '/organizations/settings/employee-code',
      );
      return res.data.data;
    },
  });
}

export function useRequestEmpCodeChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmpCodeChangeRequestInput) => {
      const res = await apiClient.post<ApiResponse<unknown>>(
        '/organizations/settings/employee-code/request',
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      toast.success('Request submitted! The platform administrator will review it shortly.');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? 'Failed to submit request');
    },
  });
}
