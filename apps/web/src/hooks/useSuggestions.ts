import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface Suggestion {
  id: string;
  organizationId: string;
  employeeId: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  status: 'OPEN' | 'REVIEWED' | 'CLOSED';
  response?: string | null;
  respondedBy?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    designation?: string | null;
  } | null;
}

export function useSuggestions() {
  return useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Suggestion[]>>('/suggestions');
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useSubmitSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; content: string; isAnonymous: boolean }) => {
      const res = await apiClient.post<ApiResponse<Suggestion>>('/suggestions', data);
      return res.data.data;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['suggestions'] }); },
  });
}

export function useRespondToSuggestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, response, status }: { id: string; response: string; status: 'REVIEWED' | 'CLOSED' }) => {
      const res = await apiClient.patch<ApiResponse<Suggestion>>(`/suggestions/${id}/respond`, { response, status });
      return res.data.data;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['suggestions'] }); },
  });
}
