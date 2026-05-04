import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import type { ApiResponse } from '@hrms/shared-types';

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  daysAllowed: number;
  isPaid: boolean;
  isCarryForward: boolean;
  maxCarryForward: number;
  isEncashable: boolean;
  applicableAfterDays: number;
  colorHex: string;
  isActive: boolean;
}

export interface LeaveTypePayload {
  name: string;
  code: string;
  daysAllowed: number;
  isPaid: boolean;
  isCarryForward: boolean;
  maxCarryForward: number;
  isEncashable: boolean;
  applicableAfterDays: number;
  colorHex: string;
}

const leaveTypeKeys = {
  all: ['leave-types'] as const,
  list: () => ['leave-types', 'list'] as const,
};

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveTypeKeys.list(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<LeaveType[]>>('/leave-types');
      const raw = res.data.data;
      return Array.isArray(raw) ? raw : [];
    },
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: LeaveTypePayload) => {
      const res = await apiClient.post<ApiResponse<LeaveType>>('/leave-types', data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: leaveTypeKeys.all });
      toast.success('Leave type created');
    },
  });
}

export function useUpdateLeaveType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<LeaveTypePayload>) => {
      const res = await apiClient.patch<ApiResponse<LeaveType>>(`/leave-types/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: leaveTypeKeys.all });
      toast.success('Leave type updated');
    },
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/leave-types/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: leaveTypeKeys.all });
      toast.success('Leave type deleted');
    },
  });
}
