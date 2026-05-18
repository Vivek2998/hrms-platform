import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, Kudos, KudosCategory } from '@hrms/shared-types';

export function useKudosFeed(params?: { toEmployeeId?: string; fromEmployeeId?: string }) {
  return useQuery({
    queryKey: ['kudos', 'feed', params],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Kudos[]>>('/kudos', { params });
      return res.data.data;
    },
  });
}

export function useMyKudos() {
  return useQuery({
    queryKey: ['kudos', 'my'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Kudos[]>>('/kudos/my');
      return res.data.data;
    },
  });
}

export function useGiveKudos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      toEmployeeId: string;
      category: KudosCategory;
      message: string;
      isPublic?: boolean;
    }) => apiClient.post('/kudos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kudos'] });
      toast.success('Kudos sent!');
    },
    onError: () => toast.error('Failed to send kudos'),
  });
}

export function useReactToKudos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      apiClient.patch(`/kudos/${id}/react`, { emoji }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kudos'] }),
    onError: () => toast.error('Failed to react'),
  });
}

export function useDeleteKudos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/kudos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kudos'] });
      toast.success('Kudos removed');
    },
    onError: () => toast.error('Failed to delete'),
  });
}
