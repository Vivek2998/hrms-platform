import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface RegularisationRequest {
  id: string;
  organizationId: string;
  employeeId: string;
  date: string;
  requestedIn?: string | null;
  requestedOut?: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  remarks?: string | null;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: string | null;
  };
}

interface CreateRegularisationInput {
  date: string;
  requestedIn?: string;
  requestedOut?: string;
  reason: string;
}

interface ReviewInput {
  action: 'APPROVED' | 'REJECTED';
  remarks?: string;
}

export const regularisationKeys = {
  all: ['regularisations'] as const,
  list: (status?: string) => ['regularisations', 'list', status ?? 'ALL'] as const,
};

export function useRegularisations(status?: string) {
  return useQuery({
    queryKey: regularisationKeys.list(status),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<RegularisationRequest[]>>(
        '/regularisations',
        { params: { limit: 50, ...(status && status !== 'ALL' ? { status } : {}) } },
      );
      return res.data;
    },
  });
}

export function useCreateRegularisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRegularisationInput) => {
      const res = await apiClient.post<ApiResponse<RegularisationRequest>>(
        '/regularisations',
        input,
      );
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: regularisationKeys.all });
      toast.success('Regularisation request submitted');
    },
    onError: () => {
      toast.error('Failed to submit request');
    },
  });
}

export function useReviewRegularisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ReviewInput & { id: string }) => {
      await apiClient.patch(`/regularisations/${id}/review`, input);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: regularisationKeys.all });
      toast.success('Request updated');
    },
    onError: () => {
      toast.error('Failed to update request');
    },
  });
}
