import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export function useShiftSwaps() {
  return useQuery({
    queryKey: ['shift-swaps'],
    queryFn: async () => {
      const res = await apiClient.get('/shift-swaps');
      return res.data.data as any[];
    },
  });
}

export function useCreateShiftSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetId: string; requesterDate: string; targetDate: string; reason?: string }) =>
      apiClient.post('/shift-swaps', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-swaps'] }),
  });
}

export function useAcceptShiftSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/shift-swaps/${id}/accept`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-swaps'] }),
  });
}

export function useApproveShiftSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/shift-swaps/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-swaps'] }),
  });
}

export function useRejectShiftSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.patch(`/shift-swaps/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-swaps'] }),
  });
}

export function useCancelShiftSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/shift-swaps/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shift-swaps'] }),
  });
}
