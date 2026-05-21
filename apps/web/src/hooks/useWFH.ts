import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export function useWFHRequests() {
  return useQuery({
    queryKey: ['wfh'],
    queryFn: async () => {
      const res = await apiClient.get('/wfh');
      return res.data.data as any[];
    },
  });
}

export function useCreateWFH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; reason?: string }) => apiClient.post('/wfh', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wfh'] }),
  });
}

export function useApproveWFH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/wfh/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wfh'] }),
  });
}

export function useRejectWFH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.patch(`/wfh/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wfh'] }),
  });
}

export function useCancelWFH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/wfh/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wfh'] }),
  });
}
