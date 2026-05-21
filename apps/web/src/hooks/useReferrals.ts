import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';

export function useReferrals() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const res = await apiClient.get('/referrals');
      return res.data.data as any[];
    },
  });
}

export function useCreateReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      jobId?: string;
      candidateName: string;
      candidateEmail: string;
      candidatePhone?: string;
      position: string;
      message?: string;
    }) => apiClient.post('/referrals', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });
}

export function useUpdateReferralStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; bonusAmount?: number; bonusPaid?: boolean; rejectedReason?: string }) =>
      apiClient.patch(`/referrals/${id}/status`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });
}

export function useDeleteReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/referrals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });
}
