import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useInterviewScorecards() {
  return useQuery({
    queryKey: ['interview-scorecards'],
    queryFn: () =>
      apiClient.get('/interview-scorecards').then((r) => r.data.data),
  });
}

export function useCreateScorecard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient.post('/interview-scorecards', data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interview-scorecards'] });
      toast.success('Scorecard created');
    },
    onError: () => toast.error('Failed to create scorecard'),
  });
}

export function useUpdateScorecard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiClient.patch(`/interview-scorecards/${id}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interview-scorecards'] });
      toast.success('Scorecard updated');
    },
    onError: () => toast.error('Failed to update scorecard'),
  });
}
