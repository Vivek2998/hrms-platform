import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface MyLeaveRequest {
  id: string;
  leaveTypeId: string;
  leaveType: { id: string; name: string; code: string };
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  session?: 'FIRST_HALF' | 'SECOND_HALF' | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvals?: { remarks?: string | null }[];
  createdAt: string;
}

export interface LeaveBalance {
  leaveTypeId: string;
  leaveType: { name: string; code: string };
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  daysAllowed: number;
  isPaid: boolean;
  colorHex: string;
}

interface ApplyLeaveInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  session?: 'FIRST_HALF' | 'SECOND_HALF';
}

export const myLeaveKeys = {
  all: ['my-leaves'] as const,
  list: (status?: string) => ['my-leaves', 'list', status ?? 'ALL'] as const,
  balance: () => ['my-leaves', 'balance'] as const,
  types: () => ['leave-types'] as const,
};

export function useMyLeaves(status?: string) {
  return useQuery({
    queryKey: myLeaveKeys.list(status),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<MyLeaveRequest[]>>('/leaves', {
        params: { limit: 50, ...(status && status !== 'ALL' ? { status } : {}) },
      });
      return res.data;
    },
  });
}

export function useMyLeaveBalance() {
  return useQuery({
    queryKey: myLeaveKeys.balance(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<LeaveBalance[]>>('/leaves/my/balance');
      return res.data.data;
    },
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: myLeaveKeys.types(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<LeaveType[]>>('/leave-types');
      return res.data.data;
    },
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ApplyLeaveInput) => {
      const res = await apiClient.post<ApiResponse<MyLeaveRequest>>('/leaves', input);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: myLeaveKeys.all });
      toast.success('Leave application submitted');
    },
    onError: () => {
      toast.error('Failed to submit leave application');
    },
  });
}

export function useCancelMyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/leaves/${id}/cancel`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: myLeaveKeys.all });
      toast.success('Leave request cancelled');
    },
    onError: () => {
      toast.error('Failed to cancel leave request');
    },
  });
}
