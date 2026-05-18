import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse, ApprovalInboxItem, ApprovalItemType } from '@hrms/shared-types';

export function useApprovalInbox(type?: ApprovalItemType) {
  return useQuery({
    queryKey: ['approval-inbox', type],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ApprovalInboxItem[]>>('/approval-inbox', {
        params: type ? { type } : undefined,
      });
      return res.data.data;
    },
  });
}

export function useApprovalInboxCount() {
  return useQuery({
    queryKey: ['approval-inbox', 'count'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ count: number }>>('/approval-inbox/count');
      return res.data.data.count;
    },
    refetchInterval: 60_000,
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED' | 'REJECTED'; remarks?: string }) =>
      apiClient.patch(`/leaves/${id}/approve`, { action }),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['approval-inbox'] });
      qc.invalidateQueries({ queryKey: ['leaves'] });
      toast.success(action === 'APPROVED' ? 'Leave approved' : 'Leave rejected');
    },
    onError: () => toast.error('Action failed'),
  });
}

export function useApproveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVE' | 'REJECT'; reviewNote?: string }) =>
      apiClient.patch(`/expenses/${id}/review`, { action }),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['approval-inbox'] });
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(action === 'APPROVE' ? 'Expense approved' : 'Expense rejected');
    },
    onError: () => toast.error('Action failed'),
  });
}

export function useApproveRegularisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED' | 'REJECTED' }) =>
      apiClient.patch(`/regularisations/${id}/review`, { action }),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['approval-inbox'] });
      toast.success(action === 'APPROVED' ? 'Regularisation approved' : 'Regularisation rejected');
    },
    onError: () => toast.error('Action failed'),
  });
}

export function useApproveCompOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVED' | 'REJECTED' }) =>
      apiClient.patch(`/comp-offs/${id}/review`, { action }),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['approval-inbox'] });
      toast.success(action === 'APPROVED' ? 'Comp-off approved' : 'Comp-off rejected');
    },
    onError: () => toast.error('Action failed'),
  });
}
