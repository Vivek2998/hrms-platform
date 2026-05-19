import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useWFHRequests() {
  return useQuery({
    queryKey: ['wfh'],
    queryFn: async () => {
      const res = await api.get('/wfh');
      return res.data.data as any[];
    },
  });
}

export function useCreateWFH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; reason?: string }) => api.post('/wfh', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wfh'] }),
  });
}

export function useApproveWFH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/wfh/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wfh'] }),
  });
}

export function useRejectWFH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch(`/wfh/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wfh'] }),
  });
}

export function useCancelWFH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/wfh/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wfh'] }),
  });
}
