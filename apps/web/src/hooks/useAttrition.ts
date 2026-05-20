import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useAttritionScores() {
  return useQuery({
    queryKey: ['attrition'],
    queryFn: () => apiClient.get('/attrition').then((r) => r.data.data),
  });
}

export function useComputeAttrition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/attrition/compute').then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attrition'] });
      toast.success('Attrition scores recomputed');
    },
    onError: () => toast.error('Failed to compute scores'),
  });
}
