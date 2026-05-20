import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useEWARequests(isHR: boolean) {
  return useQuery({
    queryKey: ['ewa', isHR ? 'all' : 'mine'],
    queryFn: () =>
      apiClient.get(isHR ? '/ewa' : '/ewa/mine').then((r) => r.data.data),
  });
}

export function useCreateEWARequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number; notes?: string }) =>
      apiClient.post('/ewa', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ewa'] });
      toast.success('Advance request submitted');
    },
    onError: () => toast.error('Failed to submit request'),
  });
}

export function useUpdateEWAStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/ewa/${id}`, { status }).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ewa'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });
}
