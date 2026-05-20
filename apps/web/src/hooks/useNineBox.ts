import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useNineBoxAssessments(cycleId?: string) {
  return useQuery({
    queryKey: ['nine-box', cycleId],
    queryFn: () =>
      apiClient.get('/nine-box', { params: cycleId ? { cycleId } : {} }).then((r) => r.data.data),
  });
}

export function useUpsertNineBoxAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/nine-box', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nine-box'] }); toast.success('Assessment saved'); },
    onError: () => toast.error('Failed to save assessment'),
  });
}
