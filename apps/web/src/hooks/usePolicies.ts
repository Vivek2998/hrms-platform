import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export type PolicyCategory = 'GENERAL' | 'LEAVE' | 'CODE_OF_CONDUCT' | 'BENEFITS' | 'SAFETY' | 'OTHER';

export interface HrPolicy {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  fileUrl: string;
  fileSize?: number | null;
  mimeType?: string | null;
  category: PolicyCategory;
  version?: string | null;
  isActive: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export function usePolicies() {
  return useQuery({
    queryKey: ['hr-policies'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HrPolicy[]>>('/hr-policies');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
      category: PolicyCategory;
      version?: string;
    }) => {
      const res = await apiClient.post<ApiResponse<HrPolicy>>('/hr-policies', data);
      return res.data.data;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['hr-policies'] }); },
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/hr-policies/${id}`);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['hr-policies'] }); },
  });
}
