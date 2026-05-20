import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useSalaryRevisionProposals() {
  return useQuery({
    queryKey: ['salary-revision-proposals'],
    queryFn: () => apiClient.get('/salary-revision-proposals').then((r) => r.data.data),
  });
}

export function useCreateRevisionProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/salary-revision-proposals', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-revision-proposals'] }); toast.success('Revision proposal submitted'); },
    onError: () => toast.error('Failed to submit proposal'),
  });
}

export function useApproveRevisionProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/salary-revision-proposals/${id}/approve`).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-revision-proposals'] }); toast.success('Revision approved and salary updated'); },
    onError: () => toast.error('Failed to approve'),
  });
}

export function useRejectRevisionProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.patch(`/salary-revision-proposals/${id}/reject`, { reason }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salary-revision-proposals'] }); toast.success('Proposal rejected'); },
    onError: () => toast.error('Failed to reject'),
  });
}
