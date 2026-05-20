import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

export function useBenefitPlans() {
  return useQuery({
    queryKey: ['benefit-plans'],
    queryFn: () => apiClient.get('/benefits').then((r) => r.data.data),
  });
}

export function useCreateBenefitPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/benefits', data).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['benefit-plans'] }); toast.success('Benefit plan created'); },
    onError: () => toast.error('Failed to create plan'),
  });
}

export function useEnrollBenefit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, action }: { planId: string; action: 'enroll' | 'waive' }) =>
      apiClient.post(`/benefits/${planId}/enroll`, { action }).then((r) => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['benefit-plans'] }); toast.success('Enrollment updated'); },
    onError: () => toast.error('Failed to update enrollment'),
  });
}

export function useBenefitEnrollments() {
  return useQuery({
    queryKey: ['benefit-enrollments'],
    queryFn: () => apiClient.get('/benefits/enrollments').then((r) => r.data.data),
  });
}
