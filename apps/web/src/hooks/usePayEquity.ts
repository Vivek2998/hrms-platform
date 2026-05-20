import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function usePayEquityLatest() {
  return useQuery({
    queryKey: ['pay-equity', 'latest'],
    queryFn: () => apiClient.get('/pay-equity/latest').then((r) => r.data.data),
    retry: false,
  });
}

export function usePayEquityHistory() {
  return useQuery({
    queryKey: ['pay-equity', 'history'],
    queryFn: () => apiClient.get('/pay-equity').then((r) => r.data.data),
  });
}

export function useGeneratePayEquity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post('/pay-equity/generate').then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pay-equity'] });
      toast.success('Pay equity report generated');
    },
    onError: () => toast.error('Failed to generate report'),
  });
}
