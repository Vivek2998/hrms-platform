import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useHeadcountPlans() {
  return useQuery({
    queryKey: ['headcount-plans'],
    queryFn: () => apiClient.get('/headcount/plans').then((r) => r.data.data),
  });
}

export function useCreateHeadcountPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/headcount/plans', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['headcount-plans'] }); toast.success('Plan created'); },
    onError: () => toast.error('Failed to create plan'),
  });
}

export function useUpdateHeadcountPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [k: string]: any }) =>
      apiClient.patch(`/headcount/plans/${id}`, data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['headcount-plans'] }); toast.success('Plan updated'); },
    onError: () => toast.error('Failed to update plan'),
  });
}

export function useOpenPositions() {
  return useQuery({
    queryKey: ['open-positions'],
    queryFn: () => apiClient.get('/headcount/positions').then((r) => r.data.data),
  });
}

export function useCreateOpenPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/headcount/positions', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['open-positions'] }); toast.success('Position created'); },
    onError: () => toast.error('Failed to create position'),
  });
}

export function useUpdateOpenPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [k: string]: any }) =>
      apiClient.patch(`/headcount/positions/${id}`, data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['open-positions'] }); toast.success('Position updated'); },
    onError: () => toast.error('Failed to update position'),
  });
}
