import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useReferrals() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const res = await api.get('/referrals');
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
    }) => api.post('/referrals', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });
}

export function useUpdateReferralStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status: string; bonusAmount?: number; bonusPaid?: boolean; rejectedReason?: string }) =>
      api.patch(`/referrals/${id}/status`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });
}

export function useDeleteReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/referrals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['referrals'] }),
  });
}
