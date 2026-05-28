import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useESOPs(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['esop', 'all'],
    enabled: options?.enabled ?? true,
    queryFn: () => apiClient.get('/esop').then((r) => r.data.data),
  });
}

export function useMyESOPs() {
  return useQuery({
    queryKey: ['esop', 'mine'],
    queryFn: () => apiClient.get('/esop/mine').then((r) => r.data.data),
  });
}

export function useCreateGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/esop', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esop'] });
      toast.success('ESOP grant created');
    },
    onError: () => toast.error('Failed to create grant'),
  });
}

export function useUpdateGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiClient.patch(`/esop/${id}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esop'] });
      toast.success('Grant updated');
    },
    onError: () => toast.error('Failed to update grant'),
  });
}

export function useExerciseOptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      optionsCount,
      exercisePrice,
    }: {
      id: string;
      optionsCount: number;
      exercisePrice: number;
    }) =>
      apiClient
        .post(`/esop/${id}/exercise`, { optionsCount, exercisePrice })
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['esop'] });
      toast.success('Options exercised successfully');
    },
    onError: () => toast.error('Failed to exercise options'),
  });
}
