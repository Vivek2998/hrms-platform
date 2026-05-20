import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useSuccessionPlans() {
  return useQuery({
    queryKey: ['succession-plans'],
    queryFn: () => apiClient.get('/succession/plans').then((r) => r.data.data),
  });
}

export function useCreateSuccessionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/succession/plans', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['succession-plans'] }); toast.success('Plan created'); },
    onError: () => toast.error('Failed to create plan'),
  });
}

export function useUpdateSuccessionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [k: string]: any }) =>
      apiClient.patch(`/succession/plans/${id}`, data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['succession-plans'] }); toast.success('Plan updated'); },
    onError: () => toast.error('Failed to update plan'),
  });
}

export function useDeleteSuccessionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/succession/plans/${id}`).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['succession-plans'] }); toast.success('Plan deleted'); },
    onError: () => toast.error('Failed to delete plan'),
  });
}

export function useAddSuccessionNominee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ...data }: { planId: string; employeeId: string; readiness?: string; notes?: string }) =>
      apiClient.post(`/succession/plans/${planId}/nominees`, data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['succession-plans'] }); toast.success('Nominee added'); },
    onError: () => toast.error('Failed to add nominee'),
  });
}

export function useRemoveSuccessionNominee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, employeeId }: { planId: string; employeeId: string }) =>
      apiClient.delete(`/succession/plans/${planId}/nominees/${employeeId}`).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['succession-plans'] }); toast.success('Nominee removed'); },
    onError: () => toast.error('Failed to remove nominee'),
  });
}
