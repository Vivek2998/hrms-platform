import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface CompOffRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  workedDate: string;
  requestedDate?: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: string | null;
  };
}

interface CreateCompOffInput {
  workedDate: string;
  requestedDate?: string;
  reason: string;
}

interface ReviewInput {
  action: 'APPROVED' | 'REJECTED';
  remarks?: string;
}

export const compOffKeys = {
  all: ['comp-offs'] as const,
  list: (status?: string) => ['comp-offs', 'list', status ?? 'ALL'] as const,
};

export function useCompOffs(status?: string) {
  return useQuery({
    queryKey: compOffKeys.list(status),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CompOffRequest[]>>('/comp-offs', {
        params: { limit: 50, ...(status && status !== 'ALL' ? { status } : {}) },
      });
      return res.data;
    },
  });
}

export function useCreateCompOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCompOffInput) => {
      const res = await apiClient.post<ApiResponse<CompOffRequest>>('/comp-offs', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: compOffKeys.all });
      toast.success('Comp off request submitted');
    },
    onError: () => {
      toast.error('Failed to submit request');
    },
  });
}

export function useReviewCompOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ReviewInput & { id: string }) => {
      await apiClient.patch(`/comp-offs/${id}/review`, input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: compOffKeys.all });
      toast.success('Request updated');
    },
    onError: () => {
      toast.error('Failed to update request');
    },
  });
}
